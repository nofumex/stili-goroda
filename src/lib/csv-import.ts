import Papa from 'papaparse';
import { db } from './db';
import { generateSlug, generateSKU } from './utils';
import { ProductCategory, ProductVisibility } from '@/types';

export interface CSVProductRow {
  product_id?: string;
  sku: string;
  title: string;
  category: string;
  price: string;
  currency?: string;
  old_price?: string;
  stock: string;
  description?: string;
  material?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  tags?: string;
  images?: string;
  seo_title?: string;
  seo_description?: string;
  slug?: string;
  visibility?: string;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  warnings: string[];
}

export interface ImportOptions {
  validateOnly?: boolean;
  updateExisting?: boolean;
  skipInvalid?: boolean;
  categoryMapping?: Record<string, string>;
}

export class CSVImporter {
  private errors: string[] = [];
  private warnings: string[] = [];
  private processed = 0;
  private created = 0;
  private updated = 0;

  async importFromCSV(csvContent: string, options: ImportOptions = {}): Promise<ImportResult> {
    this.reset();

    try {
      const parseResult = Papa.parse<CSVProductRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => (typeof value === 'string' ? value.trim() : value),
      });

      if (parseResult.errors.length > 0) {
        this.errors.push(...parseResult.errors.map(e => `CSV Parse Error: ${e.message}`));
        return this.getResult();
      }

      const rows = parseResult.data;
      if (rows.length === 0) {
        this.errors.push('CSV файл пуст или не содержит данных');
        return this.getResult();
      }

      const requiredColumns = ['sku', 'title', 'category', 'price', 'stock'];
      const firstRow = rows[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      if (missingColumns.length > 0) {
        this.errors.push(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
        return this.getResult();
      }

      const categories = await db.category.findMany({ select: { id: true, name: true, slug: true } });
      const categoryMap = new Map<string, string>();
      categories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
        categoryMap.set(cat.slug.toLowerCase(), cat.id);
      });
      if (options.categoryMapping) {
        Object.entries(options.categoryMapping).forEach(([key, value]) => {
          categoryMap.set(key.toLowerCase(), value);
        });
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        try {
          await this.processRow(row, rowNumber, categoryMap, options);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          this.errors.push(`Строка ${rowNumber}: ${errorMessage}`);
          if (!options.skipInvalid) break;
        }
        this.processed++;
      }

