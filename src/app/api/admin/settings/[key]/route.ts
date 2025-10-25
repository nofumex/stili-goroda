import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    const setting = await db.setting.findUnique({
      where: { key: params.key }
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Настройка не найдена' },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: {
        key: setting.key,
        value,
        type: setting.type,
      },
    });

  } catch (error) {
    console.error('Get setting error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения настройки' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    const body = await request.json();
    const { value, type } = body;

    if (value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Значение обязательно' },
        { status: 400 }
      );
    }

    // Check if setting exists
    const existingSetting = await db.setting.findUnique({
      where: { key: params.key }
    });

    if (!existingSetting) {
      return NextResponse.json(
        { success: false, error: 'Настройка не найдена' },
        { status: 404 }
      );
    }

    // Update setting
    const setting = await db.setting.update({
      where: { key: params.key },
      data: {
        value: value.toString(),
        type: type || existingSetting.type,
      },
    });

    let parsedValue: any = setting.value;
    
    switch (setting.type) {
      case 'NUMBER':
        parsedValue = Number(parsedValue);
        break;
      case 'BOOLEAN':
        parsedValue = parsedValue === 'true';
        break;
      case 'JSON':
        try {
          parsedValue = JSON.parse(parsedValue);
        } catch {
          parsedValue = parsedValue;
        }
        break;
      default:
        parsedValue = parsedValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        key: setting.key,
        value: parsedValue,
        type: setting.type,
      },
      message: 'Настройка обновлена успешно',
    });

  } catch (error) {
    console.error('Update setting error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления настройки' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    // Check if setting exists
    const existingSetting = await db.setting.findUnique({
      where: { key: params.key }
    });

    if (!existingSetting) {
      return NextResponse.json(
        { success: false, error: 'Настройка не найдена' },
        { status: 404 }
      );
    }

    // Delete setting
    await db.setting.delete({
      where: { key: params.key }
    });

    return NextResponse.json({
      success: true,
      message: 'Настройка удалена успешно',
    });

  } catch (error) {
    console.error('Delete setting error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления настройки' },
      { status: 500 }
    );
  }
}
