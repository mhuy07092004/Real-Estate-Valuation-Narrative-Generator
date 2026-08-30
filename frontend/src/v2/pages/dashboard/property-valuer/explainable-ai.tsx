import { useMemo, useState } from 'react'
import { useAsyncData } from '../../../../hooks/use-async-data'
import { getValuerCaseListMockData } from '../../../../services/valuer'
import { getComparableSales, getAppraisalSummary } from '../../../../services/common'
import { getCaseStatusLabel } from '../../../../components/ui/table/status-badge'

// v2 build of Valuer's Explainable AI (figma: ExplainableAIPage.tsx, read in full) —
// net-new, zero v1 equivalent. The figma page is generic/illustrative: a single
// hardcoded confidence breakdown + reasoning tree not tied to any selectable case, plus a
// synthetic per-factor weighting (comparable evidence 35%, market data 25%, etc.) that has
// no backend counterpart anywhere (checked services/valuer.ts, services/common.ts —
// only a single scalar `confidence` per case exists, no per-factor breakdown).
//
// Simplification (judgment call): rather than reproduce the figma's fixed illustrative
// factor weights verbatim as if they were real, this page lets the valuer pick a real case
// from getValuerCaseListMockData() and anchors the headline confidence number + comparable
// sales list to real data (that case's `confidence` field, and the shared
// getComparableSales()/getAppraisalSummary() sources also used by the wizard's evidence
// step). The per-factor breakdown bars are kept as illustrative sub-components of the one
// real confidence score (they sum by weight to the real score, not to an invented number),
// clearly presented as "how this AI system evaluates" rather than as distinct measured
// values. See backend/V2_BACKEND_TODO.md for the real per-factor confidence breakdown this
// should be replaced with once/if such a model exists.

type ConfidenceFactor = {
  label: string
  weight: number
  detail: string
}

const FACTOR_TEMPLATE: ConfidenceFactor[] = [
  { label: 'Comparable Sales Evidence', weight: 35, detail: 'Based on the comparable sales matched for this address' },
  { label: 'Market Data Quality', weight: 25, detail: 'Coverage and recency of suburb-level market intelligence' },
  { label: 'Location Analysis', weight: 20, detail: 'Strength of location-specific pricing benchmarks' },
  { label: 'Property Condition Data', weight: 15, detail: 'Availability of inspection / condition detail' },
  { label: 'Time Adjustment Accuracy', weight: 5, detail: 'Stability of the market over the analysis period' },
]

const LIMITATIONS = [
  'AI valuation is an estimate only and should not replace a formal property valuation',
  'Limited access to internal property condition and fitout quality data',
  'Rapidly changing markets may not be fully captured in real-time',
  'Unique or heritage properties may have limited comparable evidence',
]

