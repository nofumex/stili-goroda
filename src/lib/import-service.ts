import { PrismaClient } from '@prisma/client';
import { ExportData, ImportResult, ImportOptions } from '@/types';
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export class ImportService {
  async importData(zipBuffer: Buffer, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const zip = await JSZip.loadAsync(zipBuffer);
      
      // Ищем JSON файл с данными
      const dataFile = zip.file('data.json');
      if (!dataFile) {
        throw new Error('Файл data.json не найден в архиве');
      }
      
      const jsonContent = await dataFile.async('string');
      const data: ExportData = JSON.parse(jsonContent);
      
      const result: ImportResult = {
        success: true,
        processed: {
          products: 0,
          categories: 0,
          media: 0,
        },
        errors: [],
        warnings: [],
        skipped: {
          products: [],
          categories: [],
          media: [],
        },
      };
      
      // Импортируем категории сначала
      await this.importCategories(data.categories, options, result);
      
      // Затем импортируем товары
      await this.importProducts(data.products, options, result);
      
      // Обрабатываем медиафайлы если нужно
      if (options.importMedia !== false) {
        await this.importMedia(zip, data.mediaIndex, options, result);
      }
      
      return result;
      
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        processed: { products: 0, categories: 0, media: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        skipped: { products: [], categories: [], media: [] },
      };
    }
  }

  private async importCategories(
    categories: any[], 
    options: ImportOptions, 
    result: ImportResult
  ): Promise<void> {
    for (const categoryData of categories) {
      try {
        // Проверяем, существует ли категория
        const existingCategory = await prisma.category.findFirst({
          where: { slug: categoryData.slug }
        });
        
        if (existingCategory) {
          if (options.skipExisting) {
            result.skipped.categories.push(categoryData.name);
            result.processed.categories++;
            continue;
          }
          
          if (options.updateExisting) {
            // Обновляем существующую категорию
            await prisma.category.update({
              where: { id: existingCategory.id },
              data: {
                name: categoryData.name,
                description: categoryData.description,
                image: categoryData.image,
                isActive: categoryData.isActive,
                sortOrder: categoryData.sortOrder,
                seoTitle: categoryData.seo.title,
                seoDesc: categoryData.seo.description,
              },
            });
            result.processed.categories++;
            result.warnings.push(`Обновлена категория: ${categoryData.name}`);
          } else {
            result.skipped.categories.push(categoryData.name);
          }
        } else {
          // Создаем новую категорию
          await prisma.category.create({
            data: {
              id: categoryData.id,
              name: categoryData.name,
              slug: categoryData.slug,
              description: categoryData.description,
              image: categoryData.image,
              parentId: categoryData.parentId,
              isActive: categoryData.isActive,
              sortOrder: categoryData.sortOrder,
              seoTitle: categoryData.seo.title,
              seoDesc: categoryData.seo.description,
            },
          });
          result.processed.categories++;
        }
      } catch (error) {
        const errorMsg = `Ошибка импорта категории "${categoryData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
      }
    }
  }

  private async importProducts(
    products: any[], 
    options: ImportOptions, 
    result: ImportResult
  ): Promise<void> {
    for (const productData of products) {
      try {
        // Получаем категорию
        let category = null;
        if (productData.category) {
          category = await prisma.category.findFirst({
            where: { name: productData.category }
          });
        }
        
        // Проверяем, существует ли товар
        const existingProduct = await prisma.product.findFirst({
          where: { 
            OR: [
              { slug: productData.slug },
              { sku: productData.sku }
            ]
          }
        });
        
        if (existingProduct) {
          if (options.skipExisting) {
            result.skipped.products.push(productData.title);
            result.processed.products++;
            continue;
          }
          
          if (options.updateExisting) {
            // Обновляем существующий товар
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                title: productData.title,
                description: productData.description,
                content: productData.content,
                price: productData.price,
                oldPrice: productData.oldPrice,
                currency: productData.currency,
                stock: productData.stock,
                minOrder: productData.minOrder,
                weight: productData.weight,
                dimensions: productData.dimensions,
                material: productData.material,
                categoryId: category?.id,
                tags: productData.tags,
                images: productData.images,
                isActive: productData.isActive,
                isFeatured: productData.isFeatured,
                visibility: productData.visibility,
                seoTitle: productData.seo.title,
                seoDesc: productData.seo.description,
                metaTitle: productData.seo.metaTitle,
                metaDesc: productData.seo.metaDesc,
              },
            });
            
            // Обновляем варианты товара
            if (productData.variants && productData.variants.length > 0) {
              await this.updateProductVariants(existingProduct.id, productData.variants);
            }
            
            result.processed.products++;
            result.warnings.push(`Обновлен товар: ${productData.title}`);
          } else {
            result.skipped.products.push(productData.title);
          }
        } else {
          // Проверяем наличие категории
          if (!category?.id) {
            result.errors.push(`Товар ${productData.title} пропущен: категория не найдена`);
            result.skipped.products.push(productData.title);
            continue;
          }
          
          // Создаем новый товар
          const newProduct = await prisma.product.create({
            data: {
              id: productData.id,
              slug: productData.slug,
              sku: productData.sku,
              title: productData.title,
              description: productData.description,
              content: productData.content,
              price: productData.price,
              oldPrice: productData.oldPrice,
              currency: productData.currency,
              stock: productData.stock,
              minOrder: productData.minOrder,
              weight: productData.weight,
              dimensions: productData.dimensions,
              material: productData.material,
              categoryId: category.id,
              tags: productData.tags,
              images: productData.images,
              isActive: productData.isActive,
              isFeatured: productData.isFeatured,
              visibility: productData.visibility,
              seoTitle: productData.seo.title,
              seoDesc: productData.seo.description,
              metaTitle: productData.seo.metaTitle,
              metaDesc: productData.seo.metaDesc,
            },
          });
          
          // Создаем варианты товара
          if (productData.variants && productData.variants.length > 0) {
            await this.createProductVariants(newProduct.id, productData.variants);
          }
          
          result.processed.products++;
        }
      } catch (error) {
        const errorMsg = `Ошибка импорта товара "${productData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
      }
    }
  }

  private async updateProductVariants(productId: string, variants: any[]): Promise<void> {
    // Удаляем старые варианты
    await prisma.productVariant.deleteMany({
      where: { productId }
    });
    
    // Создаем новые варианты
    await this.createProductVariants(productId, variants);
  }

  private async createProductVariants(productId: string, variants: any[]): Promise<void> {
    for (const variantData of variants) {
      // Получаем базовую цену товара
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true }
      });
      
      if (!product) {
        console.warn(`Товар с ID ${productId} не найден для создания варианта`);
        continue;
      }
      
      // Вычисляем цену варианта (базовая цена + разница)
      const variantPrice = Number(product.price) + (variantData.priceDiff || 0);
      
      await prisma.productVariant.create({
        data: {
          id: variantData.id,
          productId,
          sku: variantData.sku,
          color: variantData.attrs.color,
          size: variantData.attrs.size,
          material: variantData.attrs.material,
          price: variantPrice, // Используем вычисленную цену
          stock: variantData.stock,
          imageUrl: variantData.imageRef, // Используем imageUrl из схемы
          isActive: variantData.isActive,
        },
      });
    }
  }

  private async importMedia(
    zip: JSZip, 
    mediaIndex: any[], 
    options: ImportOptions, 
    result: ImportResult
  ): Promise<void> {
    const mediaFolder = zip.folder('media');
    if (!mediaFolder) {
      result.warnings.push('Папка media не найдена в архиве');
      return;
    }
    
    // Создаем папку uploads если её нет
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.promises.mkdir(uploadsPath, { recursive: true });
    } catch (error) {
      console.warn('Не удалось создать папку uploads:', error);
    }
    
    for (const media of mediaIndex) {
      try {
        const mediaFile = mediaFolder.file(media.fileName);
        if (mediaFile) {
          // Получаем содержимое файла
          const fileBuffer = await mediaFile.async('nodebuffer');
          
          // Сохраняем файл в папку uploads
          const filePath = path.join(uploadsPath, media.fileName);
          await fs.promises.writeFile(filePath, fileBuffer);
          
          result.processed.media++;
          console.log(`✅ Сохранен файл: ${media.fileName}`);
        } else {
          result.warnings.push(`Файл не найден: ${media.fileName}`);
        }
      } catch (error) {
        const errorMsg = `Ошибка импорта медиафайла "${media.fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
      }
    }
  }
}
