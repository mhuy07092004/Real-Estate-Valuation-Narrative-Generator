import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button/button'
import { Card } from '../../../components/ui/card/card'
import { ComparisonRadarChart } from '../../../components/ui/chart/comparison-radar-chart'
import { RemovableChip } from '../../../components/ui/chip/removable-chip'
import { AddItemDropdown } from '../../../components/ui/dropdown/add-item-dropdown'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  MARKET_COMPARISON_AXES,
  getMarketComparisonSuburbs,
  type MarketComparisonAxis,
  type MarketComparisonSuburb,
} from '../../../services/investor'

// Fixed by suburb position in the master list so colors stay stable regardless
// of add/remove order. Extra entries support "up to 4 suburbs" once more mock
// suburbs are added.
const SUBURB_COLOR_PALETTE = ['#2F4B6E', '#3FA9A0', '#E8A33D', '#8B5CF6']

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

type DetailedMetricRow = {
  key: keyof Pick<
    MarketComparisonSuburb,
    | 'medianHousePrice'
    | 'medianUnitPrice'
    | 'growth12m'
    | 'rentalYield'
    | 'vacancyRate'
    | 'clearanceRate'
    | 'populationGrowth'
    | 'supplyConstraint'
  >
  label: string
  higherIsBetter: boolean
  format: (value: number) => string
}

const DETAILED_METRIC_ROWS: DetailedMetricRow[] = [
  {
    key: 'medianHousePrice',
    label: 'Median House Price',
    higherIsBetter: true,
    format: (value) => currencyFormatter.format(value),
  },
  {
    key: 'medianUnitPrice',
    label: 'Median Unit Price',
    higherIsBetter: true,
    format: (value) => currencyFormatter.format(value),
  },
  {
    key: 'growth12m',
    label: '12-Month Growth',
    higherIsBetter: true,
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'rentalYield',
    label: 'Rental Yield',
    higherIsBetter: true,
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'vacancyRate',
    label: 'Vacancy Rate',
    higherIsBetter: false,
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'clearanceRate',
    label: 'Clearance Rate',
    higherIsBetter: true,
    format: (value) => `${Math.round(value)}%`,
  },
  {
    key: 'populationGrowth',
    label: 'Population Growth',
    higherIsBetter: true,
    format: (value) => `${value.toFixed(1)}% p.a.`,
  },
  {
    key: 'supplyConstraint',
    label: 'Supply Constraint',
    higherIsBetter: true,
    format: (value) => `${Math.round(value)}/100`,
  },
]

/**
 * Min-max normalises a single axis to 0-100 across only the currently
 * compared suburbs (inverting axes where a lower raw value is better), so the
 * radar chart always reads "higher is better" for every axis, per suburb set.
 */
function normaliseAxisValue(
  axis: MarketComparisonAxis,
  suburb: MarketComparisonSuburb,
  comparedSuburbs: MarketComparisonSuburb[],
): number {
  const rawValues = comparedSuburbs.map((item) => item[axis.key])
  const min = Math.min(...rawValues)
  const max = Math.max(...rawValues)
  if (min === max) return 100

  const value = suburb[axis.key]
  const ratio = axis.higherIsBetter ? (value - min) / (max - min) : (max - value) / (max - min)
  return Math.round(ratio * 100)
}

/** Ids of the suburb(s) holding the best raw value for a given metric row. */
function findBestSuburbIds(row: DetailedMetricRow, suburbs: MarketComparisonSuburb[]): string[] {
  if (suburbs.length === 0) return []
  const values = suburbs.map((suburb) => suburb[row.key])
  const bestValue = row.higherIsBetter ? Math.max(...values) : Math.min(...values)
  return suburbs.filter((suburb) => suburb[row.key] === bestValue).map((suburb) => suburb.id)
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v12m0 0l4-4m-4 4l-4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.4l-5.9 3.1 1.3-6.6-4.9-4.5 6.6-.8L12 2.5z" />
    </svg>
  )
}

