'use client';

import { useEffect, useState } from 'react';
import statisticDashboardApiRequest from '@/apiRequests/statistics';
import { handleErrorApi } from '@/lib/utils';
import type { DashboardStatisticsSchemaType } from '@/schemaValidations/statistics.schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlarmClockCheck,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  ClipboardList,
  UserCheck,
  Users,
} from 'lucide-react';

const dayLabels: Record<
  keyof DashboardStatisticsSchemaType['work_schedule']['day_distribution'],
  string
> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
};

const formatMetric = (value: number, suffix = '') => `${value}${suffix}`;

const getStatusTone = (status: string) => {
  switch (status.toLowerCase()) {
    case 'done':
      return 'bg-emerald-500';
    case 'in progress':
      return 'bg-amber-500';
    case 'pending':
      return 'bg-muted-foreground';
    default:
      return 'bg-sky-500';
  }
};

const DashboardList = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboard, setDashboard] =
    useState<DashboardStatisticsSchemaType | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await statisticDashboardApiRequest.dashboard();
      setDashboard(res.payload.responseData ?? null);
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const taskStatusItems = dashboard?.tasks.by_status ?? [];
  const totalTaskCount = dashboard?.tasks.total_tasks ?? 0;
  const dayDistribution = dashboard?.work_schedule.day_distribution;

  if (isLoading && !dashboard) {
    return (
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='h-36 animate-pulse rounded-xl border bg-muted/40'
          />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
        Khong co du lieu dashboard de hien thi.
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-l-4 border-l-sky-500'>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className='text-3xl'>{totalTaskCount}</CardTitle>
            </div>
            <ClipboardList className='size-5 text-sky-500' />
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {dashboard.tasks.overdue_tasks} overdue tasks need attention
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-emerald-500'>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardDescription>Attendance Valid Rate</CardDescription>
              <CardTitle className='text-3xl'>
                {formatMetric(dashboard.attendance.valid_rate, '%')}
              </CardTitle>
            </div>
            <CheckCheck className='size-5 text-emerald-500' />
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {dashboard.attendance.valid_checkins} /{' '}
            {dashboard.attendance.total_checkins} valid check-ins
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-violet-500'>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardDescription>Schedules</CardDescription>
              <CardTitle className='text-3xl'>
                {dashboard.work_schedule.total_schedules}
              </CardTitle>
            </div>
            <CalendarDays className='size-5 text-violet-500' />
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {dashboard.work_schedule.total_interns} interns and{' '}
            {dashboard.work_schedule.total_mentors} mentors assigned
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-amber-500'>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardDescription>Avg Completion</CardDescription>
              <CardTitle className='text-3xl'>
                {formatMetric(dashboard.tasks.avg_completion_days, 'd')}
              </CardTitle>
            </div>
            <AlarmClockCheck className='size-5 text-amber-500' />
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {dashboard.tasks.completed_on_time} on time,{' '}
            {dashboard.tasks.completed_late} late completions
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 xl:grid-cols-[1.4fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>
              Breakdown by status and execution quality
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-3'>
              {taskStatusItems.map((item) => {
                const percent =
                  totalTaskCount > 0 ? (item.count / totalTaskCount) * 100 : 0;

                return (
                  <div key={item.status} className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center gap-2 font-medium'>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getStatusTone(item.status)}`}
                        />
                        {item.status}
                      </div>
                      <span className='text-muted-foreground'>
                        {item.count} tasks
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-muted'>
                      <div
                        className={`h-full rounded-full ${getStatusTone(item.status)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-lg bg-rose-50 p-4 text-rose-700'>
                <p className='text-sm'>Overdue</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {dashboard.tasks.overdue_tasks}
                </p>
              </div>
              <div className='rounded-lg bg-emerald-50 p-4 text-emerald-700'>
                <p className='text-sm'>Completed On Time</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {dashboard.tasks.completed_on_time}
                </p>
              </div>
              <div className='rounded-lg bg-amber-50 p-4 text-amber-700'>
                <p className='text-sm'>Completed Late</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {dashboard.tasks.completed_late}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>
              Check-in validity and user coverage
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span className='text-sm'>Total Check-ins</span>
                  <UserCheck className='size-4' />
                </div>
                <p className='mt-3 text-2xl font-semibold'>
                  {dashboard.attendance.total_checkins}
                </p>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span className='text-sm'>Unique Users</span>
                  <Users className='size-4' />
                </div>
                <p className='mt-3 text-2xl font-semibold'>
                  {dashboard.attendance.unique_users}
                </p>
              </div>
            </div>

            <div className='grid gap-3'>
              <div className='rounded-lg bg-emerald-50 p-4 text-emerald-700'>
                <p className='text-sm'>Valid Check-ins</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {dashboard.attendance.valid_checkins}
                </p>
              </div>
              <div className='rounded-lg bg-rose-50 p-4 text-rose-700'>
                <p className='text-sm'>Invalid Check-ins</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {dashboard.attendance.invalid_checkins}
                </p>
              </div>
              <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                {dashboard.attendance.daily_trend.length > 0 ? (
                  'Daily trend data is available for chart integration.'
                ) : (
                  <div className='flex items-center gap-2'>
                    <CircleAlert className='size-4' />
                    Chua co du lieu trend attendance.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Schedule Distribution</CardTitle>
          <CardDescription>
            Weekly allocation across internship working days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-5'>
            {dayDistribution &&
              (
                Object.entries(dayDistribution) as Array<
                  [
                    keyof DashboardStatisticsSchemaType['work_schedule']['day_distribution'],
                    number,
                  ]
                >
              ).map(([day, count]) => {
                const maxCount = Math.max(...Object.values(dayDistribution), 1);
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div
                    key={day}
                    className='rounded-xl border bg-gradient-to-b from-slate-50 to-white p-4'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-muted-foreground'>
                        {dayLabels[day]}
                      </span>
                      <span className='text-lg font-semibold'>{count}</span>
                    </div>
                    <div className='mt-6 flex h-36 items-end rounded-lg bg-muted p-2'>
                      <div
                        className='w-full rounded-md bg-background transition-all'
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardList;
