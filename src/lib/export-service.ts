import { PrismaClient } from '@prisma/client';
import { ExportData, ExportProduct, ExportCategory, MediaFile } from '@/types';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export class ExportService {
  async exportData(format: 'zip' | 'json' | 'xlsx' = 'zip'): Promise<Buffer> {
    try {
      // Собираем все данные для экспорта
      const exportData = await this.collectExportData();
      
      switch (format) {
        case 'json':
          return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
          
        case 'xlsx':
          return await this.createXLSXExport(exportData);
          
        case 'zip':
        default:
          return await this.createZIPExport(exportData);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async collectExportData(): Promise<ExportData> {
    // Получаем все товары с вариантами
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        categoryObj: true,
        reviews: true,
      },
    });

    // Получаем все категории
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        parent: true,
      },
    });

    // Преобразуем данные в формат экспорта
    const exportProducts: ExportProduct[] = products.map(product => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku || '',
      title: product.title,
      description: product.description || '',
      content: product.content || '',
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
      currency: product.currency || 'RUB',
      stock: product.stock,
      minOrder: product.minOrder || 1,
      weight: product.weight ? Number(product.weight) : undefined,
      dimensions: product.dimensions || undefined,
      material: product.material || undefined,
      category: product.categoryObj?.name || 'Без категории',
      tags: product.tags || [],
      images: product.images || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      isInStock: product.stock > 0,
      visibility: product.visibility || 'VISIBLE',
      seo: {
        title: product.seoTitle || undefined,
        description: product.seoDesc || undefined,
        metaTitle: product.metaTitle || undefined,
        metaDesc: product.metaDesc || undefined,
      },
      gallery: [], // В схеме нет поля gallery
      thumbnail: product.images[0] || '', // Используем первое изображение как thumbnail
      variants: product.variants.map(variant => ({
        id: variant.id,
        sku: variant.sku || '',
        attrs: {
          color: variant.color || undefined,
          size: variant.size || undefined,
          material: variant.material || undefined,
        },
        priceDiff: Number(variant.price) - Number(product.price), // Вычисляем разницу в цене
        stock: variant.stock || 0,
        imageRef: variant.imageUrl || undefined, // Используем imageUrl из схемы
        isActive: variant.isActive,
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    const exportCategories: ExportCategory[] = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      image: category.image || undefined,
      parentId: category.parentId || undefined,
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
      seo: {
        title: category.seoTitle || undefined,
        description: category.seoDesc || undefined,
      },
      children: category.children.map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description || undefined,
        image: child.image || undefined,
        parentId: child.parentId || undefined,
        isActive: child.isActive,
        sortOrder: child.sortOrder || 0,
        seo: {
          title: child.seoTitle || undefined,
          description: child.seoDesc || undefined,
        },
      })),
    }));

    // Создаем индекс медиафайлов
    const mediaIndex: MediaFile[] = [];
    const allImages = new Set<string>();
    
    // Собираем все уникальные изображения
    exportProducts.forEach(product => {
      if (product.images) {
        product.images.forEach(img => allImages.add(img));
      }
      if (product.thumbnail) {
        allImages.add(product.thumbnail);
      }
      if (product.gallery) {
        product.gallery.forEach(img => allImages.add(img));
      }
      product.variants.forEach(variant => {
        if (variant.imageRef) {
          allImages.add(variant.imageRef);
        }
      });
    });

    exportCategories.forEach(category => {
      if (category.image) {
        allImages.add(category.image);
      }
    });

    // Создаем индекс медиафайлов
    allImages.forEach(imageUrl => {
      if (imageUrl && imageUrl.startsWith('http')) {
        mediaIndex.push({
          fileName: path.basename(new URL(imageUrl).pathname),
          checksum: this.generateChecksum(imageUrl),
          originalUrl: imageUrl,
          size: 0, // Будет заполнено при скачивании
          mimeType: this.getMimeTypeFromUrl(imageUrl),
        });
      }
    });

    return {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      products: exportProducts,
      categories: exportCategories,
      mediaIndex,
      settings: {
        siteName: 'Стили Города',
        siteDescription: 'Интернет-магазин городской одежды и аксессуаров',
        contactEmail: 'info@stili-goroda.ru',
        contactPhone: '+7 (XXX) XXX-XX-XX',
        address: 'Адрес компании',
        workingHours: 'Пн-Пт: 9:00-18:00',
        socialLinks: {
          vk: 'https://vk.com/stili_goroda',
          telegram: 'https://t.me/stili_goroda',
        },
        deliverySettings: {
          freeDeliveryFrom: 5000,
          defaultDeliveryPrice: 500,
        },
      },
    };
  }

  private async createZIPExport(data: ExportData): Promise<Buffer> {
    const zip = new JSZip();
    
    // Добавляем JSON файл с данными
    zip.file('data.json', JSON.stringify(data, null, 2));
    
    // Добавляем медиафайлы из базы данных
    const mediaFolder = zip.folder('media');
    if (mediaFolder) {
      console.log('📥 Скачиваем изображения из базы данных...');
      
      // Собираем все уникальные URL изображений
      const imageUrls = new Set<string>();
      
      // Из товаров
      data.products.forEach(product => {
        // Основные изображения товара
        if (product.images) {
          product.images.forEach(img => {
            if (img && img.startsWith('http')) {
              imageUrls.add(img);
            }
          });
        }
        // Thumbnail (первое изображение)
        if (product.thumbnail && product.thumbnail.startsWith('http')) {
          imageUrls.add(product.thumbnail);
        }
        // Из вариантов товаров
        product.variants.forEach(variant => {
          if (variant.imageRef && variant.imageRef.startsWith('http')) {
            imageUrls.add(variant.imageRef);
          }
        });
      });
      
      // Из категорий
      data.categories.forEach(category => {
        if (category.image && category.image.startsWith('http')) {
          imageUrls.add(category.image);
        }
      });
      
      console.log(`🔍 Найдено ${imageUrls.size} уникальных изображений для скачивания`);
      
      // Скачиваем изображения
      let downloadedCount = 0;
      for (const imageUrl of Array.from(imageUrls)) {
        try {
          const fileName = path.basename(new URL(imageUrl).pathname);
          const response = await fetch(imageUrl);
          
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            mediaFolder.file(fileName, imageBuffer);
            downloadedCount++;
            console.log(`✅ Скачано: ${fileName}`);
          } else {
            console.warn(`⚠️ Не удалось скачать: ${imageUrl} (${response.status})`);
          }
        } catch (error) {
          console.warn(`❌ Ошибка при скачивании ${imageUrl}:`, error);
        }
      }
      
      console.log(`📊 Скачано ${downloadedCount} из ${imageUrls.size} изображений`);
    }
    
    // Добавляем README файл
    zip.file('README.md', `# Экспорт данных Стили Города
    
Дата экспорта: ${data.exportedAt}
Версия схемы: ${data.schemaVersion}

## Содержимое архива:
- data.json - основные данные (товары, категории, настройки)
- media/ - папка с реальными изображениями товаров
- README.md - этот файл

## Статистика:
- Товаров: ${data.products.length}
- Категорий: ${data.categories.length}
- Медиафайлов: ${data.mediaIndex.length}

## Структура данных:
- data.json содержит полную информацию о товарах, категориях и настройках
- media/ содержит все изображения в оригинальном качестве
- Все изображения имеют уникальные имена файлов

## Импорт:
Для импорта данных используйте админ-панель сайта.
`);
    
    return await zip.generateAsync({ type: 'nodebuffer' });
  }

  private async createXLSXExport(data: ExportData): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    // Лист с товарами
    const productsSheet = XLSX.utils.json_to_sheet(
      data.products.map(product => ({
        'ID': product.id,
        'SKU': product.sku,
        'Название': product.title,
        'Описание': product.description,
        'Цена': product.price,
        'Старая цена': product.oldPrice || '',
        'Валюта': product.currency,
        'Остаток': product.stock,
        'Мин. заказ': product.minOrder,
        'Вес': product.weight || '',
        'Размеры': product.dimensions || '',
        'Материал': product.material || '',
        'Категория': product.category,
        'Теги': product.tags.join(', '),
        'Активен': product.isActive ? 'Да' : 'Нет',
        'Рекомендуемый': product.isFeatured ? 'Да' : 'Нет',
        'В наличии': product.isInStock ? 'Да' : 'Нет',
        'Видимость': product.visibility,
        'SEO заголовок': product.seo.title || '',
        'SEO описание': product.seo.description || '',
        'Изображения': product.images.join(', '),
        'Галерея': product.gallery.join(', '),
        'Миниатюра': product.thumbnail,
        'Вариантов': product.variants.length,
        'Создан': product.createdAt,
        'Обновлен': product.updatedAt,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Товары');
    
    // Лист с категориями
    const categoriesSheet = XLSX.utils.json_to_sheet(
      data.categories.map(category => ({
        'ID': category.id,
        'Название': category.name,
        'Slug': category.slug,
        'Описание': category.description || '',
        'Изображение': category.image || '',
        'Родительская категория': category.parentId || '',
        'Активна': category.isActive ? 'Да' : 'Нет',
        'Порядок сортировки': category.sortOrder,
        'SEO заголовок': category.seo.title || '',
        'SEO описание': category.seo.description || '',
        'Дочерних категорий': category.children?.length || 0,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Категории');
    
    // Лист с настройками
    if (data.settings) {
      const settingsSheet = XLSX.utils.json_to_sheet([
        { 'Параметр': 'Название сайта', 'Значение': data.settings.siteName },
        { 'Параметр': 'Описание сайта', 'Значение': data.settings.siteDescription },
        { 'Параметр': 'Email', 'Значение': data.settings.contactEmail },
        { 'Параметр': 'Телефон', 'Значение': data.settings.contactPhone },
        { 'Параметр': 'Адрес', 'Значение': data.settings.address },
        { 'Параметр': 'Часы работы', 'Значение': data.settings.workingHours },
        { 'Параметр': 'Бесплатная доставка от', 'Значение': data.settings.deliverySettings.freeDeliveryFrom },
        { 'Параметр': 'Цена доставки по умолчанию', 'Значение': data.settings.deliverySettings.defaultDeliveryPrice },
      ]);
      XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Настройки');
    }
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private generateChecksum(url: string): string {
    // Простая заглушка для генерации контрольной суммы
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = path.extname(new URL(url).pathname).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
}
