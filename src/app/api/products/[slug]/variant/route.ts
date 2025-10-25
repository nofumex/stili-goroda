import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color') || undefined;
    const size = searchParams.get('size') || undefined;

    // Find product by slug
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { isActive: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Find matching variant
    const variant = product.variants.find(v => {
      const colorMatch = !color || (v.color || '').toLowerCase() === color.toLowerCase();
      const sizeMatch = !size || v.size === size;
      return colorMatch && sizeMatch;
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Вариация не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        variant,
        price: Number(variant.price),
        stock: variant.stock,
        isInStock: variant.stock > 0,
        sku: variant.sku
      }
    });

  } catch (error) {
    console.error('Get variant error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения вариации' },
      { status: 500 }
    );
  }
}
