export type AffordabilitySummaryTone = 'green' | 'red' | 'navy' | 'net'

export type AffordabilitySummaryRow = {
  label: string
  amount: number
  tone: AffordabilitySummaryTone
}

export type AffordabilityStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type AffordabilityReturnTone = 'green' | 'red' | 'navy'

export type AffordabilityReturnRow = {
  label: string
  display: string
  tone: AffordabilityReturnTone
}

export type AffordabilityCalculationMock = {
  annualSummary: AffordabilitySummaryRow[]
  metrics: AffordabilityStatMetric[]
  investmentReturns: AffordabilityReturnRow[]
}

const AFFORDABILITY_CALCULATION_DATA: AffordabilityCalculationMock = {
  annualSummary: [
    { label: 'Annual Rental Income', amount: 42000, tone: 'green' },
    { label: 'Annual Mortgage Repayments', amount: -28000, tone: 'navy' },
    { label: 'Annual Operating Expenses', amount: -8500, tone: 'navy' },
    { label: 'Management Fees', amount: -3200, tone: 'navy' },
    { label: 'Net Annual Cash-Flow', amount: 2300, tone: 'net' },
  ],
  metrics: [
    {
      label: 'Loan Amount',
      value: '$550,000',
      trend: 'monthly payment: $3,200',
      tone: 'blue',
    },
    {
      label: 'Break-even Rent',
      value: '$820',
      trend: 'current: $750/wk',
      tone: 'teal',
    },
  ],
  investmentReturns: [
    { label: 'Gross Yield', display: '5.2%', tone: 'green' },
    { label: 'Net Yield', display: '3.1%', tone: 'navy' },
    { label: 'Monthly Cash-Flow', display: '$192/mth', tone: 'green' },
    { label: 'Cash-on-Cash Returns', display: '1.8%', tone: 'navy' },
  ],
}

export function getAffordabilityCalculationMockData(): AffordabilityCalculationMock {
  return AFFORDABILITY_CALCULATION_DATA
}
