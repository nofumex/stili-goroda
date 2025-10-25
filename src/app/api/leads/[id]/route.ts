import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyRole(_request, ['ADMIN', 'MANAGER']);
    const lead = await db.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Заявка не найдена' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ошибка получения заявки' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);
    await db.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Заявка не найдена' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Ошибка удаления заявки' }, { status: 500 });
  }
}


