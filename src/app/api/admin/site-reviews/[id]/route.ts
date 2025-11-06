import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH - одобрение/отклонение отзыва (требует админ)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { id } = params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Поле isApproved должно быть boolean' },
        { status: 400 }
      );
    }

    const review = await db.siteReview.update({
      where: { id },
      data: {
        isApproved,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: isApproved ? 'Отзыв одобрен' : 'Отзыв отклонен',
    });

  } catch (error: any) {
    console.error('Update site review error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Недостаточно прав доступа' },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка обновления отзыва' },
      { status: 500 }
    );
  }
}

// DELETE - удаление отзыва (требует админ)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { id } = params;

    await db.siteReview.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Отзыв удален',
    });

  } catch (error: any) {
    console.error('Delete site review error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Недостаточно прав доступа' },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка удаления отзыва' },
      { status: 500 }
    );
  }
}

