import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const page = params.page ? parseInt(params.page) : 1;
    const limit = params.limit ? parseInt(params.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.categoryObj = { slug: params.category };
    }

    if (params.visibility) {
      where.visibility = params.visibility;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true';
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (params.sortBy) {
      const sortOrder = (params.sortOrder === 'asc' || params.sortOrder === 'desc') ? params.sortOrder : 'desc';
      switch (params.sortBy) {
        case 'price':
          orderBy = { price: sortOrder };
          break;
        case 'name':
          orderBy = { title: sortOrder };
          break;
        case 'stock':
          orderBy = { stock: sortOrder };
          break;
        case 'createdAt':
        default:
          orderBy = { createdAt: sortOrder };
      }
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { categoryObj: true, _count: { select: { reviews: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin products list error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка получения списка товаров' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only admins can perform bulk delete
    await verifyRole(request, ['ADMIN']);

    const body = await request.json();
    const productIds: string[] = Array.isArray(body?.productIds) ? body.productIds : [];

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Не выбраны товары для удаления' },
        { status: 400 }
      );
    }

    let deleted = 0;
    let hidden = 0;

    // Load products first
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, slug: true },
    });

    for (const product of products) {
      // Check related orders
      const hasOrders = await db.orderItem.findFirst({
        where: { productId: product.id },
        select: { id: true },
      });

      if (hasOrders) {
        // Soft delete: hide the product
        await db.product.update({
          where: { id: product.id },
          data: { isActive: false, visibility: 'HIDDEN' },
        });
        hidden++;
      } else {
        // Hard delete
        await db.product.delete({ where: { id: product.id } });
        deleted++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { deleted, hidden, processed: products.length },
      message: `Удалено: ${deleted}, скрыто: ${hidden}`,
    });
  } catch (error) {
    console.error('Admin products bulk delete error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления товаров' },
      { status: 500 }
    );
  }
}


