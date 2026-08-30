import { useEffect, useMemo, useState } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { getMarketMetricsForAddress, type MarketMetrics } from '../../../services/common'

// Net-new v2 page — figma: MarketComparisonPage.tsx (radar chart + suburb comparison table
// for up to 4 suburbs). The prototype's 6 radar dimensions (Growth, Yield, Low Vacancy,
// Clearance, Population, Supply) are NOT backed by real data — the only real, backend-computed
// per-suburb metrics in this app are the 4 returned by /api/appraisal/market-metrics (median
// price + 12-month growth, monthly growth, days on market, rental yield — see
// v2/services/common.ts's getMarketMetrics()/buildMarketMetrics() in mock.routes.ts). Rather
// than fabricate vacancy/clearance/population/supply scores, the radar + table here use only
// those 4 real dimensions. Logged as a gap in backend/V2_BACKEND_TODO.md.
//
// There's also no suburb-search/autocomplete endpoint, so suburb selection uses a fixed list
// of real Australian suburbs (same illustrative-location pattern already used for default
// addresses elsewhere in this app, e.g. "45 Park Ave, Richmond VIC 3121"). Each selection is
// turned into a synthetic street address and sent to the real endpoint — backend/mock.routes.ts's
// buildMarketMetrics() seeds purely off suburb+postcode, so the street number/name are inert
// and every returned number is real, deterministic, backend-computed data for that suburb.

type SuburbOption = { id: string; name: string; state: string; postcode: string; color: string }

const SUBURB_OPTIONS: SuburbOption[] = [
  { id: '1', name: 'Richmond', state: 'VIC', postcode: '3121', color: '#5193B3' },
  { id: '2', name: 'Footscray', state: 'VIC', postcode: '3011', color: '#62C4C3' },
  { id: '3', name: 'Brunswick', state: 'VIC', postcode: '3056', color: '#FBD49B' },
  { id: '4', name: 'Northcote', state: 'VIC', postcode: '3070', color: '#E38C7A' },
  { id: '5', name: 'Surry Hills', state: 'NSW', postcode: '2010', color: '#8E7CC3' },
  { id: '6', name: 'St Kilda', state: 'VIC', postcode: '3182', color: '#6FBF7B' },
]

const MAX_SUBURBS = 3

function suburbAddress(suburb: SuburbOption): string {
  return `1 Main St, ${suburb.name} ${suburb.state} ${suburb.postcode}`
}

