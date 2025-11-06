import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paginationSchema } from '@/lib/validations';
import { verifyRole } from '@/lib/auth';

// GET - получение всех отзывов для модерации (требует админ)
export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });
    const skip = (page - 1) * limit;

    const status = searchParams.get('status'); // 'approved', 'pending', 'all'

    const where: any = {};
    if (status === 'approved') {
      where.isApproved = true;
    } else if (status === 'pending') {
      where.isApproved = false;
    }
    // Если status === 'all' или не указан, показываем все

    const [reviews, total] = await Promise.all([
      db.siteReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.siteReview.count({ where }),
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

  } catch (error: any) {
    console.error('Get admin site reviews error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Недостаточно прав доступа' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка получения отзывов' },
      { status: 500 }
    );
  }
}

