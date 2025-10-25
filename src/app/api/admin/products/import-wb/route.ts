import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';
import { importFromWildberries } from '@/lib/wildberries-parser';
import { generateSlug } from '@/lib/utils';

/**
 * POST /api/admin/products/import-wb
 * Импорт товара с WildBerries по ссылке
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка прав доступа
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const body = await request.json();
    const { url, categoryId } = body;

    // Валидация входных данных
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Необходимо указать ссылку на товар WildBerries' },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Необходимо выбрать категорию товара' },
        { status: 400 }
      );
    }

    // Проверяем существование категории
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Извлекаем ID товара из URL для проверки дубликатов
    const { extractProductId } = await import('@/lib/wildberries-parser');
    const wbProductId = extractProductId(url);
    
    if (!wbProductId) {
      return NextResponse.json(
        { success: false, error: 'Не удалось извлечь ID товара из ссылки' },
        { status: 400 }
      );
    }

    // Проверяем, не импортирован ли уже этот товар
    const existingProduct = await db.product.findFirst({
      where: {
        sku: {
          startsWith: `WB-${wbProductId}-`,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Товар с WildBerries ID ${wbProductId} уже импортирован (SKU: ${existingProduct.sku}, Slug: ${existingProduct.slug}). Используйте редактирование для обновления.` 
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Импортируем данные с WildBerries
    const productData = await importFromWildberries(url);
    
    if (!productData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не удалось импортировать товар с WildBerries. Проверьте ссылку и попробуйте снова.' 
        },
        { status: 400 }
      );
    }

    // Генерируем slug для товара
    let slug = generateSlug(productData.title);
    
    // Проверяем уникальность slug
    let slugExists = await db.product.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(productData.title)}-${counter}`;
      slugExists = await db.product.findUnique({ where: { slug } });
      counter++;
    }

    // Генерируем уникальный SKU с ID товара WildBerries
    let sku = `WB-${wbProductId}-${Date.now()}`;
    let skuExists = await db.product.findUnique({ where: { sku } });
    counter = 1;
    while (skuExists) {
      sku = `WB-${wbProductId}-${Date.now()}-${counter}`;
      skuExists = await db.product.findUnique({ where: { sku } });
      counter++;
    }

    // Создаем товар в базе данных
    const product = await db.product.create({
      data: {
        sku,
        slug,
        title: productData.title,
        description: productData.description,
        content: productData.description, // Используем описание как контент
        price: productData.price,
        oldPrice: productData.oldPrice,
        stock: productData.stock,
        material: productData.material,
        tags: productData.tags,
        images: productData.images,
        categoryId,
        visibility: 'DRAFT', // Создаем как черновик для проверки
        isActive: true,
        isInStock: productData.stock > 0,
        isFeatured: false,
      },
      include: {
        categoryObj: true,
      },
    });

    // Создаем варианты товара, если они есть
    if (productData.variants && productData.variants.length > 0) {
      const variantsToCreate = productData.variants.map((variant) => ({
        productId: product.id,
        size: variant.size || null,
        color: variant.color || null,
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku,
        isActive: true,
      }));

      // Создаем варианты по одному, чтобы обработать возможные дубликаты SKU
      for (const variantData of variantsToCreate) {
        try {
          await db.productVariant.create({
            data: variantData,
          });
        } catch (error: any) {
          // Если SKU уже существует, генерируем новый
          if (error.code === 'P2002') {
            console.log(`[WB Import] SKU ${variantData.sku} already exists, generating new one...`);
            variantData.sku = `${variantData.sku}-${Math.random().toString(36).substring(2, 7)}`;
            await db.productVariant.create({
              data: variantData,
            });
          } else {
            throw error;
          }
        }
      }
    }

    // Загружаем товар с вариантами для ответа
    const productWithVariants = await db.product.findUnique({
      where: { id: product.id },
      include: {
        categoryObj: true,
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: productWithVariants,
      message: 'Товар успешно импортирован из WildBerries',
    });

  } catch (error) {
    console.error('WildBerries import error:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка импорта товара с WildBerries' 
      },
      { status: 500 }
    );
  }
}

