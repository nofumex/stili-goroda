import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFrom: Date;
    let dateTo: Date = new Date();

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      switch (period) {
        case '7d':
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case '30d':
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 30);
          break;
        case '90d':
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 90);
          break;
        case '1y':
          dateFrom = new Date();
          dateFrom.setFullYear(dateFrom.getFullYear() - 1);
          break;
        default:
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 30);
      }
    }

    // Get analytics data
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      newUsers,
      newOrders,
      recentOrders,
      topProducts,
      orderStats,
      userStats,
      revenueStats,
    ] = await Promise.all([
      // Total counts
      db.user.count(),
      db.order.count(),
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } }
      }),
      db.product.count({ where: { isActive: true } }),

      // New users in period
      db.user.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),

      // New orders in period
      db.order.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),

      // Recent orders
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),

      // Top products by sales
      db.product.findMany({
        take: 10,
        where: {
          isActive: true,
          orderItems: {
            some: {
              order: {
                createdAt: {
                  gte: dateFrom,
                  lte: dateTo,
                },
                status: { not: 'CANCELLED' },
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              orderItems: {
                where: {
                  order: {
                    createdAt: {
                      gte: dateFrom,
                      lte: dateTo,
                    },
                    status: { not: 'CANCELLED' },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          orderItems: {
            _count: 'desc',
          },
        },
      }),

      // Order statistics
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),

      // User statistics
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Revenue by day
      db.order.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
          status: { not: 'CANCELLED' },
        },
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Calculate revenue growth
    const previousPeriodStart = new Date(dateFrom);
    const previousPeriodEnd = new Date(dateFrom);
    const periodLength = dateTo.getTime() - dateFrom.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);

    const previousRevenue = await db.order.aggregate({
      _sum: { total: true },
      where: {
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    const currentRevenue = revenueStats.reduce((sum, order) => sum + Number(order.total), 0);
    const previousRevenueValue = Number(previousRevenue._sum.total || 0);
    const revenueGrowth = previousRevenueValue > 0 
      ? ((currentRevenue - previousRevenueValue) / previousRevenueValue) * 100 
      : 0;

    // Calculate conversion rate (simplified)
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? Number(totalRevenue._sum.total || 0) / totalOrders : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.total || 0),
          totalProducts,
          newUsers,
          newOrders,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        },
        recentOrders,
        topProducts: topProducts.map(product => ({
          ...product,
          salesCount: product._count.orderItems,
        })),
        orderStats: orderStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
        })),
        userStats: userStats.map(stat => ({
          role: stat.role,
          count: stat._count.role,
        })),
        revenueChart: revenueStats.map(order => ({
          date: order.createdAt.toISOString().split('T')[0],
          revenue: Number(order.total),
        })),
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
        },
      },
    });

  } catch (error: any) {
    console.error('Get analytics error:', error);
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json({ success: false, error: error.message || 'Недостаточно прав' }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: 'Ошибка получения аналитики' },
      { status: 500 }
    );
  }
}