export function MarketComparison() {
  const { data, isLoading } = useAsyncData(getMarketComparisonSuburbs, [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (data && selectedIds.length === 0) {
      setSelectedIds(data.map((suburb) => suburb.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const allSuburbs = data ?? []
  const colorById = new Map(
    allSuburbs.map((suburb, index) => [
      suburb.id,
      SUBURB_COLOR_PALETTE[index % SUBURB_COLOR_PALETTE.length],
    ]),
  )
  const selectedSuburbs = allSuburbs.filter((suburb) => selectedIds.includes(suburb.id))
  const availableSuburbs = allSuburbs.filter((suburb) => !selectedIds.includes(suburb.id))

  function handleRemoveSuburb(id: string) {
    setSelectedIds((current) => current.filter((suburbId) => suburbId !== id))
  }

  function handleAddSuburb(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current : [...current, id]))
  }

  const radarSeries = selectedSuburbs.map((suburb) => ({
    name: suburb.suburb,
    color: colorById.get(suburb.id) ?? SUBURB_COLOR_PALETTE[0],
    values: MARKET_COMPARISON_AXES.map((axis) =>
      normaliseAxisValue(axis, suburb, selectedSuburbs),
    ),
  }))

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">
              Market Comparison
            </h1>
            <p className="mt-1 text-sm text-relaive-gray sm:text-base">
              Compare up to 4 suburbs side by side
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" onClick={() => {}}>
            <span className="mr-1.5">
              <ExportIcon />
            </span>
            Export Report
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          {selectedSuburbs.map((suburb) => (
            <RemovableChip
              key={suburb.id}
              label={suburb.suburb}
              secondaryLabel={suburb.postcode}
              color={colorById.get(suburb.id)}
              onRemove={() => handleRemoveSuburb(suburb.id)}
            />
          ))}
          <AddItemDropdown
            triggerLabel="Add suburb"
            options={availableSuburbs.map((suburb) => ({
              id: suburb.id,
              label: suburb.suburb,
              secondaryLabel: suburb.postcode,
              color: colorById.get(suburb.id),
            }))}
            onSelect={handleAddSuburb}
            emptyMessage="No more suburbs available in this mock dataset."
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-relaive-gray">Loading market comparison…</p>
        ) : selectedSuburbs.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)]">
            <p className="text-sm text-relaive-gray">
              No suburbs selected yet. Add a suburb above to start comparing.
            </p>
          </div>
        ) : (
          <>
            <Card>
              <div>
                <h2 className="text-lg font-semibold text-relaive-navy sm:text-xl">
                  Overall Comparison
                </h2>
                <p className="mt-1 text-sm text-relaive-gray">
                  Scores normalised across compared suburbs — higher is better for all dimensions
                </p>
              </div>
              <div className="mt-4">
                <ComparisonRadarChart
                  axes={MARKET_COMPARISON_AXES.map((axis) => axis.label)}
                  series={radarSeries}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-relaive-navy sm:text-xl">
                Detailed Comparison
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="py-3 pr-4 text-left text-xs font-medium tracking-wide text-relaive-gray uppercase">
                        Metric
                      </th>
                      {selectedSuburbs.map((suburb) => (
                        <th
                          key={suburb.id}
                          className="px-4 py-3 text-left text-sm font-semibold text-relaive-navy"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: colorById.get(suburb.id) }}
                              aria-hidden="true"
                            />
                            {suburb.suburb}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DETAILED_METRIC_ROWS.map((row) => {
                      const bestIds = findBestSuburbIds(row, selectedSuburbs)
                      return (
                        <tr key={row.key} className="border-b border-black/5">
                          <td className="py-3.5 pr-4 text-sm text-relaive-gray">{row.label}</td>
                          {selectedSuburbs.map((suburb) => {
                            const isBest = bestIds.includes(suburb.id)
                            const color = colorById.get(suburb.id)
                            return (
                              <td
                                key={suburb.id}
                                className={`px-4 py-3.5 text-sm ${
                                  isBest ? 'font-semibold' : 'text-relaive-navy'
                                }`}
                                style={isBest ? { color } : undefined}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {row.format(suburb[row.key])}
                                  {isBest ? <StarIcon /> : null}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
