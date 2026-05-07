import http from '@/lib/http';
import type { OrderStatisticsResType, PeriodType } from '@/schemaValidations/orderStatistics.schema';

const orderStatisticsApiRequest = {
  get: (params: { period?: PeriodType; from?: string; to?: string } = {}) => {
    const { period, from, to } = params;
    return http.get<OrderStatisticsResType>('api/v1/statistics/orders', {
      params: { ...(from && to ? { from, to } : { period: period ?? '7d' }) },
    });
  },
};

export default orderStatisticsApiRequest;
