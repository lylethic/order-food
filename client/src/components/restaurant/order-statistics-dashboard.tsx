'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag,
  Banknote,
  TrendingUp,
  XCircle,
  CreditCard,
  ReceiptText,
  CalendarRange,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import orderStatisticsApiRequest from '@/apiRequests/orderStatistics';
import { handleErrorApi } from '@/lib/utils';
import { useAppContext } from '@/app/app-provider';
import {
  PERIODS,
  type PeriodType,
  type OrderStatsSummaryType,
  type RevenuePeriodItemType,
} from '@/schemaValidations/orderStatistics.schema';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₫`;
  return `${value} ₫`;
}

const STATUS_COLORS: Record<string, string> = {
  Received: 'bg-sky-500',
  Preparing: 'bg-amber-500',
  Cooking: 'bg-orange-500',
  Ready: 'bg-violet-500',
  Delivered: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
};

// ── Bar Chart (SVG) ──────────────────────────────────────────────────────────
function BarChart({ data, noDataLabel }: { data: RevenuePeriodItemType[]; noDataLabel: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const chartHeight = 160;

  // Flexible sizing: cap bar width, ensure reasonable spacing
  const barWidth =
    data.length === 1
      ? 56
      : Math.max(24, Math.min(56, Math.floor(560 / data.length) - 16));
  const gap = Math.max(12, Math.min(24, Math.floor(80 / data.length)));
  const totalWidth = data.length * (barWidth + gap);
  const gridLines = 4;

  if (data.length === 0) {
    return (
      <div className='flex items-center justify-center h-40 text-sm text-muted-foreground'>
        {noDataLabel}
      </div>
    );
  }

  return (
    <div className='w-full overflow-x-auto'>
      <svg
        width={data.length <= 4 ? '100%' : totalWidth + 8}
        height={chartHeight + 56}
        viewBox={`-4 -28 ${totalWidth + 8} ${chartHeight + 60}`}
        preserveAspectRatio='xMidYMax meet'
      >
        <defs>
          <linearGradient id='barGrad' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='hsl(239 84% 67%)' stopOpacity='0.95' />
            <stop
              offset='100%'
              stopColor='hsl(239 84% 52%)'
              stopOpacity='0.85'
            />
          </linearGradient>
          <linearGradient id='barGradHover' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='hsl(239 84% 74%)' stopOpacity='1' />
            <stop
              offset='100%'
              stopColor='hsl(239 84% 60%)'
              stopOpacity='0.95'
            />
          </linearGradient>
          <filter id='barShadow'>
            <feDropShadow
              dx='0'
              dy='2'
              stdDeviation='3'
              floodColor='hsl(239 84% 67%)'
              floodOpacity='0.2'
            />
          </filter>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = (i / gridLines) * chartHeight;
          return (
            <line
              key={i}
              x1={0}
              y1={y}
              x2={totalWidth}
              y2={y}
              stroke='hsl(var(--border))'
              strokeWidth={0.5}
              strokeDasharray={i === gridLines ? 'none' : '4 4'}
              opacity={i === gridLines ? 0.5 : 0.25}
            />
          );
        })}

        {data.map((item, i) => {
          const barH =
            maxRevenue > 0 ? (item.revenue / maxRevenue) * chartHeight : 0;
          const x = i * (barWidth + gap) + gap / 2;
          const y = chartHeight - barH;
          const isHovered = hoveredIndex === i;
          const radius = Math.min(barWidth / 4, 8);

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover zone */}
              <rect
                x={x - 4}
                y={0}
                width={barWidth + 8}
                height={chartHeight}
                fill={isHovered ? 'hsl(var(--muted))' : 'transparent'}
                opacity={0.3}
                rx={8}
              />

              {/* Bar track (ghost) */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={radius}
                fill='hsl(var(--muted))'
                opacity={0.25}
              />

              {/* Bar fill */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 0)}
                rx={radius}
                fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                filter={isHovered ? 'url(#barShadow)' : undefined}
                style={{ transition: 'all 0.2s ease' }}
              />

              {/* Tooltip on hover */}
              {isHovered && barH > 0 && (
                <>
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 24}
                    width={60}
                    height={20}
                    rx={6}
                    fill='hsl(var(--popover))'
                    stroke='hsl(var(--border))'
                    strokeWidth={0.5}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 11}
                    textAnchor='middle'
                    fontSize={10}
                    fontWeight='600'
                    fill='hsl(var(--popover-foreground))'
                  >
                    {formatVND(item.revenue)}
                  </text>
                </>
              )}

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor='middle'
                fontSize={10}
                fontWeight={isHovered ? '600' : '400'}
                fill={
                  isHovered
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted-foreground))'
                }
              >
                {item.label}
              </text>

              {/* Order count */}
              {item.orders > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 30}
                  textAnchor='middle'
                  fontSize={9}
                  fill='hsl(239 84% 67%)'
                  fontWeight='700'
                >
                  {item.orders}đ
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ s, t }: { s: OrderStatsSummaryType; t: any }) {
  const cards = [
    {
      label: t.statTotalOrders,
      value: s.totalOrders,
      sub: `${s.cancelledOrders} ${t.statCancelledSub}`,
      icon: ShoppingBag,
      accent: 'border-l-sky-500',
      iconColor: 'text-sky-500',
    },
    {
      label: t.statRevenue,
      value: formatVND(s.totalRevenue),
      sub: `${t.statPaidRevenueSub}: ${formatVND(s.paidRevenue)}`,
      icon: Banknote,
      accent: 'border-l-emerald-500',
      iconColor: 'text-emerald-500',
    },
    {
      label: t.statAvgOrder,
      value: formatVND(s.avgOrderValue),
      sub: `${s.activeOrders} ${t.statValidOrdersSub}`,
      icon: TrendingUp,
      accent: 'border-l-violet-500',
      iconColor: 'text-violet-500',
    },
    {
      label: t.statPaidOrders,
      value: s.paidOrders,
      sub: `${s.activeOrders > 0 ? Math.round((s.paidOrders / s.activeOrders) * 100) : 0}% ${t.statPaidRateSub}`,
      icon: CreditCard,
      accent: 'border-l-amber-500',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {cards.map((c) => (
        <Card key={c.label} className={`border-l-4 ${c.accent}`}>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
            <div className='space-y-1'>
              <CardDescription className='text-xs'>{c.label}</CardDescription>
              <CardTitle className='text-2xl font-extrabold'>
                {c.value}
              </CardTitle>
            </div>
            <c.icon className={`w-5 h-5 mt-0.5 ${c.iconColor}`} />
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>
            {c.sub}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OrderStatisticsDashboard() {
  const { t } = useAppContext();
  const [period, setPeriod] = useState<PeriodType | null>('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    summary: OrderStatsSummaryType;
    ordersByStatus: Record<string, number>;
    revenueByPeriod: RevenuePeriodItemType[];
    groupBy: 'day' | 'week' | 'month';
    period: string;
  } | null>(null);

  const toRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (params: { period?: PeriodType; from?: string; to?: string }) => {
      setLoading(true);
      try {
        const res = await orderStatisticsApiRequest.get(params);
        setData(res.payload.data as any);
      } catch (error) {
        handleErrorApi({ error });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Reload when period changes
  useEffect(() => {
    if (period) load({ period });
  }, [period, load]);

  const handleFromChange = (val: string) => {
    setFromDate(val);
    setPeriod(null);
    if (val && toDate) load({ from: val, to: toDate });
    else if (val) toRef.current?.focus();
  };

  const handleToChange = (val: string) => {
    setToDate(val);
    setPeriod(null);
    if (fromDate && val) load({ from: fromDate, to: val });
  };

  const handlePeriodClick = (p: PeriodType) => {
    setPeriod(p);
    setFromDate('');
    setToDate('');
  };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
    setPeriod('7d');
  };

  const isCustomRange = !period && (fromDate || toDate);

  const periodLabel: Record<string, string> = {
    '3d': t.period3d,
    '7d': t.period7d,
    '1m': t.period1m,
    '3m': t.period3m,
    '6m': t.period6m,
    '1y': t.period1y,
  };

  const statusLabel: Record<string, string> = {
    Received: t.statStatusReceived,
    Preparing: t.statStatusPreparing,
    Cooking: t.statStatusCooking,
    Ready: t.statStatusReady,
    Delivered: t.statStatusDelivered,
    Cancelled: t.statStatusCancelled,
  };

  const totalByStatus = data
    ? Object.values(data.ordersByStatus).reduce((a, b) => a + b, 0)
    : 0;

  const chartDescription =
    data?.period === 'custom' && fromDate && toDate
      ? `${fromDate} → ${toDate}`
      : data?.period
        ? (periodLabel[data.period] ?? data.period)
        : '';

  const groupByLabel =
    data?.groupBy === 'day'
      ? t.chartGroupDay
      : data?.groupBy === 'week'
        ? t.chartGroupWeek
        : t.chartGroupMonth;

  return (
    <div className='space-y-6'>
      {/* Filter bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap'>
        {/* Period buttons */}
        <div className='flex flex-wrap gap-2'>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodClick(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                period === p
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-background border-border hover:bg-accent'
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <span className='hidden sm:block text-muted-foreground text-xs'>|</span>

        {/* Date range inputs */}
        <div className='flex items-center gap-2'>
          <CalendarRange className='w-4 h-4 text-muted-foreground shrink-0' />
          <input
            type='date'
            value={fromDate}
            max={toDate || todayISO()}
            onChange={(e) => handleFromChange(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-xs bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isCustomRange ? 'border-indigo-400' : 'border-border'
            }`}
          />
          <span className='text-xs text-muted-foreground'>→</span>
          <input
            ref={toRef}
            type='date'
            value={toDate}
            min={fromDate || undefined}
            max={todayISO()}
            onChange={(e) => handleToChange(e.target.value)}
            className={`h-8 rounded-lg border px-2 text-xs bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isCustomRange ? 'border-indigo-400' : 'border-border'
            }`}
          />
          {isCustomRange && (
            <button
              onClick={clearDateRange}
              className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors'
              title={t.clearFilter}
            >
              <X className='w-3.5 h-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='h-28 animate-pulse rounded-xl border bg-muted/40'
            />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <SummaryCards s={data.summary} t={t} />

          <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
            {/* Revenue bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <ReceiptText className='w-4 h-4 text-indigo-500' />
                  {t.chartTitle}
                </CardTitle>
                <CardDescription>
                  {chartDescription} · {t.chartGroupedBy} {groupByLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart data={data.revenueByPeriod} noDataLabel={t.chartNoData} />
                {/* Legend */}
                <div className='mt-4 flex gap-4 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <span className='w-3 h-3 rounded bg-indigo-500 inline-block' />
                    {t.statRevenue}
                  </span>
                  <span className='flex items-center gap-1'>
                    <span className='font-bold text-indigo-500'>Nđ</span>
                    {t.adminOrders}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Orders by status */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <XCircle className='w-4 h-4 text-rose-500' />
                  {t.statusBreakdown}
                </CardTitle>
                <CardDescription>
                  {t.statusBreakdownSub} {chartDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.ordersByStatus).map(([status, count]) => {
                  const pct =
                    totalByStatus > 0
                      ? Math.round((count / totalByStatus) * 100)
                      : 0;
                  return (
                    <div key={status} className='space-y-1'>
                      <div className='flex justify-between text-xs font-semibold'>
                        <span className='flex items-center gap-1.5'>
                          <span
                            className={`w-2 h-2 rounded-full inline-block ${STATUS_COLORS[status] ?? 'bg-muted-foreground'}`}
                          />
                          {statusLabel[status] ?? status}
                        </span>
                        <span className='text-muted-foreground'>
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-muted-foreground'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
