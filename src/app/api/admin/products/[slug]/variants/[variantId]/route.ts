import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';
import { productVariantSchema } from '@/lib/validations';

interface RouteParams {
  params: {
    slug: string;
    variantId: string;
  };
}

// GET - получить конкретную вариацию
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug, variantId } = params;

    const variant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        product: { slug },
      },
      include: {
        product: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Вариация не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: variant,
    });

  } catch (error) {
    console.error('Get product variant error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка получения вариации' },
      { status: 500 }
    );
  }
}

// PUT - обновить вариацию
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug, variantId } = params;
    const body = await request.json();

    // Найти вариацию
    const existingVariant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        product: { slug },
      },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Вариация не найдена' },
        { status: 404 }
      );
    }

    // Валидация данных
    const validatedData = productVariantSchema.partial().parse(body);

    // Проверить уникальность SKU, если он изменился
    if (validatedData.sku && validatedData.sku !== existingVariant.sku) {
      const skuConflict = await db.productVariant.findUnique({
        where: { sku: validatedData.sku },
      });

      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: 'Вариация с таким артикулом уже существует' },
          { status: 409 }
        );
      }
    }

    // Обновить вариацию
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: variant,
      message: 'Вариация обновлена успешно',
    });

  } catch (error) {
    console.error('Update product variant error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные вариации' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка обновления вариации' },
      { status: 500 }
    );
  }
}

// DELETE - удалить вариацию
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug, variantId } = params;

    // Найти вариацию
    const existingVariant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        product: { slug },
      },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Вариация не найдена' },
        { status: 404 }
      );
    }

    // Проверить, есть ли заказы с этой вариацией
    const hasOrders = await db.orderItem.findFirst({
      where: { variantId },
    });

    if (hasOrders) {
      // Мягкое удаление - деактивировать
      await db.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Вариация деактивирована (имеет связанные заказы)',
      });
    }

    // Жесткое удаление
    await db.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({
      success: true,
      message: 'Вариация удалена успешно',
    });

  } catch (error) {
    console.error('Delete product variant error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления вариации' },
      { status: 500 }
    );
  }
}
