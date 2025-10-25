import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Категория не найдена' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json({ success: false, error: 'Ошибка получения категории' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyRole(request, ['ADMIN', 'MANAGER']);
    const body = await request.json();

    // validate and prevent slug duplication
    const validated = categorySchema.partial().parse(body);

    if (validated.slug) {
      const exists = await db.category.findFirst({ where: { slug: validated.slug, NOT: { id: params.id } } });
      if (exists) {
        return NextResponse.json({ success: false, error: 'Категория с таким URL уже существует' }, { status: 409 });
      }
    }

    if (validated.parentId) {
      const parent = await db.category.findUnique({ where: { id: validated.parentId } });
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Родительская категория не найдена' }, { status: 400 });
      }
      if (validated.parentId === params.id) {
        return NextResponse.json({ success: false, error: 'Категория не может быть родителем самой себя' }, { status: 400 });
      }
    }

    const updated = await db.category.update({
      where: { id: params.id },
      data: validated,
      include: { parent: true, children: true, _count: { select: { products: true } } },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Категория обновлена' });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Некорректные данные' }, { status: 400 });
    }
    console.error('Update category error:', error);
    return NextResponse.json({ success: false, error: 'Ошибка обновления категории' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyRole(request, ['ADMIN']);

    // Check children/products
    const cat = await db.category.findUnique({ where: { id: params.id }, include: { _count: { select: { products: true } }, children: true } });
    if (!cat) {
      return NextResponse.json({ success: false, error: 'Категория не найдена' }, { status: 404 });
    }
    if (cat.children.length > 0) {
      return NextResponse.json({ success: false, error: 'Удалите или перенесите подкатегории' }, { status: 400 });
    }
    if (cat._count.products > 0) {
      return NextResponse.json({ success: false, error: 'В категории есть товары. Перенесите их в другую категорию' }, { status: 400 });
    }

    await db.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Категория удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ success: false, error: 'Ошибка удаления категории' }, { status: 500 });
  }
}



