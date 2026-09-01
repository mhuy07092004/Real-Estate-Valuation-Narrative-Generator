import { Card } from '../../../../components/ui/card/card'
import { PriceTrendChart } from '../../../../components/ui/chart/price-trend-chart'
import { StatCard } from '../../../../components/ui/stat-card/stat-card'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getMarketIntelligenceOverview, getAppraisalInputContext } from '../../../../services/common'
import { StepActions } from './step-actions'

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5L12 4.5l8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5V15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16.5l5.5-5.5 3.5 3.5L20 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 7.5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const STAT_ICONS = [<HomeIcon />, <TrendIcon />, <CalendarIcon />, <PinIcon />]

type MarketIntelligencePanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function MarketIntelligencePanel({ onBack, onContinue }: MarketIntelligencePanelProps) {
  const { data } = useAsyncData(getMarketIntelligenceOverview, [])
  const context = getAppraisalInputContext()
  const subjectLabel = context?.address || data?.suburbLabel

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-relaive-gray">Current market data for {subjectLabel ?? '—'}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.stats ?? []).map((stat, index) => (
          <StatCard
            key={stat.id}
            icon={STAT_ICONS[index % STAT_ICONS.length]}
            tone="blue"
            label={stat.label.toUpperCase()}
            value={stat.value}
            trend={stat.trend}
          />
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <span className="text-relaive-primary">
            <TrendIcon />
          </span>
          <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">
            Price Trend — Last 12 Months
          </h3>
        </div>

        <div className="mt-4">
          <PriceTrendChart
            data={(data?.priceTrend ?? []).map((point) => ({
              label: point.month,
              value: point.priceIndex,
            }))}
          />
        </div>
      </Card>

      <StepActions onBack={onBack} onContinue={onContinue} continueLabel="Next: Report Type >" />
    </div>
  )
}
