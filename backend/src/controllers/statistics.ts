import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { isStaff } from '../middleware/rbac.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

type Period = '3d' | '7d' | '1m' | '3m' | '6m' | '1y';
type GroupBy = 'day' | 'week' | 'month';

function groupByForDays(days: number): GroupBy {
  if (days <= 31) return 'day';
  if (days <= 90) return 'week';
  return 'month';
}

function dateRangeForPeriod(period: Period): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  switch (period) {
    case '3d':  from.setDate(to.getDate() - 3);   break;
    case '7d':  from.setDate(to.getDate() - 7);   break;
    case '1m':  from.setDate(to.getDate() - 30);  break;
    case '3m':  from.setDate(to.getDate() - 90);  break;
    case '6m':  from.setDate(to.getDate() - 180); break;
    case '1y':  from.setDate(to.getDate() - 365); break;
  }
  return { from, to };
}

router.get('/statistics/orders', authenticate, isStaff, async (req, res) => {
  try {
    let from: Date;
    let to: Date;
    let period: string;

    const { from: fromQ, to: toQ, period: periodQ } = req.query as Record<string, string>;

    if (fromQ && toQ) {
      from = new Date(fromQ);
      to = new Date(toQ);
      // include the full last day
      to.setHours(23, 59, 59, 999);
      period = 'custom';
    } else {
      const p = (periodQ as Period) ?? '7d';
      ({ from, to } = dateRangeForPeriod(p));
      period = p;
    }

    const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
    const groupBy = groupByForDays(diffDays);
    const truncUnit = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';

    const dateFilter = { gte: from, lte: to };

    // Summary counts
    const [totalOrders, cancelledOrders, paidOrders] = await Promise.all([
      prisma.order.count({ where: { deleted: false, created: dateFilter } }),
      prisma.order.count({ where: { deleted: false, created: dateFilter, status: 'Cancelled' } }),
      prisma.order.count({ where: { deleted: false, created: dateFilter, is_paid: true } }),
    ]);

    const [revenueAgg, paidRevenueAgg] = await Promise.all([
      prisma.order.aggregate({
        where: { deleted: false, created: dateFilter, status: { not: 'Cancelled' } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { deleted: false, created: dateFilter, is_paid: true },
        _sum: { total: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.total ?? 0);
    const paidRevenue = Number(paidRevenueAgg._sum.total ?? 0);
    const activeOrders = totalOrders - cancelledOrders;
    const avgOrderValue = activeOrders > 0 ? Math.round(totalRevenue / activeOrders) : 0;

    // Orders by status
    const statusGroups = await prisma.order.groupBy({
      by: ['status'],
      where: { deleted: false, created: dateFilter },
      _count: { id: true },
    });
    const ordersByStatus: Record<string, number> = {};
    for (const g of statusGroups) ordersByStatus[g.status] = g._count.id;

    // Time-series
    const rows: Array<{ period: Date; order_count: bigint; revenue: bigint | null }> =
      await prisma.$queryRaw`
        SELECT
          DATE_TRUNC(${truncUnit}, created) AS period,
          COUNT(*)::bigint AS order_count,
          SUM(CASE WHEN status != 'Cancelled' THEN COALESCE(total, 0) ELSE 0 END)::bigint AS revenue
        FROM orders
        WHERE deleted = false
          AND created >= ${from}
          AND created <= ${to}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

    const revenueByPeriod = rows.map((r) => {
      const d = new Date(r.period);
      let label: string;
      if (groupBy === 'day') {
        label = d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
      } else if (groupBy === 'week') {
        label = `T${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
      } else {
        label = d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
      }
      return { label, orders: Number(r.order_count), revenue: Number(r.revenue ?? 0) };
    });

    sendResponse(res, {
      message: 'Lấy thống kê thành công',
      message_en: 'Statistics retrieved successfully',
      data: { summary: { totalOrders, activeOrders, cancelledOrders, paidOrders, totalRevenue, paidRevenue, avgOrderValue }, ordersByStatus, revenueByPeriod, period, groupBy },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
