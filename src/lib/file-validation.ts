import { z } from 'zod';

// Схемы валидации для разных типов файлов
export const fileValidationSchemas = {
  // CSV файлы
  csv: z.object({
    type: z.string().refine(
      (type) => ['text/csv', 'application/csv', 'text/plain'].includes(type) || type.startsWith('text/'),
      { message: 'Файл должен быть CSV формата' }
    ),
    name: z.string().refine(
      (name) => name.toLowerCase().endsWith('.csv'),
      { message: 'Файл должен иметь расширение .csv' }
    ),
    size: z.number().max(10 * 1024 * 1024, 'Размер файла не должен превышать 10MB')
  }),

  // XML файлы
  xml: z.object({
    type: z.string().refine(
      (type) => ['text/xml', 'application/xml', 'text/plain'].includes(type) || type.startsWith('text/'),
      { message: 'Файл должен быть XML формата' }
    ),
    name: z.string().refine(
      (name) => name.toLowerCase().endsWith('.xml'),
      { message: 'Файл должен иметь расширение .xml' }
    ),
    size: z.number().max(50 * 1024 * 1024, 'Размер файла не должен превышать 50MB')
  }),

  // ZIP архивы
  zip: z.object({
    type: z.string().refine(
      (type) => ['application/zip', 'application/x-zip-compressed'].includes(type) || type.startsWith('application/'),
      { message: 'Файл должен быть ZIP архивом' }
    ),
    name: z.string().refine(
      (name) => name.toLowerCase().endsWith('.zip'),
      { message: 'Файл должен иметь расширение .zip' }
    ),
    size: z.number().max(100 * 1024 * 1024, 'Размер файла не должен превышать 100MB')
  }),

  // JSON файлы
  json: z.object({
    type: z.string().refine(
      (type) => ['application/json', 'text/json', 'text/plain'].includes(type) || type.startsWith('application/'),
      { message: 'Файл должен быть JSON формата' }
    ),
    name: z.string().refine(
      (name) => name.toLowerCase().endsWith('.json'),
      { message: 'Файл должен иметь расширение .json' }
    ),
    size: z.number().max(20 * 1024 * 1024, 'Размер файла не должен превышать 20MB')
  })
};

// Типы файлов для импорта
export type FileType = keyof typeof fileValidationSchemas;

// Интерфейс для результата валидации
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileType?: FileType;
}

// Основная функция валидации файла
export function validateFile(file: File, expectedTypes: FileType[] = ['csv', 'xml', 'zip', 'json']): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Проверяем базовые параметры файла
  if (!file) {
    return { isValid: false, errors: ['Файл не найден'], warnings: [] };
  }

  if (file.size === 0) {
    return { isValid: false, errors: ['Файл пустой'], warnings: [] };
  }

  // Определяем тип файла по расширению и MIME типу
  const detectedType = detectFileType(file);
  
  if (!detectedType) {
    return { 
      isValid: false, 
      errors: [`Неподдерживаемый тип файла. Поддерживаются: ${expectedTypes.join(', ')}`], 
      warnings: [] 
    };
  }

  if (!expectedTypes.includes(detectedType)) {
    return { 
      isValid: false, 
      errors: [`Файл типа ${detectedType} не поддерживается для данного импорта. Поддерживаются: ${expectedTypes.join(', ')}`], 
      warnings: [] 
    };
  }

  // Валидируем файл по схеме
  const schema = fileValidationSchemas[detectedType];
  const validationResult = schema.safeParse({
    type: file.type,
    name: file.name,
    size: file.size
  });

  if (!validationResult.success) {
    validationResult.error.errors.forEach(error => {
      errors.push(error.message);
    });
  }

  // Дополнительные проверки
  if (file.size > 1024 * 1024) { // Больше 1MB
    warnings.push('Файл довольно большой, импорт может занять время');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileType: detectedType
  };
}

// Функция для определения типа файла
export function detectFileType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // Проверяем по расширению
  if (name.endsWith('.csv') || type.includes('csv')) return 'csv';
  if (name.endsWith('.xml') || type.includes('xml')) return 'xml';
  if (name.endsWith('.zip') || type.includes('zip')) return 'zip';
  if (name.endsWith('.json') || type.includes('json')) return 'json';

  return null;
}

// Валидация содержимого CSV файла
export async function validateCSVContent(file: File): Promise<{ isValid: boolean; errors: string[]; columns: string[] }> {
  const errors: string[] = [];
  
  try {
    const content = await file.text();
    
    // Проверяем кодировку (должна быть UTF-8)
    if (content.includes('\uFFFD')) {
      errors.push('Файл содержит недопустимые символы. Убедитесь, что файл сохранен в кодировке UTF-8');
    }

    // Проверяем наличие данных
    if (content.trim().length === 0) {
      errors.push('Файл не содержит данных');
      return { isValid: false, errors, columns: [] };
    }

    // Парсим CSV для проверки структуры
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      errors.push('Файл должен содержать заголовки и хотя бы одну строку данных');
      return { isValid: false, errors, columns: [] };
    }

    // Извлекаем заголовки
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredColumns = ['sku', 'title', 'category', 'price', 'stock'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
    }

    // Проверяем количество колонок в каждой строке
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length !== headers.length) {
        errors.push(`Строка ${i + 1}: количество колонок не соответствует заголовкам`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      columns: headers
    };

  } catch (error) {
    errors.push('Ошибка при чтении файла');
    return { isValid: false, errors, columns: [] };
  }
}

// Валидация содержимого XML файла
export async function validateXMLContent(file: File): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const content = await file.text();
    
    // Проверяем, что это валидный XML
    if (!content.trim().startsWith('<')) {
      errors.push('Файл не является валидным XML документом');
      return { isValid: false, errors };
    }

    // Проверяем наличие корневого элемента
    const rootMatch = content.match(/<(\w+)[^>]*>/);
    if (!rootMatch) {
      errors.push('XML файл не содержит корневого элемента');
      return { isValid: false, errors };
    }

    // Проверяем закрытие тегов (базовая проверка)
    const openTags = content.match(/<\w+[^>]*>/g) || [];
    const closeTags = content.match(/<\/\w+>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      errors.push('XML файл содержит незакрытые теги');
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    errors.push('Ошибка при чтении XML файла');
    return { isValid: false, errors };
  }
}

// Валидация ZIP архива
export async function validateZIPContent(file: File): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Проверяем сигнатуру ZIP файла
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // ZIP файл должен начинаться с "PK" (0x504B)
    if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      errors.push('Файл не является валидным ZIP архивом');
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    errors.push('Ошибка при чтении ZIP файла');
    return { isValid: false, errors };
  }
}

// Комплексная валидация файла с проверкой содержимого
export async function validateFileWithContent(file: File, expectedTypes: FileType[] = ['csv', 'xml', 'zip', 'json']): Promise<FileValidationResult> {
  // Сначала базовая валидация
  const basicValidation = validateFile(file, expectedTypes);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const errors = [...basicValidation.errors];
  const warnings = [...basicValidation.warnings];

  // Дополнительная валидация содержимого
  if (basicValidation.fileType === 'csv') {
    const csvValidation = await validateCSVContent(file);
    errors.push(...csvValidation.errors);
  } else if (basicValidation.fileType === 'xml') {
    const xmlValidation = await validateXMLContent(file);
    errors.push(...xmlValidation.errors);
  } else if (basicValidation.fileType === 'zip') {
    const zipValidation = await validateZIPContent(file);
    errors.push(...zipValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileType: basicValidation.fileType
  };
}
