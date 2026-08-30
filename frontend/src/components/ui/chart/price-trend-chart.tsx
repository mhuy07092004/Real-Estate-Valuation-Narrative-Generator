import { useId, useState } from 'react'

export type PriceTrendPoint = {
  label: string
  value: number
}

type PriceTrendChartProps = {
  data: PriceTrendPoint[]
  valueFormatter?: (value: number) => string
  className?: string
}

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 260
const PAD_X = 16
const PAD_Y_TOP = 12
const PAD_Y_BOTTOM = 12
const PLOT_WIDTH = VIEW_WIDTH - PAD_X * 2
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_Y_TOP - PAD_Y_BOTTOM

function computeNiceTicks(dataMin: number, dataMax: number, tickCount = 5): number[] {
  let min = dataMin
  let max = dataMax
  if (min === max) {
    min -= 1
    max += 1
  }

  const range = max - min
  const rawStep = range / Math.max(tickCount - 1, 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude

  let niceStep: number
  if (normalized <= 1) niceStep = 1
  else if (normalized <= 2) niceStep = 2
  else if (normalized <= 5) niceStep = 5
  else niceStep = 10
  niceStep *= magnitude

  const niceMin = Math.floor(min / niceStep) * niceStep
  const niceMax = Math.ceil(max / niceStep) * niceStep

  const ticks: number[] = []
  for (let value = niceMin; value <= niceMax + niceStep / 2; value += niceStep) {
    ticks.push(Math.round(value * 100) / 100)
  }
  return ticks
}

export function PriceTrendChart({ data, valueFormatter, className = '' }: PriceTrendChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const formatValue = valueFormatter ?? ((value: number) => String(value))

  if (data.length === 0) {
    return (
      <div className={`flex h-64 items-center justify-center text-sm text-relaive-gray ${className}`}>
        No trend data available.
      </div>
    )
  }

  const values = data.map((point) => point.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const padding = (dataMax - dataMin) * 0.15 || Math.max(dataMax * 0.1, 1)
  const ticks = computeNiceTicks(dataMin - padding, dataMax + padding)
  const domainMin = ticks[0]
  const domainMax = ticks[ticks.length - 1]
  const domainRange = domainMax - domainMin || 1

  function xForIndex(index: number): number {
    if (data.length === 1) return PAD_X + PLOT_WIDTH / 2
    return PAD_X + (index / (data.length - 1)) * PLOT_WIDTH
  }

  function yForValue(value: number): number {
    return PAD_Y_TOP + (1 - (value - domainMin) / domainRange) * PLOT_HEIGHT
  }

  const points = data.map((point, index) => ({
    ...point,
    x: xForIndex(index),
    y: yForValue(point.value),
  }))

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ')

  const bottomY = PAD_Y_TOP + PLOT_HEIGHT
  const areaPath = `${linePath} L${points[points.length - 1].x},${bottomY} L${points[0].x},${bottomY} Z`

  const hitZones = points.map((point, index) => {
    const prevBoundary = index === 0 ? 0 : (points[index - 1].x + point.x) / 2
    const nextBoundary =
      index === points.length - 1 ? VIEW_WIDTH : (point.x + points[index + 1].x) / 2
    return { x: prevBoundary, width: nextBoundary - prevBoundary }
  })

  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const tooltipLeftPct = hovered ? (hovered.x / VIEW_WIDTH) * 100 : 0
  const tooltipTopPct = hovered ? (hovered.y / VIEW_HEIGHT) * 100 : 0

  return (
    <div className={className}>
      <div className="flex">
        <div
          className="relative w-10 shrink-0 text-xs text-relaive-gray/70"
          style={{ height: '16rem' }}
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 -translate-y-1/2"
              style={{ top: `${(yForValue(tick) / VIEW_HEIGHT) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: '16rem' }}>
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-relaive-primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-relaive-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => (
              <line
                key={tick}
                x1={PAD_X}
                x2={VIEW_WIDTH - PAD_X}
                y1={yForValue(tick)}
                y2={yForValue(tick)}
                stroke="#E2E8F0"
                strokeWidth={1}
              />
            ))}

            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-relaive-primary)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hovered ? (
              <>
                <line
                  x1={hovered.x}
                  x2={hovered.x}
                  y1={PAD_Y_TOP}
                  y2={bottomY}
                  stroke="var(--color-relaive-primary)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <circle
                  cx={hovered.x}
                  cy={hovered.y}
                  r={5}
                  fill="var(--color-relaive-primary)"
                  stroke="white"
                  strokeWidth={2}
                />
              </>
            ) : null}

            {hitZones.map((zone, index) => (
              <rect
                key={data[index].label + index}
                x={zone.x}
                y={0}
                width={zone.width}
                height={VIEW_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
              />
            ))}
          </svg>

          {hovered ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-xl border border-black/5 bg-white px-3 py-2 text-xs shadow-[0_8px_24px_rgba(26,32,44,0.12)]"
              style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPct}%` }}
            >
              <p className="font-semibold text-relaive-navy">{hovered.label}</p>
              <p className="mt-0.5 text-relaive-gray">Price Index : {formatValue(hovered.value)}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex pl-10">
        {data.map((point) => (
          <span
            key={point.label}
            className="flex-1 text-center text-xs text-relaive-gray/70"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  )
}
