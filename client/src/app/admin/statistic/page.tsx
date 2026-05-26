'use client';

import { useAppContext } from '@/app/app-provider';
import OrderStatisticsDashboard from '@/components/restaurant/order-statistics-dashboard';

export default function StatisticPage() {
  const { t } = useAppContext();
  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-extrabold'>{t.dashboardTitle}</h1>
        <p className='text-sm text-muted-foreground mt-1'>{t.dashboardSub}</p>
      </div>
      <OrderStatisticsDashboard />
    </div>
  );
}
