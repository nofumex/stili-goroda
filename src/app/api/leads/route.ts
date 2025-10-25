import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadSchema, paginationSchema } from '@/lib/validations';
import { verifyRole } from '@/lib/auth';
import { sendMail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = leadSchema.parse(body);

    const lead = await db.lead.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        company: validated.company,
        message: validated.message,
        source: validated.source || 'website',
      },
    });

    // Try to send confirmation to user (if email provided)
    try {
      if (lead.email) {
        await sendMail({
          to: lead.email,
          subject: 'Ваша заявка получена',
          html: `<div style="font-family:Arial,sans-serif">Спасибо за обращение! Мы получили вашу заявку и свяжемся с вами. <br/>Сообщение: ${lead.message || '-'}<br/>Телефон: ${lead.phone || '-'}</div>`,
        });
      }
    } catch (e) {
      // ignore user email errors
    }

    // Try to notify admin if admin email configured
    try {
      const setting = await db.setting.findUnique({ where: { key: 'emailSettings' } });
      const emailSettings = setting ? JSON.parse(setting.value) : {};
      const companyEmail = emailSettings.companyEmail;
      if (companyEmail) {
        await sendMail({
          to: companyEmail,
          subject: 'Новая заявка на консультацию',
          html: `<div style="font-family:Arial,sans-serif">
            <h3>Новая заявка</h3>
            <p><strong>Имя:</strong> ${lead.name}</p>
            <p><strong>Email:</strong> ${lead.email || '-'}</p>
            <p><strong>Телефон:</strong> ${lead.phone || '-'}</p>
            <p><strong>Компания:</strong> ${lead.company || '-'}</p>
            <p><strong>Сообщение:</strong> ${lead.message || '-'}</p>
            <p><strong>Источник:</strong> ${lead.source || '-'}</p>
          </div>`,
        });
      }
    } catch (e) {
      // ignore admin email errors
    }

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Ошибка создания заявки';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.lead.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ошибка получения заявок' }, { status: 500 });
  }
}



