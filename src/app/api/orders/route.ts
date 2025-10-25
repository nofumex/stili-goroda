import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyAuth, verifyRole } from '@/lib/auth';
import { checkoutSchema, orderFiltersSchema } from '@/lib/validations';
import { renderOrderEmail, sendMail } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Set default values for pagination
    const {
      page = 1,
      limit = 10,
      status,
      dateFrom,
      dateTo,
      userId,
      search,
    } = orderFiltersSchema.parse(params);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If not admin/manager, only show user's own orders
    if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') {
      where.userId = payload.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
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
      ];
    }

    // Get orders
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  size: true,
                  color: true,
                  sku: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });

  } catch (error) {
    console.error('Get orders error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения заказов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    
    const validatedData = checkoutSchema.parse(body);
    const items = body?.items;
    const {
      firstName,
      lastName,
      company,
      phone,
      email,
      notes,
      deliveryType,
      addressId,
      address: addressText,
      promoCode,
    } = validatedData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Корзина пуста' },
        { status: 400 }
      );
    }

    // Validate items shape
    for (const item of items) {
      if (!item?.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Некорректный формат товаров в корзине' },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item?.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Количество товара должно быть больше 0' },
          { status: 400 }
        );
      }
    }

    // Ensure user exists
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 401 }
      );
    }

    // If addressId provided, ensure it belongs to user
    if (addressId) {
      const address = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
      if (!address) {
        return NextResponse.json(
          { success: false, error: 'Адрес доставки не найден' },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: {
            where: { isActive: true },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Товар ${item.productId} не найден` },
          { status: 400 }
        );
      }

      // Рассчитываем доступность по фактическому остатку товара или его активных вариаций
      const hasVariantStock = Array.isArray(product.variants)
        ? product.variants.some(v => (v?.isActive ?? false) && (v?.stock ?? 0) > 0)
        : false;
      const productStock = Number(product.stock ?? 0);
      const isAvailable = Boolean(product.isActive && (productStock > 0 || hasVariantStock));

      if (!isAvailable) {
        return NextResponse.json(
          { success: false, error: `Товар ${product.title || item.productId} недоступен` },
          { status: 400 }
        );
      }

      let variant = null;
      let itemPrice = Number(product.price);
      let stockToCheck = product.stock;

      // Если указана вариация, проверить её
      if (item.variantId) {
        variant = await db.productVariant.findFirst({
          where: {
            id: item.variantId,
            productId: item.productId,
            isActive: true,
          },
        });

        if (!variant) {
          return NextResponse.json(
            { success: false, error: `Вариация товара ${product.title} не найдена` },
            { status: 400 }
          );
        }

        itemPrice = Number(variant.price);
        stockToCheck = variant.stock;
      }

      // Если товар есть хотя бы в количестве 1, то заказ можно оформлять
      // Админ уточнит детали по телефону
      if (stockToCheck < 1) {
        return NextResponse.json(
          { success: false, error: `Товар ${product.title} отсутствует на складе` },
          { status: 400 }
        );
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        variantId: variant?.id || null,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
        selectedColor: item.selectedColor || variant?.color || null,
        selectedSize: item.selectedSize || variant?.size || null,
      });
    }

    // Apply promo code (simplified)
    let discount = 0;
    if (promoCode) {
      // Add promo code logic here
    }

    // Enforce minimum order subtotal if configured in settings
    try {
      const minSetting = await db.setting.findUnique({ where: { key: 'minOrderTotal' } });
      const minOrderTotal = minSetting ? Number(minSetting.value) : 0;
      if (!Number.isNaN(minOrderTotal) && minOrderTotal > 0 && subtotal < minOrderTotal) {
        return NextResponse.json(
          { success: false, error: `Минимальная сумма заказа ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(minOrderTotal)}` },
          { status: 400 }
        );
      }
    } catch {
      // If settings fetch fails, do not block the order creation
    }

    // Calculate delivery (simplified)
    let delivery = 0;
    if (deliveryType === 'COURIER') {
      delivery = subtotal >= 3000 ? 0 : 500; // Free delivery over 3000 RUB
    } else if (deliveryType === 'TRANSPORT') {
      delivery = 1000; // Fixed transport price
    }

    const total = subtotal + delivery - discount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with retry on order number collision
    let order: any = null;
    let attempts = 0;
    let currentOrderNumber = orderNumber;
    while (!order && attempts < 3) {
      try {
        order = await db.order.create({
          data: {
            orderNumber: currentOrderNumber,
            userId: payload.userId,
            status: 'NEW',
            total,
            subtotal,
            delivery,
            discount,
            firstName,
            lastName,
            company,
            phone,
            email,
            notes,
            deliveryType,
            addressId,
            promoCode,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
            address: true,
          },
        });
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && (e.meta as any)?.target?.includes('orderNumber')) {
          // Regenerate order number and retry
          currentOrderNumber = generateOrderNumber();
          attempts += 1;
          continue;
        }
        throw e;
      }
    }

    // Не уменьшаем остатки при создании заказа — администратор управляет складом вручную

    // Create order log
    await db.orderLog.create({
      data: {
        orderId: order.id,
        status: 'NEW',
        comment: 'Заказ создан',
        createdBy: payload?.userId || null,
      },
    });

    try {
      const html = renderOrderEmail(order);
      // Send to customer (клиентское письмо)
      if (order.email) {
        await sendMail({ to: order.email, subject: `Заказ ${order.orderNumber} создан`, html });
      }
      // Send admin notification (только если указан email администратора)
      try {
        const settings = await db.setting.findMany({ where: { key: 'emailSettings' } });
        const emailSettingsRaw = settings.find(s => s.key === 'emailSettings')?.value;
        const emailSettings = emailSettingsRaw ? JSON.parse(emailSettingsRaw) : {};
        const companyEmail = emailSettings.companyEmail; // renamed in UI to "Почта администратора"
        if (companyEmail && typeof companyEmail === 'string' && companyEmail.trim().length > 0) {
          const { renderAdminOrderEmail } = await import('@/lib/email');
          const adminHtml = renderAdminOrderEmail(order, { addressText });
          await sendMail({ to: companyEmail, subject: `Новый заказ ${order.orderNumber}`, html: adminHtml });
        }
      } catch (e) {
        // ignore copy send errors
      }
    } catch (mailErr) {
      console.error('Order email send error:', mailErr);
      // Do not fail order creation on email failure
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Заказ создан успешно',
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const zErr: any = error as any;
      const details = Array.isArray(zErr.issues)
        ? zErr.issues.map((i: any) => ({ field: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''), message: i.message }))
        : undefined;
      return NextResponse.json(
        { success: false, error: 'Некорректные данные', details },
        { status: 400 }
      );
    }

    if ((error as any)?.statusCode === 401 || (error as any)?.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Авторизуйтесь для оформления заказа' },
        { status: 401 }
      );
    }

    // Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Конфликт уникальности данных заказа' },
          { status: 409 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Нарушение внешнего ключа. Проверьте адрес/товары' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Ошибка базы данных при создании заказа' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: false, error: 'Ошибка создания заказа' }, { status: 500 });
  }
}


