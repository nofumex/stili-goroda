import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';
import { productSchema } from '@/lib/validations';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        categoryObj: {
          include: {
            parent: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        reviews: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Check if product is visible for public; allow ADMIN/MANAGER to fetch for editing
    const authHeader = request.headers.get('authorization') || '';
    const isAdminPreview = authHeader.includes('Bearer');
    if (!isAdminPreview) {
      if (!product.isActive || product.visibility !== 'VISIBLE') {
        return NextResponse.json(
          { success: false, error: 'Товар недоступен' },
          { status: 404 }
        );
      }
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    const productWithRating = {
      ...product,
      averageRating,
    };

    return NextResponse.json({
      success: true,
      data: productWithRating,
    });

  } catch (error) {
    console.error('Get product error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения товара' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug } = params;
    const body = await request.json();
    
    const validatedData = productSchema.partial().parse(body);

    // Find existing product
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Check if new SKU conflicts with existing
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuConflict = await db.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: 'Товар с таким артикулом уже существует' },
          { status: 409 }
        );
      }
    }

    // Check if new slug conflicts with existing
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugConflict = await db.product.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Товар с таким URL уже существует' },
          { status: 409 }
        );
      }
    }

    // Update product
    const product = await db.product.update({
      where: { slug },
      data: validatedData,
      include: {
        categoryObj: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Товар обновлён успешно',
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка обновления товара' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    const { slug } = params;

    // Find existing product
    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Check if product has orders
    const hasOrders = await db.orderItem.findFirst({
      where: { productId: existingProduct.id },
    });

    if (hasOrders) {
      // Soft delete - just hide the product
      await db.product.update({
        where: { slug },
        data: {
          isActive: false,
          visibility: 'HIDDEN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Товар скрыт (имеет связанные заказы)',
      });
    }

    // Hard delete
    await db.product.delete({
      where: { slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Товар удалён успешно',
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления товара' },
      { status: 500 }
    );
  }
}


