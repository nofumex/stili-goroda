import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const settings = await db.setting.findMany({ orderBy: { key: 'asc' } });

    const raw = settings.reduce((acc, s) => {
      let v: any = s.value;
      if (s.type === 'NUMBER') v = Number(v);
      else if (s.type === 'BOOLEAN') v = v === 'true';
      else if (s.type === 'JSON') {
        try { v = JSON.parse(v); } catch {}
      }
      acc[s.key] = v;
      return acc;
    }, {} as Record<string, any>);

    const DEFAULTS = {
      contactEmail: 'za-bol@yandex.ru',
      contactPhone: '+7 (391) 278‒46‒72',
      address: 'Маерчака, 49г склад №4',
      socialLinks: [
        { label: 'WB', url: 'Wildberries' },
        { label: 'ВК', url: 'vk.com/stiligoroda' },
      ],
      extraContacts: [
        {
          title: 'Отдел продаж готовых изделий',
          values: ['+7 (391) 278-04-60', '+7(967) 608-04-60', '+7 (967) 612-32-54'],
        },
        {
          title: 'Отдел расчета (цех пошива)',
          values: ['+7 (391) 278-04-60', '+7 (905) 976-46-25'],
        },
        {
          title: 'Отдел продаж (одежда для дома)',
          values: ['+7 (923) 015-28-10'],
        },
      ],
    } as const;

    const normalized = {
      // Branding
      logo: raw.logo || '',
      favicon: raw.favicon || '',
      contactEmail: raw.contactEmail || raw.contact_email || DEFAULTS.contactEmail,
      contactPhone: raw.contactPhone || raw.contact_phone || DEFAULTS.contactPhone,
      address: raw.address || DEFAULTS.address,
      socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : DEFAULTS.socialLinks,
      extraContacts: Array.isArray(raw.extraContacts) ? raw.extraContacts : DEFAULTS.extraContacts,
      photoPricesUrl: raw.photoPricesUrl || '',
      popupEnabled: Boolean(raw.popupEnabled),
      popupTemplate: raw.popupTemplate || 'center',
      popupTitle: raw.popupTitle || '',
      popupText: raw.popupText || '',
      popupImageUrl: raw.popupImageUrl || '',
      popupButtonLabel: raw.popupButtonLabel || '',
      popupButtonUrl: raw.popupButtonUrl || '',
      popupDelaySeconds: typeof raw.popupDelaySeconds === 'number' ? raw.popupDelaySeconds : Number(raw.popupDelaySeconds || 3),
    };

    return NextResponse.json({ success: true, data: normalized }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Ошибка получения настроек' }, { status: 500 });
  }
}


