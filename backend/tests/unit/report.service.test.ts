import { describe, expect, it } from 'vitest'
import { getReportStatus } from '../../src/services/report.service.js'

describe('report.service', () => {
  it('returns the same result for the same reportId (deterministic mock)', () => {
    const first = getReportStatus('demo-report-123')
    const second = getReportStatus('demo-report-123')
    expect(first).toEqual(second)
  })

  it('returns empty values while status is processing', () => {
    const result = getReportStatus('any-id', 'processing')
    expect(result.status).toBe('processing')
    expect(result.comparableSales).toHaveLength(0)
    expect(result.estimatedValueLow).toBeNull()
  })

  it('returns comparable sales and estimates once ready', () => {
    const result = getReportStatus('any-id', 'ready')
    expect(result.status).toBe('ready')
    expect(result.comparableSales.length).toBeGreaterThanOrEqual(3)
    expect(result.estimatedValueLow).not.toBeNull()
  })

  it('honors a forced report type and uses its matching narrative', () => {
    const result = getReportStatus('any-id', 'ready', 'buyer-advisory')
    expect(result.reportType).toBe('buyer-advisory')
    expect(result.aiNarrativeText).toContain('buyer')
  })
})
