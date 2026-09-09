// Pure investment-property mortgage math for the investor ROI calculator —
// no database access, stateless in, stateless out. Standard formulas:
// amortized loan repayments, gross/net rental yield, cash flow, cash-on-cash
// return. All percentage inputs are whole numbers (e.g. 6.5 for 6.5%).
export type RoiCalculationInput = {
    purchasePrice: number
    deposit: number
    interestRate: number
    loanTermYears: number
    weeklyRent: number
    vacancyAllowance: number
    managementFee: number
    councilRates: number
    landlordInsurance: number
    maintenance: number
    landTax: number
}

export type RoiSummaryTone = 'green' | 'red' | 'navy' | 'net'
export type RoiReturnTone = 'green' | 'red' | 'navy'

export type RoiCalculationResult = {
    annualSummary: { label: string; amount: number; tone: RoiSummaryTone }[]
    metrics: { label: string; value: string; trend: string; tone: 'blue' | 'teal' | 'orange' | 'sky' }[]
    investmentReturns: { label: string; display: string; tone: RoiReturnTone }[]
    // Raw figures for persistence onto Report (role: investor only) — the
    // above three arrays are display-shaped, these are the plain numbers.
    grossYieldPct: number
    netYieldPct: number
    monthlyCashFlow: number
    cashOnCashReturnPct: number | null
}

function formatCurrency(value: number): string {
    return `$${Math.round(value).toLocaleString('en-AU')}`
}

function monthlyLoanRepayment(loanAmount: number, annualInterestRate: number, loanTermYears: number): number {
    const monthlyRate = annualInterestRate / 100 / 12
    const numPayments = loanTermYears * 12

    if (numPayments <= 0) return 0
    if (monthlyRate === 0) return loanAmount / numPayments

    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments))
}

export function calculateRoi(input: RoiCalculationInput): RoiCalculationResult {
    const loanAmount = Math.max(0, input.purchasePrice - input.deposit)
    const monthlyRepayment = monthlyLoanRepayment(loanAmount, input.interestRate, input.loanTermYears)
    const annualMortgageRepayments = monthlyRepayment * 12

    const grossAnnualRent = input.weeklyRent * 52
    const effectiveAnnualRent = grossAnnualRent * (1 - input.vacancyAllowance / 100)
    const managementFees = effectiveAnnualRent * (input.managementFee / 100)
    const annualOperatingExpenses =
        input.councilRates + input.landlordInsurance + input.maintenance + input.landTax

    const netAnnualCashFlow =
        effectiveAnnualRent - managementFees - annualOperatingExpenses - annualMortgageRepayments
    const monthlyCashFlow = netAnnualCashFlow / 12

    const grossYieldPct = input.purchasePrice > 0 ? (grossAnnualRent / input.purchasePrice) * 100 : 0
    const netYieldPct =
        input.purchasePrice > 0
            ? ((effectiveAnnualRent - managementFees - annualOperatingExpenses) / input.purchasePrice) * 100
            : 0
    const cashOnCashReturnPct = input.deposit > 0 ? (netAnnualCashFlow / input.deposit) * 100 : null

    // Break-even weekly rent: the gross weekly rent at which netAnnualCashFlow = 0,
    // solved from the same relations (effectiveAnnualRent scales linearly with
    // weeklyRent, so this can be inverted directly).
    const requiredEffectiveAnnualRent =
        (annualOperatingExpenses + annualMortgageRepayments) / (1 - input.managementFee / 100)
    const requiredGrossAnnualRent = requiredEffectiveAnnualRent / (1 - input.vacancyAllowance / 100)
    const breakEvenWeeklyRent = requiredGrossAnnualRent / 52

    return {
        annualSummary: [
            { label: 'Annual Rental Income', amount: effectiveAnnualRent, tone: 'green' },
            { label: 'Annual Mortgage Repayments', amount: -annualMortgageRepayments, tone: 'navy' },
            { label: 'Annual Operating Expenses', amount: -annualOperatingExpenses, tone: 'navy' },
            { label: 'Management Fees', amount: -managementFees, tone: 'navy' },
            { label: 'Net Annual Cash-Flow', amount: netAnnualCashFlow, tone: 'net' },
        ],
        metrics: [
            {
                label: 'Loan Amount',
                value: formatCurrency(loanAmount),
                trend: `monthly payment: ${formatCurrency(monthlyRepayment)}`,
                tone: 'blue',
            },
            {
                label: 'Break-even Rent',
                value: Number.isFinite(breakEvenWeeklyRent) ? formatCurrency(breakEvenWeeklyRent) : 'N/A',
                trend: `current: ${formatCurrency(input.weeklyRent)}/wk`,
                tone: 'teal',
            },
        ],
        investmentReturns: [
            { label: 'Gross Yield', display: `${grossYieldPct.toFixed(1)}%`, tone: 'green' },
            { label: 'Net Yield', display: `${netYieldPct.toFixed(1)}%`, tone: 'navy' },
            {
                label: 'Monthly Cash-Flow',
                display: `${formatCurrency(monthlyCashFlow)}/mth`,
                tone: monthlyCashFlow >= 0 ? 'green' : 'red',
            },
            {
                label: 'Cash-on-Cash Returns',
                display: cashOnCashReturnPct === null ? 'N/A' : `${cashOnCashReturnPct.toFixed(1)}%`,
                tone:
                    cashOnCashReturnPct === null ? 'navy' : cashOnCashReturnPct >= 0 ? 'green' : 'red',
            },
        ],
        grossYieldPct,
        netYieldPct,
        monthlyCashFlow,
        cashOnCashReturnPct,
    }
}
