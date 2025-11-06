import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteReviewSchema } from '@/lib/validations';
import { verifyAuth } from '@/lib/auth';

// POST - создание отзыва (требует авторизации)
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const payload = await verifyAuth(request);
    
    const body = await request.json();
    const validated = siteReviewSchema.parse(body);

    // Создание отзыва
    const review = await db.siteReview.create({
      data: {
        userId: payload.userId,
        rating: validated.rating,
        content: validated.content,
        isApproved: false, // По умолчанию не одобрен
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Отзыв отправлен на модерацию',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create site review error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Необходима авторизация для оставления отзыва' },
        { status: 401 }
      );
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка создания отзыва' },
      { status: 500 }
    );
  }
}

// GET - получение одобренных отзывов (публичный)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      db.siteReview.findMany({
        where: {
          isApproved: true, // Только одобренные
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.siteReview.count({
        where: {
          isApproved: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get site reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения отзывов' },
      { status: 500 }
    );
  }
}

