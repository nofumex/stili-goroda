import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const addressBodySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).optional(),
  street: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
  zipCode: z.string().min(4).optional(),
  phone: z.string().optional(),
  isMain: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const data = addressBodySchema.required({ name: true, street: true, city: true, region: true, zipCode: true }).parse(body);

    if (data.isMain) {
      await db.address.updateMany({ where: { userId: payload.userId, isMain: true }, data: { isMain: false } });
    }

    const created = await db.address.create({
      data: { ...data, userId: payload.userId },
    });

    return NextResponse.json({ success: true, data: created, message: 'Адрес добавлен' });
  } catch (error: any) {
    console.error('POST /users/addresses error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Некорректные данные адреса' }, { status: 400 });
    }
    if (error?.statusCode === 401 || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Ошибка добавления адреса' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const items = await db.address.findMany({ where: { userId: payload.userId }, orderBy: { isMain: 'desc' } });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('GET /users/addresses error:', error);
    if (error?.statusCode === 401 || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Ошибка получения адресов' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { id, ...rest } = addressBodySchema.extend({ id: z.string() }).parse(body);

    const existing = await db.address.findFirst({ where: { id, userId: payload.userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Адрес не найден' }, { status: 404 });
    }

    if (rest.isMain) {
      await db.address.updateMany({ where: { userId: payload.userId, isMain: true }, data: { isMain: false } });
    }

    const updated = await db.address.update({ where: { id }, data: rest });
    return NextResponse.json({ success: true, data: updated, message: 'Адрес обновлён' });
  } catch (error: any) {
    console.error('PUT /users/addresses error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Некорректные данные адреса' }, { status: 400 });
    }
    if (error?.statusCode === 401 || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: 'Требуется авторизация' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Ошибка обновления адреса' }, { status: 500 });
  }
}

// DELETE moved to /api/users/addresses/[id]