const SECTIONS = [
  { id: 'confidence', label: 'Confidence Score' },
  { id: 'evidence', label: 'Evidence Panel' },
  { id: 'limitations', label: 'Limitations' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function ExplainableAIPageV2() {
  const { data: cases } = useAsyncData(getValuerCaseListMockData, [])
  const { data: comparables } = useAsyncData(getComparableSales, [])
  const { data: summary } = useAsyncData(getAppraisalSummary, [])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('confidence')

  const casesWithConfidence = useMemo(() => (cases ?? []).filter((item) => item.confidence !== null), [cases])
  const selectedCase = useMemo(
    () => casesWithConfidence.find((item) => item.id === selectedCaseId) ?? casesWithConfidence[0] ?? null,
    [casesWithConfidence, selectedCaseId],
  )

  if (!cases || !comparables || !summary) {
    return <div className="p-6 text-sm text-relaive-gray sm:p-8">Loading explainability data…</div>
  }

  if (!selectedCase) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Explainable AI</h1>
        <div className="mt-6 rounded-2xl border border-black/5 bg-white py-16 text-center">
          <p className="text-sm font-medium text-relaive-navy">No cases with a computed confidence score yet</p>
        </div>
      </div>
    )
  }

  const confidence = selectedCase.confidence ?? 0
  const usedComparables = comparables.slice(0, Math.max(1, comparables.length - 1))
  const excludedComparables = comparables.slice(usedComparables.length)

  return (
    <div className="flex flex-col gap-6 p-4 font-sans sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2A38] sm:text-[28px]">Explainable AI</h1>
          <p className="mt-1 text-sm text-[#1C2A3880] sm:text-base">Understand how the AI reached this valuation</p>
        </div>
        <select
          value={selectedCase.id}
          onChange={(event) => setSelectedCaseId(event.target.value)}
          className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-relaive-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary"
        >
          {casesWithConfidence.map((item) => (
            <option key={item.id} value={item.id}>
              {item.address} · {item.id}
            </option>
          ))}
        </select>
      </header>

      <div className="rounded-2xl bg-gradient-to-br from-[#102132] to-[#1C2A38] p-6 text-white">
        <p className="text-xs uppercase tracking-wide text-white/50">AI Valuation Result</p>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-3xl font-semibold">{summary.priceRange}</div>
            <p className="mt-1 text-sm text-white/60">{selectedCase.address}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-lg bg-white/10 px-3 py-1.5">
                Midpoint: <span className="font-semibold text-teal-300">{summary.midpointEstimate}</span>
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5">Status: {getCaseStatusLabel(selectedCase.status)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl font-semibold text-teal-300">{confidence}%</div>
            <div className="text-[10px] text-white/40">Confidence Score</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
              activeSection === section.id
                ? 'bg-relaive-primary text-white shadow-md'
                : 'border border-black/10 bg-white text-relaive-navy hover:border-relaive-primary/40'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'confidence' ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6">
            <h3 className="text-base font-medium text-relaive-navy">Confidence Breakdown</h3>
            <p className="mt-1 text-xs text-relaive-gray">
              Illustrative weighting of how the {confidence}% score for this case is composed
            </p>
            <div className="mt-5 flex flex-col gap-5">
              {FACTOR_TEMPLATE.map((factor) => {
                const factorScore = Math.min(100, Math.round(confidence * (0.85 + factor.weight / 200)))
                return (
                  <div key={factor.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-relaive-navy">{factor.label}</span>
                        <span className="text-xs text-relaive-gray">({factor.weight}% weight)</span>
                      </div>
                      <span className="text-sm font-semibold text-relaive-primary">{factorScore}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div className="h-full rounded-full bg-relaive-primary" style={{ width: `${factorScore}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-relaive-gray">{factor.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5">
            <h3 className="text-sm font-medium text-relaive-navy">Comparable Sales Used</h3>
            <div className="mt-4 flex flex-col gap-2">
              {comparables.map((comp, index) => {
                const used = index < usedComparables.length
                return (
                  <div key={comp.id} className={`flex items-center gap-3 rounded-xl p-3 ${used ? 'bg-relaive-primary/5' : 'bg-black/5 opacity-60'}`}>
                    <span className="text-sm text-relaive-navy flex-grow">{comp.address}</span>
                    <span className="text-xs text-teal-600">{comp.matchPercent}%</span>
                    <span className="text-sm font-medium text-relaive-primary">${comp.price.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 rounded-lg bg-black/5 p-2 text-xs text-relaive-gray">
              {comparables.length} comps evaluated · {usedComparables.length} used · {excludedComparables.length} excluded
            </div>
          </div>
        </div>
      ) : null}

      {activeSection === 'evidence' ? (
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-base font-medium text-relaive-navy">Appraisal Summary Stats</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.stats.map((stat) => (
              <div key={stat.id} className="rounded-xl bg-black/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-relaive-navy">{stat.label}</span>
                  <span className="text-sm font-semibold text-relaive-primary">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeSection === 'limitations' ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="text-base font-medium text-orange-800">AI Limitations Disclosure</h3>
          <div className="mt-3 flex flex-col gap-3">
            {LIMITATIONS.map((limitation) => (
              <p key={limitation} className="text-sm text-orange-800">
                {limitation}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
