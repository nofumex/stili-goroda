import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole, AuthError } from '@/lib/auth';
import { productVariantSchema } from '@/lib/validations';

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET - получить все вариации товара
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug } = params;

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: [
            { color: 'asc' },
            { size: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product.variants,
    });

  } catch (error) {
    console.error('Get product variants error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка получения вариаций товара' },
      { status: 500 }
    );
  }
}

// POST - создать новую вариацию товара
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug } = params;
    const body = await request.json();

    // Найти товар
    const product = await db.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Валидация данных вариации
    const validatedData = productVariantSchema.parse(body);

    // Проверить уникальность SKU
    const existingVariant = await db.productVariant.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Вариация с таким артикулом уже существует' },
        { status: 409 }
      );
    }

    // Создать вариацию
    const variant = await db.productVariant.create({
      data: {
        ...validatedData,
        productId: product.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: variant,
      message: 'Вариация создана успешно',
    });

  } catch (error) {
    console.error('Create product variant error:', error);
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
      { success: false, error: 'Ошибка создания вариации' },
      { status: 500 }
    );
  }
}

// PUT - обновить вариации товара (массовое обновление)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { slug } = params;
    const body = await request.json();

    // Найти товар
    const product = await db.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    const { variants } = body;

    if (!Array.isArray(variants)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат данных' },
        { status: 400 }
      );
    }

    // Валидация всех вариаций
    const validatedVariants = variants.map((variant: any) => 
      productVariantSchema.parse(variant)
    );

    // Проверить уникальность SKU
    const skus = validatedVariants.map((v: any) => v.sku);
    const existingVariants = await db.productVariant.findMany({
      where: { 
        sku: { in: skus },
        productId: { not: product.id },
      },
    });

    if (existingVariants.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Некоторые артикулы уже используются в других товарах' },
        { status: 409 }
      );
    }

    // Удалить старые вариации
    await db.productVariant.deleteMany({
      where: { productId: product.id },
    });

    // Создать новые вариации
    const newVariants = await db.productVariant.createMany({
      data: validatedVariants.map((variant: any) => ({
        ...variant,
        productId: product.id,
      })),
    });

    return NextResponse.json({
      success: true,
      data: { created: newVariants.count },
      message: `Создано ${newVariants.count} вариаций`,
    });

  } catch (error) {
    console.error('Update product variants error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные вариаций' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка обновления вариаций' },
      { status: 500 }
    );
  }
}
