import z from 'zod';

export const PERIODS = ['3d', '7d', '1m', '3m', '6m', '1y'] as const;
export type PeriodType = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<PeriodType, string> = {
  '3d': '3 ngày',
  '7d': '7 ngày',
  '1m': '1 tháng',
  '3m': '3 tháng',
  '6m': '6 tháng',
  '1y': '1 năm',
};

export const OrderStatsSummary = z.object({
  totalOrders: z.number(),
  activeOrders: z.number(),
  cancelledOrders: z.number(),
  paidOrders: z.number(),
  totalRevenue: z.number(),
  paidRevenue: z.number(),
  avgOrderValue: z.number(),
});
export type OrderStatsSummaryType = z.TypeOf<typeof OrderStatsSummary>;

export const RevenuePeriodItem = z.object({
  label: z.string(),
  orders: z.number(),
  revenue: z.number(),
});
export type RevenuePeriodItemType = z.TypeOf<typeof RevenuePeriodItem>;

export const OrderStatisticsRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.object({
    summary: OrderStatsSummary,
    ordersByStatus: z.record(z.string(), z.number()),
    revenueByPeriod: z.array(RevenuePeriodItem),
    period: z.string(),
    groupBy: z.enum(['day', 'week', 'month']),
  }),
});
export type OrderStatisticsResType = z.TypeOf<typeof OrderStatisticsRes>;
