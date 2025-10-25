import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, verifyRole } from '@/lib/auth';

interface RouteParams { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuth(request);
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { product: { select: { id: true, title: true, sku: true, images: true } } } },
        address: true,
      },
    });
    if (!order) return NextResponse.json({ success: false, error: 'Заказ не найден' }, { status: 404 });
    if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER' && order.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Недостаточно прав' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ошибка получения заказа' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);
    const body = await request.json();
    const { status, trackNumber, comment } = body || {};

    const order = await db.order.update({
      where: { id: params.id },
      data: {
        status,
        trackNumber,
      },
      include: {
        items: true,
      },
    });

    await db.orderLog.create({
      data: { orderId: order.id, status: order.status, comment: comment || 'Статус обновлён' },
    });

    return NextResponse.json({ success: true, data: order, message: 'Заказ обновлён' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ошибка обновления заказа' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);
    
    // Проверяем, существует ли заказ
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Заказ не найден' }, { status: 404 });
    }

    // Удаляем заказ (каскадное удаление удалит связанные записи)
    await db.order.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Заказ #${order.orderNumber} удален успешно` 
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка удаления заказа' 
    }, { status: 500 });
  }
}








