import http from '@/lib/http';
import { apiCommonResType } from '@/schemaValidations/common.schema';
import { dashboardStatisticsSchema } from '@/schemaValidations/statistics.schema';

const NEXT_PUBLIC_PREFIX_TAG = process.env.NEXT_PUBLIC_PREFIX_TAG;
const prefix = `${NEXT_PUBLIC_PREFIX_TAG}/statistics`;

const statisticDashboardApiRequest = {
  dashboard: () =>
    http.get<apiCommonResType<typeof dashboardStatisticsSchema>>(
      `${prefix}/dashboard`,
      {
        cache: 'no-store',
        credentials: 'include',
      },
    ),
};

export default statisticDashboardApiRequest;
