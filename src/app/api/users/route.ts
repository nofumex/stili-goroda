import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';
import { paginationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const { page, limit } = paginationSchema.parse(params);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          company: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const role = searchParams.get('role');
    if (role) {
      where.role = role;
    }

    const isBlocked = searchParams.get('isBlocked');
    if (isBlocked !== null) {
      where.isBlocked = isBlocked === 'true';
    }

    // Get users
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          company: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    // Map auth errors to appropriate status
    const status = (error as any)?.statusCode === 403 ? 403 : (error as any)?.statusCode === 401 ? 401 : 500;
    const message = status === 401 ? 'Неавторизован' : status === 403 ? 'Недостаточно прав' : 'Ошибка получения пользователей';
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN']);

    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Create user
    const user = await db.user.create({
      data: {
        ...body,
        email: body.email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Пользователь создан успешно',
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка создания пользователя' },
      { status: 500 }
    );
  }
}
