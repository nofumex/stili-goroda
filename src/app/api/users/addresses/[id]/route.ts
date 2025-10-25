import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

interface RouteParams { params: { id: string } }

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuth(request);
    const existing = await db.address.findFirst({ where: { id: params.id, userId: payload.userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Адрес не найден' }, { status: 404 });
    }
    await db.address.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Адрес удалён' });
  } catch (error: any) {
    console.error('DELETE /users/addresses/[id] error:', error);
    if (error?.statusCode === 401 || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Ошибка удаления адреса' }, { status: 500 });
  }
}


