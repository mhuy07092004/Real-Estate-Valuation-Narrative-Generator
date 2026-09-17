import { describe, it, expect } from 'vitest'
import {
  getReportTemplateForRole,
  buildGrowthOutlook,
  buildAffordabilityOutlook,
  getAgentRecommendations,
  getAppraisalDisclaimer,
  type ReportRole,
  type GrowthOutlookRoiInput,
  type AffordabilityOutlookInput,
} from '../src/services/report-content.service.js'

// ---------------------------------------------------------------------------
// getReportTemplateForRole
// ---------------------------------------------------------------------------
describe('getReportTemplateForRole', () => {
  const roles: ReportRole[] = ['agent', 'valuer', 'buyer', 'investor']

  it.each(roles)('returns a template with id, title, description, iconKey, includes for role "%s"', (role) => {
    const template = getReportTemplateForRole(role)
    expect(template.id).toBeTruthy()
    expect(template.title).toBeTruthy()
    expect(template.description).toBeTruthy()
    expect(template.iconKey).toBeTruthy()
    expect(Array.isArray(template.includes)).toBe(true)
    expect(template.includes.length).toBeGreaterThan(0)
  })

  it('agent role returns vendor-appraisal template', () => {
    expect(getReportTemplateForRole('agent').id).toBe('vendor-appraisal')
    expect(getReportTemplateForRole('agent').iconKey).toBe('vendor')
  })

  it('valuer role returns bank-valuation template', () => {
    expect(getReportTemplateForRole('valuer').id).toBe('bank-valuation')
    expect(getReportTemplateForRole('valuer').iconKey).toBe('bank')
  })

  it('buyer role returns buyer-report template', () => {
    expect(getReportTemplateForRole('buyer').id).toBe('buyer-report')
    expect(getReportTemplateForRole('buyer').iconKey).toBe('buyer')
  })

  it('investor role returns investment-report template', () => {
    expect(getReportTemplateForRole('investor').id).toBe('investment-report')
    expect(getReportTemplateForRole('investor').iconKey).toBe('investment')
  })

  it('all four templates have distinct ids', () => {
    const ids = roles.map((r) => getReportTemplateForRole(r).id)
    expect(new Set(ids).size).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// buildGrowthOutlook — investor-only section
// ---------------------------------------------------------------------------
describe('buildGrowthOutlook', () => {
  const roiInput: GrowthOutlookRoiInput = {
    grossYieldPct: 5.2,
    netYieldPct: 3.8,
    monthlyCashFlow: 450,
    cashOnCashReturnPct: 6.1,
  }

  it('returns "5. GROWTH OUTLOOK" title', () => {
    expect(buildGrowthOutlook(roiInput).title).toBe('5. GROWTH OUTLOOK')
    expect(buildGrowthOutlook(null).title).toBe('5. GROWTH OUTLOOK')
  })

  it('when roi is null, asks user to run ROI step', () => {
    const result = buildGrowthOutlook(null)
    expect(result.paragraphs[0][0].text).toContain('ROI Analysis step')
  })

  it('when roi provided, gross yield appears in paragraph text', () => {
    const result = buildGrowthOutlook(roiInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('5.2%')
  })

  it('when roi provided, net yield appears in paragraph text', () => {
    const result = buildGrowthOutlook(roiInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('3.8%')
  })

  it('positive monthlyCashFlow shows "positive monthly cash flow" wording', () => {
    const result = buildGrowthOutlook(roiInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('positive monthly cash flow')
  })

  it('negative monthlyCashFlow shows "monthly shortfall" wording', () => {
    const result = buildGrowthOutlook({ ...roiInput, monthlyCashFlow: -300 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('monthly shortfall')
  })

  it('null cashOnCashReturnPct shows "could not be calculated" wording', () => {
    const result = buildGrowthOutlook({ ...roiInput, cashOnCashReturnPct: null })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('could not be calculated')
  })

  it('non-null cashOnCashReturnPct shows the percentage value', () => {
    const result = buildGrowthOutlook(roiInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('6.1%')
  })

  it('monthlyCashFlow uses absolute value in shortfall wording (no negative sign displayed)', () => {
    const result = buildGrowthOutlook({ ...roiInput, monthlyCashFlow: -1_234 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    // Should show $1,234 not -$1,234
    expect(fullText).toContain('$1,234')
    expect(fullText).not.toContain('-$1,234')
  })
})

// ---------------------------------------------------------------------------
// buildAffordabilityOutlook — buyer-only section
// ---------------------------------------------------------------------------
describe('buildAffordabilityOutlook', () => {
  const affordInput: AffordabilityOutlookInput = {
    estimatedBorrowingCapacity: 850_000,
    maxLoanAmount: 750_000,
    repaymentToIncomePct: 25,
  }

  it('returns "5. AFFORDABILITY ASSESSMENT" title', () => {
    expect(buildAffordabilityOutlook(affordInput).title).toBe('5. AFFORDABILITY ASSESSMENT')
    expect(buildAffordabilityOutlook(null).title).toBe('5. AFFORDABILITY ASSESSMENT')
  })

  it('when null, asks user to run Affordability Calculator step', () => {
    const result = buildAffordabilityOutlook(null)
    expect(result.paragraphs[0][0].text).toContain('Affordability Calculator step')
  })

  it('borrowing capacity appears in paragraph text', () => {
    const result = buildAffordabilityOutlook(affordInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('$850,000')
  })

  it('max loan amount appears in paragraph text', () => {
    const result = buildAffordabilityOutlook(affordInput)
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('$750,000')
  })

  it('repaymentToIncomePct <= 30 => "comfortably within typical lending guidelines"', () => {
    const result = buildAffordabilityOutlook(affordInput) // 25%
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('comfortably within typical lending guidelines')
  })

  it('repaymentToIncomePct in (30, 45] => "within a moderate range"', () => {
    const result = buildAffordabilityOutlook({ ...affordInput, repaymentToIncomePct: 38 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('within a moderate range')
  })

  it('repaymentToIncomePct > 45 => "stretched relative to typical lending guidelines"', () => {
    const result = buildAffordabilityOutlook({ ...affordInput, repaymentToIncomePct: 55 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('stretched relative to typical lending guidelines')
  })

  it('boundary: exactly 30% is "comfortably within"', () => {
    const result = buildAffordabilityOutlook({ ...affordInput, repaymentToIncomePct: 30 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('comfortably within')
  })

  it('boundary: exactly 45% is "within a moderate range"', () => {
    const result = buildAffordabilityOutlook({ ...affordInput, repaymentToIncomePct: 45 })
    const fullText = result.paragraphs.flat().map((s) => s.text).join(' ')
    expect(fullText).toContain('within a moderate range')
  })
})

// ---------------------------------------------------------------------------
// getAgentRecommendations
// ---------------------------------------------------------------------------
describe('getAgentRecommendations', () => {
  it('returns title "2. AGENT RECOMMENDATIONS"', () => {
    expect(getAgentRecommendations().title).toBe('2. AGENT RECOMMENDATIONS')
  })

  it('returns exactly 3 recommendation items', () => {
    expect(getAgentRecommendations().items).toHaveLength(3)
  })

  it('each item has id, title, description, and iconKey', () => {
    for (const item of getAgentRecommendations().items) {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.iconKey).toBeTruthy()
    }
  })

  it('item ids are campaign, presentation, marketing', () => {
    const ids = getAgentRecommendations().items.map((i) => i.id)
    expect(ids).toContain('campaign')
    expect(ids).toContain('presentation')
    expect(ids).toContain('marketing')
  })
})

// ---------------------------------------------------------------------------
// getAppraisalDisclaimer
// ---------------------------------------------------------------------------
describe('getAppraisalDisclaimer', () => {
  it('has title, message, and footer', () => {
    const disclaimer = getAppraisalDisclaimer()
    expect(disclaimer.title).toBeTruthy()
    expect(disclaimer.message).toBeTruthy()
    expect(disclaimer.footer).toBeTruthy()
  })

  it('message mentions "90 days" validity period', () => {
    expect(getAppraisalDisclaimer().message).toContain('90 days')
  })

  it('footer mentions relaive.com.au', () => {
    expect(getAppraisalDisclaimer().footer).toContain('relaive.com.au')
  })

  it('message mentions it is not a formal valuation', () => {
    expect(getAppraisalDisclaimer().message.toLowerCase()).toContain('guidance tool only')
  })
})
