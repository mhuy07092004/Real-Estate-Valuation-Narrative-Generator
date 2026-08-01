import { randomUUID } from 'node:crypto'
import type { AppraisalDraft, PropertyInputData } from '../types/appraisal.types.js'
import {
  getAiAnalysisMetrics,
  getAiAnalysisSummaryNotification,
  getComparableSales,
  getDemandSignals,
  getSuburbOverview,
} from './appraisal-mock-data.service.js'

// TODO: swap for a real `reports` table once the team decides to persist
// drafts — per current direction this is intentionally in-memory only,
// same as the earlier demo-session store in navigation.service.ts.
const drafts = new Map<string, AppraisalDraft>()

export class DraftNotFoundError extends Error {
  constructor(draftId: string) {
    super(`No appraisal draft found for id "${draftId}"`)
    this.name = 'DraftNotFoundError'
  }
}

function touch(draft: AppraisalDraft): AppraisalDraft {
  draft.updatedAt = new Date().toISOString()
  return draft
}

function getOrThrow(draftId: string): AppraisalDraft {
  const draft = drafts.get(draftId)
  if (!draft) throw new DraftNotFoundError(draftId)
  return draft
}

/** Step 1: creates a new draft from the submitted property input. */
export function createDraft(propertyInput: PropertyInputData): AppraisalDraft {
  const draftId = randomUUID()
  const now = new Date().toISOString()
  const draft: AppraisalDraft = {
    draftId,
    createdAt: now,
    updatedAt: now,
    status: 'in_progress',
    propertyInput,
    aiAnalysis: null,
    comparables: null,
    marketIntelligence: null,
    reportTemplateId: null,
  }
  drafts.set(draftId, draft)
  return draft
}

export function getDraft(draftId: string): AppraisalDraft {
  return getOrThrow(draftId)
}

/** Step 2: attaches the (mock) AI analysis results to the draft. */
export function saveAiAnalysis(draftId: string): AppraisalDraft {
  const draft = getOrThrow(draftId)
  draft.aiAnalysis = { metrics: getAiAnalysisMetrics(), summary: getAiAnalysisSummaryNotification() }
  return touch(draft)
}

/** Step 3: attaches the (mock) comparable sales to the draft. */
export function saveComparables(draftId: string): AppraisalDraft {
  const draft = getOrThrow(draftId)
  draft.comparables = getComparableSales()
  return touch(draft)
}

/** Step 4: attaches the (mock) market intelligence data to the draft. */
export function saveMarketIntelligence(draftId: string): AppraisalDraft {
  const draft = getOrThrow(draftId)
  draft.marketIntelligence = { suburbOverview: getSuburbOverview(), demandSignals: getDemandSignals() }
  return touch(draft)
}

/** Step 5: records the chosen report template and marks the draft complete. */
export function finalizeDraft(draftId: string, reportTemplateId: string): AppraisalDraft {
  const draft = getOrThrow(draftId)
  draft.reportTemplateId = reportTemplateId
  draft.status = 'completed'
  return touch(draft)
}
