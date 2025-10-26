import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';

/**
 * POST /api/admin/products/clear-all
 * Удаляет ВСЕ товары (для полной переустановки)
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем права доступа
    await verifyRole(request, ['ADMIN']);

    // Удаляем все варианты товаров
    await db.productVariant.deleteMany({});

    // Удаляем все товары
    const result = await db.product.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Удалено ${result.count} товаров. Теперь можете импортировать заново.`,
      deleted: result.count,
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error clearing products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

