import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';
import { settingsSchema } from '@/lib/validations';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Settings API: Starting request');
    
    // Verify admin role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    console.log('Settings API: Fetching settings from database');
    
    let settings: any[] = [];
    try {
      settings = await db.setting.findMany({
        orderBy: { key: 'asc' },
      });
      console.log('Settings API: Found settings:', settings.length);
    } catch (dbError) {
      console.log('Settings API: Database error, using defaults:', dbError);
      // If database is not available, return default settings
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
      };
      
      console.log('Settings API: Returning default settings');
      return NextResponse.json({ success: true, data: DEFAULTS });
    }

    // Convert to key-value object
    const rawObject = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Parse value based on type
      switch (setting.type) {
        case 'NUMBER':
          value = Number(value);
          break;
        case 'BOOLEAN':
          value = value === 'true';
          break;
        case 'JSON':
          try {
            value = JSON.parse(value);
          } catch {
            value = value;
          }
          break;
        default:
          value = value;
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Defaults to ensure admin UI is prefilled with current site data
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

    // Normalize to new schema (camelCase and arrays) with defaults
    const normalized = {
      // Branding
      logo: rawObject.logo || '',
      favicon: rawObject.favicon || '',
      contactEmail: rawObject.contactEmail || rawObject.contact_email || DEFAULTS.contactEmail,
      contactPhone: rawObject.contactPhone || rawObject.contact_phone || DEFAULTS.contactPhone,
      address: rawObject.address || DEFAULTS.address,
      socialLinks: Array.isArray(rawObject.socialLinks)
        ? rawObject.socialLinks
        : (rawObject.vk || rawObject.telegram || rawObject.whatsapp || rawObject.instagram)
        ? [
            rawObject.vk && { label: 'ВК', url: String(rawObject.vk) },
            rawObject.telegram && { label: 'Telegram', url: String(rawObject.telegram) },
            rawObject.whatsapp && { label: 'WhatsApp', url: String(rawObject.whatsapp) },
            rawObject.instagram && { label: 'Instagram', url: String(rawObject.instagram) },
          ].filter(Boolean) as { label: string; url: string }[]
        : DEFAULTS.socialLinks,
      extraContacts: Array.isArray(rawObject.extraContacts) ? rawObject.extraContacts : DEFAULTS.extraContacts,
      photoPricesUrl: rawObject.photoPricesUrl || '',
      minOrderTotal: typeof rawObject.minOrderTotal === 'number' ? rawObject.minOrderTotal : Number(rawObject.minOrderTotal || 0),
      popupEnabled: Boolean(rawObject.popupEnabled),
      popupTemplate: rawObject.popupTemplate || 'center',
      popupTitle: rawObject.popupTitle || '',
      popupText: rawObject.popupText || '',
      popupImageUrl: rawObject.popupImageUrl || '',
      popupButtonLabel: rawObject.popupButtonLabel || '',
      popupButtonUrl: rawObject.popupButtonUrl || '',
      popupDelaySeconds: typeof rawObject.popupDelaySeconds === 'number' ? rawObject.popupDelaySeconds : Number(rawObject.popupDelaySeconds || 3),
      emailSettings: rawObject.emailSettings || {
        smtpHost: rawObject.SMTP_HOST || '',
        smtpPort: Number(rawObject.SMTP_PORT || 587),
        smtpUser: rawObject.SMTP_USER || '',
        smtpPassword: rawObject.SMTP_PASSWORD || '',
        fromEmail: rawObject.fromEmail || rawObject.FROM_EMAIL || '',
        companyEmail: rawObject.companyEmail || '',
      },
    };

    console.log('Settings API: Returning normalized data');
    return NextResponse.json({ success: true, data: normalized }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    if ((error as any)?.statusCode === 401 || (error as any)?.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Не авторизовано' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка получения настроек', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Allow ADMIN and MANAGER to update settings
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const body = await request.json();
    
    // Validate settings data
    const validatedData = settingsSchema.parse(body);

    // Update settings — write into flat settings table using camelCase keys
    const updatePromises = Object.entries(validatedData).map(async ([key, value]) => {
      let stringValue: string;
      let type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING';

      // Determine type and convert to string
      if (typeof value === 'number') {
        stringValue = value.toString();
        type = 'NUMBER';
      } else if (typeof value === 'boolean') {
        stringValue = value.toString();
        type = 'BOOLEAN';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
        type = 'JSON';
      } else {
        stringValue = value.toString();
        type = 'STRING';
      }

      return db.setting.upsert({
        where: { key },
        update: { value: stringValue, type },
        create: { key, value: stringValue, type },
      });
    });

    await Promise.all(updatePromises);

    // Revalidate public settings cache
    revalidateTag('public-settings');

    // Get updated settings
    const settings = await db.setting.findMany({
      orderBy: { key: 'asc' },
    });

    const rawObject = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      switch (setting.type) {
        case 'NUMBER':
          value = Number(value);
          break;
        case 'BOOLEAN':
          value = value === 'true';
          break;
        case 'JSON':
          try {
            value = JSON.parse(value);
          } catch {
            value = value;
          }
          break;
        default:
          value = value;
      }
      
      acc[setting.key] = value;
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
      logo: rawObject.logo || '',
      favicon: rawObject.favicon || '',
      contactEmail: rawObject.contactEmail || rawObject.contact_email || DEFAULTS.contactEmail,
      contactPhone: rawObject.contactPhone || rawObject.contact_phone || DEFAULTS.contactPhone,
      address: rawObject.address || DEFAULTS.address,
      socialLinks: Array.isArray(rawObject.socialLinks)
        ? rawObject.socialLinks
        : (rawObject.vk || rawObject.telegram || rawObject.whatsapp || rawObject.instagram)
        ? [
            rawObject.vk && { label: 'ВК', url: String(rawObject.vk) },
            rawObject.telegram && { label: 'Telegram', url: String(rawObject.telegram) },
            rawObject.whatsapp && { label: 'WhatsApp', url: String(rawObject.whatsapp) },
            rawObject.instagram && { label: 'Instagram', url: String(rawObject.instagram) },
          ].filter(Boolean) as { label: string; url: string }[]
        : DEFAULTS.socialLinks,
      extraContacts: Array.isArray(rawObject.extraContacts) ? rawObject.extraContacts : DEFAULTS.extraContacts,
      photoPricesUrl: rawObject.photoPricesUrl || '',
      minOrderTotal: typeof rawObject.minOrderTotal === 'number' ? rawObject.minOrderTotal : Number(rawObject.minOrderTotal || 0),
      popupEnabled: Boolean(rawObject.popupEnabled),
      popupTemplate: rawObject.popupTemplate || 'center',
      popupTitle: rawObject.popupTitle || '',
      popupText: rawObject.popupText || '',
      popupImageUrl: rawObject.popupImageUrl || '',
      popupButtonLabel: rawObject.popupButtonLabel || '',
      popupButtonUrl: rawObject.popupButtonUrl || '',
      popupDelaySeconds: typeof rawObject.popupDelaySeconds === 'number' ? rawObject.popupDelaySeconds : Number(rawObject.popupDelaySeconds || 3),
      emailSettings: rawObject.emailSettings || {
        smtpHost: rawObject.SMTP_HOST || '',
        smtpPort: Number(rawObject.SMTP_PORT || 587),
        smtpUser: rawObject.SMTP_USER || '',
        smtpPassword: rawObject.SMTP_PASSWORD || '',
        fromEmail: rawObject.fromEmail || rawObject.FROM_EMAIL || '',
        companyEmail: rawObject.companyEmail || '',
      },
    };

    return NextResponse.json({ success: true, data: normalized, message: 'Настройки обновлены успешно' }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    if ((error as any)?.statusCode === 401 || (error as any)?.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Не авторизовано' },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные настроек' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Ошибка обновления настроек' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    const body = await request.json();
    const { key, value, type = 'STRING' } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Ключ и значение обязательны' },
        { status: 400 }
      );
    }

    // Check if setting already exists
    const existingSetting = await db.setting.findUnique({
      where: { key }
    });

    if (existingSetting) {
      return NextResponse.json(
        { success: false, error: 'Настройка с таким ключом уже существует' },
        { status: 409 }
      );
    }

    // Create setting
    const setting = await db.setting.create({
      data: {
        key,
        value: value.toString(),
        type: type as 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON',
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Настройка создана успешно',
    }, { status: 201 });

  } catch (error) {
    console.error('Create setting error:', error);
    if ((error as any)?.statusCode === 401 || (error as any)?.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Не авторизовано' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка создания настройки' },
      { status: 500 }
    );
  }
}
