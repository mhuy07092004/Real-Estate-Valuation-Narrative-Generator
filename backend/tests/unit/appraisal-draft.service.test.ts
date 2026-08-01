import { describe, expect, it } from 'vitest'
import {
  createDraft,
  saveAiAnalysis,
  saveComparables,
  saveMarketIntelligence,
  finalizeDraft,
  getDraft,
  DraftNotFoundError,
} from '../../src/services/appraisal-draft.service.js'

const SAMPLE_INPUT = {
  address: '1 Test St, Testville VIC 3000',
  propertyType: 'House',
  bedrooms: 3,
  bathrooms: 2,
  parking: 1,
  landSizeSqm: 400,
}

describe('appraisal-draft.service', () => {
  it('walks a draft through all 5 steps to completion', () => {
    const created = createDraft(SAMPLE_INPUT)
    expect(created.status).toBe('in_progress')
    expect(created.propertyInput).toEqual(SAMPLE_INPUT)

    saveAiAnalysis(created.draftId)
    saveComparables(created.draftId)
    saveMarketIntelligence(created.draftId)
    const finalized = finalizeDraft(created.draftId, 'vendor-appraisal')

    expect(finalized.status).toBe('completed')
    expect(finalized.aiAnalysis?.metrics.length).toBeGreaterThan(0)
    expect(finalized.comparables?.length).toBeGreaterThan(0)
    expect(finalized.marketIntelligence?.suburbOverview.length).toBeGreaterThan(0)
    expect(finalized.reportTemplateId).toBe('vendor-appraisal')

    expect(getDraft(created.draftId)).toEqual(finalized)
  })

  it('throws for an unknown draftId', () => {
    expect(() => getDraft('does-not-exist')).toThrow(DraftNotFoundError)
  })
})