      return this.getResult();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.errors.push(`Общая ошибка импорта: ${errorMessage}`);
      return this.getResult();
    }
  }

  private async processRow(
    row: CSVProductRow,
    rowNumber: number,
    categoryMap: Map<string, string>,
    options: ImportOptions
  ): Promise<void> {
    if (!row.sku) throw new Error('Отсутствует SKU');
    if (!row.title) throw new Error('Отсутствует название товара');
    if (!row.category) throw new Error('Отсутствует категория');
    if (!row.price) throw new Error('Отсутствует цена');
    if (!row.stock) throw new Error('Отсутствует количество на складе');

    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) throw new Error('Некорректная цена');

    const stock = parseInt(row.stock);
    if (isNaN(stock) || stock < 0) throw new Error('Некорректное количество на складе');

    const oldPrice = row.old_price ? parseFloat(row.old_price) : null;
    if (oldPrice !== null && (isNaN(oldPrice) || oldPrice < price)) {
      this.warnings.push(`Строка ${rowNumber}: Старая цена меньше или равна текущей цене`);
    }

    const categoryId = categoryMap.get(row.category.toLowerCase());
    if (!categoryId) throw new Error(`Категория "${row.category}" не найдена`);

    const weight = row.weight ? parseFloat(row.weight) : null;
    const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const images = row.images ? row.images.split(',').map(img => img.trim()).filter(Boolean) : [];

    let slug = row.slug || generateSlug(row.title);
    let sku = row.sku;
    if (!sku) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      sku = generateSKU(category?.name || 'PRODUCT', row.title);
    }

    let productCategory: ProductCategory = 'MIDDLE';
    if (row.category) {
      const categoryLower = row.category.toLowerCase();
      if (categoryLower.includes('эконом') || categoryLower.includes('economy')) productCategory = 'ECONOMY';
      else if (categoryLower.includes('люкс') || categoryLower.includes('luxury') || categoryLower.includes('премиум')) productCategory = 'LUXURY';
    }

    let visibility: ProductVisibility = 'VISIBLE';
    if (row.visibility) {
      const visibilityLower = row.visibility.toLowerCase();
      if (visibilityLower === 'hidden' || visibilityLower === 'скрытый') visibility = 'HIDDEN';
      else if (visibilityLower === 'draft' || visibilityLower === 'черновик') visibility = 'DRAFT';
    }

    const productData = {
      sku,
      title: row.title,
      slug,
      description: row.description || '',
      price,
      oldPrice,
      currency: row.currency || 'RUB',
      stock,
      material: row.material || '',
      dimensions: row.dimensions || '',
      weight,
      category: productCategory,
      tags,
      images,
      categoryId,
      visibility,
      isActive: true,
      isInStock: stock > 0,
      seoTitle: row.seo_title || '',
      seoDesc: row.seo_description || '',
      metaTitle: row.seo_title || row.title,
      metaDesc: row.seo_description || row.description || '',
    };

    if (options.validateOnly) return;

    const existingProduct = await db.product.findFirst({
      where: { OR: [{ sku }, { slug }] },
    });

    if (existingProduct) {
      if (options.updateExisting) {
        await db.product.update({ where: { id: existingProduct.id }, data: productData });
        this.updated++;
        this.warnings.push(`Строка ${rowNumber}: Товар "${row.title}" обновлён`);
      } else {
        this.warnings.push(`Строка ${rowNumber}: Товар с SKU "${sku}" уже существует (пропущен)`);
      }
    } else {
      await db.product.create({ data: productData });
      this.created++;
    }
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.processed = 0;
    this.created = 0;
    this.updated = 0;
  }

  private getResult(): ImportResult {
    return {
      success: this.errors.length === 0,
      processed: this.processed,
      created: this.created,
      updated: this.updated,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

export function generateSampleCSV(): string {
  const sampleData = [
    {
      product_id: '',
      sku: 'BED001',
      title: 'Комплект постельного белья "Образец"',
      category: 'Постельное белье',
      price: '2500',
      currency: 'RUB',
      old_price: '3000',
      stock: '10',
      description: 'Качественный комплект постельного белья',
      material: '100% хлопок',
      size: '1.5-спальный',
      dimensions: '145x210 см',
      weight: '1.2',
      tags: 'хлопок,1.5-спальный,комплект',
      images: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
      seo_title: 'Комплект постельного белья Образец - купить в Москве',
      seo_description: 'Качественный комплект постельного белья из 100% хлопка',
      slug: 'komplekt-obrazets',
      visibility: 'VISIBLE',
    },
    {
      product_id: '',
      sku: 'PIL001',
      title: 'Подушка ортопедическая "Образец"',
      category: 'Подушки',
      price: '1200',
      currency: 'RUB',
      old_price: '',
      stock: '15',
      description: 'Ортопедическая подушка для комфортного сна',
      material: 'Пенополиуретан',
      size: '60x40 см',
      dimensions: '60x40x12 см',
      weight: '0.8',
      tags: 'ортопедическая,подушка,пенополиуретан',
      images: 'https://example.com/pillow1.jpg',
      seo_title: 'Ортопедическая подушка Образец',
      seo_description: 'Удобная ортопедическая подушка для здорового сна',
      slug: 'podushka-obrazets',
      visibility: 'VISIBLE',
    },
  ];

  const csv = Papa.unparse(sampleData, { header: true, delimiter: ';', newline: '\r\n' });
  return '\uFEFF' + csv;
}

export function validateCSVStructure(csvContent: string): { isValid: boolean; errors: string[]; columns: string[] } {
  const errors: string[] = [];
  try {
    const parseResult = Papa.parse(csvContent, { header: true, preview: 1 });
    if (parseResult.errors.length > 0) {
      errors.push(...parseResult.errors.map(e => e.message));
      return { isValid: false, errors, columns: [] };
    }
    const columns = parseResult.meta.fields || [];
    const requiredColumns = ['sku', 'title', 'category', 'price', 'stock'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
    }
    return { isValid: errors.length === 0, errors, columns };
  } catch {
    errors.push('Ошибка при анализе CSV файла');
    return { isValid: false, errors, columns: [] };
  }
}

export async function exportProductsToCSV(filters?: any): Promise<string> {
  const products = await db.product.findMany({
    include: { categoryObj: true },
    where: filters,
  });

  const csvData = products.map(product => ({
    product_id: product.id,
    sku: product.sku,
    title: product.title,
    category: product.categoryObj.name,
    price: product.price.toString(),
    currency: product.currency,
    old_price: product.oldPrice?.toString() || '',
    stock: product.stock.toString(),
    description: product.description || '',
    material: product.material || '',
    size: '',
    dimensions: product.dimensions || '',
    weight: product.weight?.toString() || '',
    tags: product.tags.join(','),
    images: product.images.join(','),
    seo_title: product.seoTitle || '',
    seo_description: product.seoDesc || '',
    slug: product.slug,
    visibility: product.visibility,
  }));

  const csv = Papa.unparse(csvData, { header: true, delimiter: ';', newline: '\r\n' });
  return '\uFEFF' + csv;
}



