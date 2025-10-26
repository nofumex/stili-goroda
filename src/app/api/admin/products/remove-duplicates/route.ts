import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';

/**
 * POST /api/admin/products/remove-duplicates
 * Удаляет дубликаты товаров, импортированных из WildBerries
 * Оставляет только самый новый товар для каждого WB ID
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем права доступа
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    // Получаем все товары
    const allProducts = await db.product.findMany({
      orderBy: {
        createdAt: 'desc', // Сначала новые
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sku: true,
        createdAt: true,
      },
    });

    // Группируем товары по slug (без числовых суффиксов вида -1, -2 и т.д.)
    const productsByBaseSlug = new Map<string, any[]>();
    
    for (const product of allProducts) {
      // Убираем числовые суффиксы из slug для группировки
      // Например: "product-name-1" -> "product-name"
      const baseSlug = product.slug.replace(/-\d+$/, '');
      
      if (!productsByBaseSlug.has(baseSlug)) {
        productsByBaseSlug.set(baseSlug, []);
      }
      productsByBaseSlug.get(baseSlug)!.push(product);
    }

    // Находим дубликаты (где больше одного товара с одним базовым slug)
    const duplicatesToDelete: string[] = [];
    let duplicateGroups = 0;

    for (const [baseSlug, products] of productsByBaseSlug) {
      if (products.length > 1) {
        duplicateGroups++;
        // Оставляем первый (самый новый), удаляем остальные
        const toDelete = products.slice(1);
        duplicatesToDelete.push(...toDelete.map(p => p.id));
        
        console.log(`[Remove Duplicates] Найдена группа дубликатов "${baseSlug}": ${products.length} товаров`);
        console.log(`  Оставляем: ${products[0].title} (создан: ${products[0].createdAt})`);
        console.log(`  Удаляем: ${toDelete.length} товаров`);
      }
    }

    if (duplicatesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Дубликатов не найдено',
        deleted: 0,
      });
    }

    // Удаляем варианты товаров
    await db.productVariant.deleteMany({
      where: {
        productId: {
          in: duplicatesToDelete,
        },
      },
    });

    // Удаляем товары
    await db.product.deleteMany({
      where: {
        id: {
          in: duplicatesToDelete,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Удалено ${duplicatesToDelete.length} дубликатов из ${duplicateGroups} групп`,
      deleted: duplicatesToDelete.length,
      groups: duplicateGroups,
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error removing duplicates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

