import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';
import { 
  importFromWildberries, 
  extractProductId,
  parseMultipleProductUrls,
  importMultipleProducts
} from '@/lib/wildberries-parser';
import { generateSlug } from '@/lib/utils';

/**
 * Получает или создает категорию по названию
 * @param categoryName - Название категории
 * @returns ID категории
 */
async function getOrCreateCategory(categoryName: string): Promise<string> {
  if (!categoryName || !categoryName.trim()) {
    // Если категории нет, используем дефолтную
    categoryName = 'Без категории';
  }

  // Генерируем slug из названия
  const slug = generateSlug(categoryName);

  // Ищем существующую категорию
  let category = await db.category.findUnique({
    where: { slug },
  });

  // Если категория не найдена, создаем новую
  if (!category) {
    category = await db.category.create({
      data: {
        name: categoryName,
        slug,
        description: `Категория "${categoryName}" создана автоматически при импорте из WildBerries`,
        isActive: true,
      },
    });
    console.log(`[WB Import] Создана новая категория: ${categoryName} (ID: ${category.id})`);
  }

  return category.id;
}

/**
 * POST /api/admin/products/import-wb
 * Импорт товара/товаров с WildBerries по ссылке
 * Поддерживает импорт одного товара или всех товаров продавца
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
        { success: false, error: 'Необходимо указать ссылку на товар или продавца WildBerries' },
        { status: 400 }
      );
    }

    // Если categoryId указан, проверяем его существование
    if (categoryId && typeof categoryId === 'string') {
      const category = await db.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Указанная категория не найдена' },
          { status: 404 }
        );
      }
    }

    // Проверяем, это множественные ссылки или одна
    const multipleUrls = parseMultipleProductUrls(url);
    
    // Если найдено несколько ссылок - импортируем их все
    if (multipleUrls.length > 1) {
      console.log(`[WB Import] Множественный импорт: ${multipleUrls.length} товаров...`);
      
      const productsData = await importMultipleProducts(multipleUrls);
      
      if (!productsData || productsData.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Не удалось импортировать товары. Проверьте ссылки и попробуйте снова.' 
          },
          { status: 400 }
        );
      }

      // Импортируем все товары в базу данных
      const importedProducts: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < productsData.length; i++) {
        const productData = productsData[i];
        
        try {
          // Проверяем, не импортирован ли уже этот товар
          // Используем первое изображение как уникальный идентификатор
          if (productData.images && productData.images.length > 0) {
            const firstImage = productData.images[0];
            const existingProduct = await db.product.findFirst({
              where: {
                images: {
                  has: firstImage, // Проверяем, есть ли это изображение в массиве
                },
              },
            });

            if (existingProduct) {
              errors.push(`${productData.title}: Уже импортирован (дубликат)`);
              continue; // Пропускаем этот товар
            }
          }
          
          // Определяем категорию
          const productCategoryId = categoryId || await getOrCreateCategory(productData.category || 'Без категории');
          
          // Генерируем slug для товара
          let slug = generateSlug(productData.title);
          let slugExists = await db.product.findUnique({ where: { slug } });
          let counter = 1;
          while (slugExists) {
            slug = `${generateSlug(productData.title)}-${counter}`;
            slugExists = await db.product.findUnique({ where: { slug } });
            counter++;
          }

          // Генерируем уникальный SKU
          let sku = `WB-MULTI-${i + 1}-${Date.now()}`;
          let skuExists = await db.product.findUnique({ where: { sku } });
          counter = 1;
          while (skuExists) {
            sku = `WB-MULTI-${i + 1}-${Date.now()}-${counter}`;
            skuExists = await db.product.findUnique({ where: { sku } });
            counter++;
          }

          // Определяем базовую цену
          let basePrice = productData.price || 0;
          let baseOldPrice = productData.oldPrice;
          
          if (productData.variants && productData.variants.length > 0) {
            const variantPrices = productData.variants.map(v => v.price).filter(p => p > 0);
            if (variantPrices.length > 0) {
              basePrice = Math.min(...variantPrices);
              if (!baseOldPrice) {
                const maxPrice = Math.max(...variantPrices);
                if (maxPrice > basePrice) baseOldPrice = maxPrice;
              }
            }
          }

          // Создаем товар в базе данных
          const product = await db.product.create({
            data: {
              sku,
              slug,
              title: productData.title,
              description: productData.description,
              content: productData.description,
              price: basePrice,
              oldPrice: baseOldPrice,
              stock: productData.stock,
              material: productData.material,
              tags: productData.tags,
              images: productData.images,
              categoryId: productCategoryId,
              visibility: 'DRAFT',
              isActive: true,
              isInStock: productData.stock > 0,
              isFeatured: false,
            },
          });

          // Создаем варианты товара
          if (productData.variants && productData.variants.length > 0) {
            for (const variant of productData.variants) {
              try {
                await db.productVariant.create({
                  data: {
                    productId: product.id,
                    size: variant.size || null,
                    color: variant.color || null,
                    price: variant.price,
                    stock: variant.stock,
                    sku: variant.sku,
                    isActive: true,
                  },
                });
              } catch (error: any) {
                if (error.code === 'P2002') {
                  const newSku = `${variant.sku}-${Math.random().toString(36).substring(2, 7)}`;
                  await db.productVariant.create({
                    data: {
                      productId: product.id,
                      size: variant.size || null,
                      color: variant.color || null,
                      price: variant.price,
                      stock: variant.stock,
                      sku: newSku,
                      isActive: true,
                    },
                  });
                }
              }
            }
          }

          importedProducts.push(product);
          
        } catch (error) {
          console.error(`[WB Import] Ошибка при импорте товара ${productData.title}:`, error);
          errors.push(`${productData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          imported: importedProducts.length,
          total: productsData.length,
          errors: errors.length,
          products: importedProducts,
        },
        message: `Импортировано: ${importedProducts.length} из ${productsData.length}. Ошибок: ${errors.length}`,
      });
    }
    
    // Извлекаем ID товара для одиночного импорта
    const productId = extractProductId(url);
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Не удалось извлечь ID товара из ссылки' },
        { status: 400 }
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

    // Проверяем дубликаты по первому изображению
    if (productData.images && productData.images.length > 0) {
      const firstImage = productData.images[0];
      const existingProduct = await db.product.findFirst({
        where: {
          images: {
            has: firstImage,
          },
        },
      });

      if (existingProduct) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Этот товар уже импортирован: "${existingProduct.title}"` 
          },
          { status: 409 }
        );
      }
    }

    // Определяем категорию: используем переданную или автоматически создаем из данных товара
    const productCategoryId = categoryId || await getOrCreateCategory(productData.category || 'Без категории');

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
    let sku = `WB-${productId}-${Date.now()}`;
    let skuExists = await db.product.findUnique({ where: { sku } });
    counter = 1;
    while (skuExists) {
      sku = `WB-${productId}-${Date.now()}-${counter}`;
      skuExists = await db.product.findUnique({ where: { sku } });
      counter++;
    }

    // Определяем базовую цену товара
    // Если есть варианты, берем минимальную цену из них
    let basePrice = productData.price || 0;
    let baseOldPrice = productData.oldPrice;
    
    if (productData.variants && productData.variants.length > 0) {
      const variantPrices = productData.variants.map(v => v.price).filter(p => p > 0);
      if (variantPrices.length > 0) {
        basePrice = Math.min(...variantPrices);
        
        // Если есть старая цена у товара, используем её
        // Иначе берем максимальную цену из вариантов как старую цену (если она больше минимальной)
        if (!baseOldPrice) {
          const maxPrice = Math.max(...variantPrices);
          if (maxPrice > basePrice) {
            baseOldPrice = maxPrice;
          }
        }
      }
    }

    // Создаем товар в базе данных
    const product = await db.product.create({
      data: {
        sku,
        slug,
        title: productData.title,
        description: productData.description,
        content: productData.description, // Используем описание как контент
        price: basePrice,
        oldPrice: baseOldPrice,
        stock: productData.stock,
        material: productData.material,
        tags: productData.tags,
        images: productData.images,
        categoryId: productCategoryId,
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

