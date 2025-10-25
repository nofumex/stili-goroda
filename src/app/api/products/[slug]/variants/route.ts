import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const product = await db.product.findUnique({
      where: { slug: slug },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const variants = await db.productVariant.findMany({
      where: {
        productId: product.id,
      },
    });

    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    console.error('Failed to fetch product variants:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product variants.' }, { status: 500 });
  }
}