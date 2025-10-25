import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth';
import { ImportService } from '@/lib/import-service';
import { ImportOptions } from '@/types';
import { validateFileWithContent } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Валидация файла
    const fileValidation = await validateFileWithContent(file, ['zip', 'json']);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка валидации файла',
          details: fileValidation.errors,
          warnings: fileValidation.warnings
        },
        { status: 400 }
      );
    }

    // Показываем предупреждения если есть
    if (fileValidation.warnings.length > 0) {
      console.warn('File validation warnings:', fileValidation.warnings);
    }

    // Parse options
    let options: ImportOptions = {
      skipExisting: false,
      updateExisting: false,
      importMedia: true,
    };

    if (optionsStr) {
      try {
        const parsedOptions = JSON.parse(optionsStr);
        options = { ...options, ...parsedOptions };
      } catch (error) {
        console.warn('Failed to parse import options:', error);
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    // Import data
    const importService = new ImportService();
    const result = await importService.importData(zipBuffer, options);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success ? 'Данные успешно импортированы' : 'Ошибка импорта данных',
    });

  } catch (error) {
    console.error('Import error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка импорта данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}