function metricNumber(metrics: MarketMetrics, id: string): number {
  const raw = metrics.metrics.find((m) => m.id === id)?.value ?? metrics.metrics.find((m) => m.id === id)?.change ?? '0'
  const parsed = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function metricChange(metrics: MarketMetrics, id: string): number {
  const raw = metrics.metrics.find((m) => m.id === id)?.change ?? '0'
  const parsed = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalize(value: number, min: number, max: number, invert = false): number {
  if (max === min) return 50
  const norm = ((value - min) / (max - min)) * 100
  const clamped = Math.max(0, Math.min(100, norm))
  return Math.round(invert ? 100 - clamped : clamped)
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

type SuburbRow = SuburbOption & { metrics: MarketMetrics | null }

export function MarketComparisonPageV2() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['1', '2', '3'])
  const [rows, setRows] = useState<Record<string, MarketMetrics | null>>({})
  const [showPicker, setShowPicker] = useState(false)

  const selected = useMemo(() => SUBURB_OPTIONS.filter((s) => selectedIds.includes(s.id)), [selectedIds])

  useEffect(() => {
    let cancelled = false
    selected.forEach((suburb) => {
      if (rows[suburb.id] !== undefined) return
      getMarketMetricsForAddress(suburbAddress(suburb))
        .then((metrics) => {
          if (!cancelled) setRows((prev) => ({ ...prev, [suburb.id]: metrics }))
        })
        .catch(() => {
          if (!cancelled) setRows((prev) => ({ ...prev, [suburb.id]: null }))
        })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  const suburbRows: SuburbRow[] = selected.map((s) => ({ ...s, metrics: rows[s.id] ?? null }))
  const allLoaded = suburbRows.every((r) => r.metrics)

  function remove(id: string) {
    setSelectedIds((prev) => prev.filter((s) => s !== id))
  }

  function add(id: string) {
    setSelectedIds((prev) => (prev.includes(id) || prev.length >= MAX_SUBURBS ? prev : [...prev, id]))
    setShowPicker(false)
  }

  const radarData = useMemo(() => {
    if (!allLoaded) return []
    const dims: { subject: string; getValue: (m: MarketMetrics) => number; invert?: boolean }[] = [
      { subject: '12-Mo Growth', getValue: (m) => metricChange(m, 'median-price') },
      { subject: 'Monthly Growth', getValue: (m) => metricChange(m, 'monthly-growth') },
      { subject: 'Rental Yield', getValue: (m) => metricNumber(m, 'rental-yield') },
      { subject: 'Fast Turnover', getValue: (m) => metricNumber(m, 'days-on-market'), invert: true },
    ]
    return dims.map(({ subject, getValue, invert }) => {
      const values = suburbRows.map((r) => getValue(r.metrics as MarketMetrics))
      const min = Math.min(...values)
      const max = Math.max(...values)
      const row: Record<string, string | number> = { subject }
      suburbRows.forEach((r, i) => {
        row[r.name] = normalize(values[i], min, max, invert)
      })
      return row
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, selectedIds])

  const tableMetrics: { id: string; label: string; good: 'high' | 'low' }[] = [
    { id: 'median-price', label: 'Median Price', good: 'high' },
    { id: 'monthly-growth', label: 'Monthly Growth', good: 'high' },
    { id: 'days-on-market', label: 'Days on Market', good: 'low' },
    { id: 'rental-yield', label: 'Rental Yield', good: 'high' },
  ]

  function metricDisplay(metrics: MarketMetrics, id: string): string {
    return metrics.metrics.find((m) => m.id === id)?.value ?? '—'
  }

  function bestId(id: string, good: 'high' | 'low'): string | null {
    if (suburbRows.length < 2 || !allLoaded) return null
    const values = suburbRows.map((r) => (id === 'median-price' ? metricChange(r.metrics as MarketMetrics, id) : metricNumber(r.metrics as MarketMetrics, id)))
    const target = good === 'high' ? Math.max(...values) : Math.min(...values)
    const idx = values.indexOf(target)
    return suburbRows[idx]?.id ?? null
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="font-sans">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Market Comparison</h1>
        <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Compare up to {MAX_SUBURBS} suburbs side by side, using real market data</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {suburbRows.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 shadow-sm">
            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-sm font-medium text-relaive-navy">{s.name}</span>
            <span className="text-xs text-relaive-gray">
              {s.state} {s.postcode}
            </span>
            {suburbRows.length > 1 ? (
              <button type="button" onClick={() => remove(s.id)} className="ml-1 text-relaive-navy/30 transition-colors hover:text-red-400">
                <XIcon />
              </button>
            ) : null}
          </div>
        ))}
        {suburbRows.length < MAX_SUBURBS ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-dashed border-relaive-primary/30 bg-white px-4 py-2 text-sm text-relaive-primary transition-colors hover:border-relaive-primary/60"
            >
              <PlusIcon />
              Add suburb
            </button>
            {showPicker ? (
              <div className="absolute top-full left-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
                {SUBURB_OPTIONS.filter((s) => !selectedIds.includes(s.id)).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => add(s.id)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-relaive-navy transition-colors hover:bg-[#EEF3F7]"
                  >
                    {s.name} {s.state} {s.postcode}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <h3 className="mb-1 text-sm font-semibold text-relaive-navy">Overall Comparison</h3>
        <p className="mb-4 text-xs text-relaive-gray">
          Scores normalised across the compared suburbs from real market-metrics data — higher is better for all axes
        </p>
        <div className="h-72">
          {allLoaded ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#EEF3F7" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#1C2A38', fillOpacity: 0.6 }} />
                {suburbRows.map((s) => (
                  <Radar key={s.id} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.12} strokeWidth={2} />
                ))}
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EEF3F7', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-relaive-gray">Loading market data…</div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="border-b border-[#EEF3F7] px-5 py-4">
          <h3 className="text-sm font-semibold text-relaive-navy">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EEF3F7]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-relaive-gray">Metric</th>
                {suburbRows.map((s) => (
                  <th key={s.id} className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs font-semibold text-relaive-navy">{s.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F7]">
              {tableMetrics.map((m) => {
                const best = bestId(m.id, m.good)
                return (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5 text-sm text-relaive-gray">{m.label}</td>
                    {suburbRows.map((s) => (
                      <td key={s.id} className="px-5 py-3.5 text-center text-sm">
                        {s.metrics ? (
                          <span className={best === s.id ? 'font-semibold' : 'font-medium text-relaive-navy'} style={best === s.id ? { color: s.color } : undefined}>
                            {metricDisplay(s.metrics, m.id)}
                            {best === s.id ? <span className="ml-1 text-[10px] opacity-70">★</span> : null}
                          </span>
                        ) : (
                          <span className="text-relaive-gray">…</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
