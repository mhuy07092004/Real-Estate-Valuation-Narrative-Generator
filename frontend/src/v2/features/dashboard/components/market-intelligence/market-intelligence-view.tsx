import type { ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MarketMetric, PriceTrendPoint } from '../../../../services/common'

// Shared core for Market Intelligence — used by both the generate-report wizard step
// (variant="compact") and the standalone Market Intelligence page (variant="full").
// Rebuilt to match figma's actual pattern (metric cards + price trend chart) after the
// first version mistakenly followed the older Suburb Overview/Demand Signals layout.
// See figma-ui-migration-plan.md §4.5 / §9.1. Data is real (backend-computed, deterministic
// per address) — see v2/services/common.ts's getMarketMetrics().

const METRIC_ICON: Record<string, (props: { className?: string }) => ReactNode> = {
  'median-price': HomeIcon,
  'monthly-growth': TrendUpIcon,
  'days-on-market': CalendarIcon,
  'rental-yield': PinIcon,
}

function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendUpIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 16.5l5.5-5.5 3.5 3.5L20 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7.5h5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function ArrowUpRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowDownRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 7L17 17M17 9v8H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MetricCard({ metric }: { metric: MarketMetric }) {
  const Icon = METRIC_ICON[metric.id] ?? TrendUpIcon

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-relaive-primary/10 text-relaive-primary">
          <Icon />
        </span>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${metric.up ? 'text-emerald-600' : 'text-red-500'}`}>
          {metric.up ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
          {metric.change}
        </span>
      </div>
      <p className="text-xl font-semibold text-relaive-navy sm:text-2xl">{metric.value}</p>
      <p className="mt-0.5 text-xs text-relaive-gray">{metric.label}</p>
      <p className="mt-0.5 text-[11px] text-relaive-gray/70">{metric.detail}</p>
    </div>
  )
}

function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  return `$${Math.round(value / 1000)}k`
}

function PriceTrendChart({ priceTrend, height }: { priceTrend: PriceTrendPoint[]; height: number }) {
  const gradientId = `price-trend-fill-${height}`

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-relaive-primary">
          <TrendUpIcon />
        </span>
        <span className="text-sm font-semibold text-relaive-navy">Price Trend — Last 12 Months</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={priceTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5193B3" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#5193B3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#5193B3" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#1C2A38', opacity: 0.45 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#1C2A38', opacity: 0.45 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatCompactPrice(value)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid rgba(81,147,179,0.15)', borderRadius: 10, fontSize: 12, color: '#102132' }}
            formatter={(value: unknown) => [formatCompactPrice(Number(value ?? 0)), 'Median']}
          />
          <Area type="monotone" dataKey="value" stroke="#5193B3" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

type MarketIntelligenceViewProps = {
  metrics: MarketMetric[]
  priceTrend: PriceTrendPoint[]
  variant?: 'compact' | 'full'
}

export function MarketIntelligenceView({ metrics, priceTrend, variant = 'compact' }: MarketIntelligenceViewProps) {
  if (metrics.length === 0 && priceTrend.length === 0) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white py-12 text-center">
        <p className="text-sm font-medium text-relaive-navy">No market data found</p>
        <p className="mt-1 text-sm text-relaive-gray">Try a different address.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <PriceTrendChart priceTrend={priceTrend} height={variant === 'full' ? 220 : 160} />
    </div>
  )
}
