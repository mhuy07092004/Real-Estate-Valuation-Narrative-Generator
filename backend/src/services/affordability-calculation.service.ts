// Pure lending-serviceability math for the buyer affordability calculator —
// no database access, stateless in, stateless out. There is no interest
// rate or loan term input anywhere in this calculator (unlike the investor
// ROI calculator), so a fixed assumed rate/term is used for the loan-amount
// conversion — disclosed via the existing "estimates only, confirm with
// your lender" disclaimer, not presented as buyer-specific fact.
const ASSUMED_INTEREST_RATE_PCT = 6.5
const ASSUMED_LOAN_TERM_YEARS = 30

export type AffordabilityCalculationInput = {
    yourAnnualIncome: number
    partnerAnnualIncome: number
    availableDeposit: number
    existingMonthlyDebt: number
    monthlyLivingExpenses: number
    councilRates: number
    landlordInsurance: number
}

export type AffordabilitySummaryValueTone = 'orange' | 'green' | 'red' | 'navy'
export type AffordabilityBand = 'Comfortable' | 'Moderate' | 'Stretched' | 'N/A'

export type AffordabilityCalculationResult = {
    summary: { label: string; value: string; valueTone?: AffordabilitySummaryValueTone }[]
    metrics: {
        label: string
        value: string
        trend?: string
        tone: 'blue' | 'teal' | 'orange' | 'sky'
        valueClassName?: string
    }[]
    // Raw figures for persistence onto Report (role: buyer only).
    estimatedBorrowingCapacity: number
    maxLoanAmount: number
    repaymentToIncomePct: number
}

function formatCurrency(value: number): string {
    return `$${Math.round(value).toLocaleString('en-AU')}`
}

// Inverts the standard amortized-repayment formula to solve for principal
// given a fixed monthly repayment budget (mirrors roi-calculation.service's
// monthlyLoanRepayment, solved the other way around).
function maxLoanFromMonthlyRepayment(
    monthlyRepayment: number,
    annualInterestRate: number,
    loanTermYears: number,
): number {
    const monthlyRate = annualInterestRate / 100 / 12
    const numPayments = loanTermYears * 12

    if (monthlyRepayment <= 0 || numPayments <= 0) return 0
    if (monthlyRate === 0) return monthlyRepayment * numPayments

    return (monthlyRepayment * (1 - Math.pow(1 + monthlyRate, -numPayments))) / monthlyRate
}

// Bands on how close the buyer's actual leftover income gets to the 30%
// lending ceiling — NOT on the displayed (already-capped) repayment ratio,
// since that number is always <=30 by construction and would make every
// case look "Comfortable". A buyer whose expenses already consume most of
// their income has little room to reach the ceiling even though the
// capped ratio still shows <=30%.
function bandForServiceability(grossMonthlyIncome: number, availableMonthlyRepayment: number): AffordabilityBand {
    if (grossMonthlyIncome <= 0) return 'N/A'
    const idealCeiling = grossMonthlyIncome * 0.3
    if (availableMonthlyRepayment >= idealCeiling) return 'Comfortable'
    if (availableMonthlyRepayment >= idealCeiling * 0.5) return 'Moderate'
    return 'Stretched'
}

function toneForBand(band: AffordabilityBand): AffordabilitySummaryValueTone {
    if (band === 'Comfortable') return 'green'
    if (band === 'Moderate') return 'orange'
    if (band === 'Stretched') return 'red'
    return 'navy'
}

export function calculateAffordability(input: AffordabilityCalculationInput): AffordabilityCalculationResult {
    const grossMonthlyIncome = (input.yourAnnualIncome + input.partnerAnnualIncome) / 12
    const monthlyObligations =
        input.existingMonthlyDebt +
        input.monthlyLivingExpenses +
        (input.councilRates + input.landlordInsurance) / 12

    const availableMonthlyRepayment = Math.max(0, grossMonthlyIncome - monthlyObligations)
    // Real lenders cap the serviceable repayment at a fixed ceiling
    // (commonly ~30% of gross income) regardless of how much is technically
    // left over after expenses — so the assessed repayment never exceeds
    // that, even for a buyer with very low outgoings.
    const idealCeiling = grossMonthlyIncome * 0.3
    const assessedMonthlyRepayment = Math.min(availableMonthlyRepayment, idealCeiling)

    const maxLoanAmount = maxLoanFromMonthlyRepayment(
        assessedMonthlyRepayment,
        ASSUMED_INTEREST_RATE_PCT,
        ASSUMED_LOAN_TERM_YEARS,
    )
    const estimatedBorrowingCapacity = maxLoanAmount + input.availableDeposit
    const repaymentToIncomePct =
        grossMonthlyIncome > 0 ? (assessedMonthlyRepayment / grossMonthlyIncome) * 100 : 0

    const band = bandForServiceability(grossMonthlyIncome, availableMonthlyRepayment)
    const tone = toneForBand(band)

    return {
        summary: [
            {
                label: 'Repayment-to-income',
                value: grossMonthlyIncome > 0 ? `${repaymentToIncomePct.toFixed(0)}%` : 'N/A',
                valueTone: tone,
            },
            { label: 'Ideal Range', value: 'below 30%' },
            { label: 'AFFORDABILITY', value: band, valueTone: tone },
        ],
        metrics: [
            {
                label: 'Estimated Borrowing Capacity',
                value: formatCurrency(estimatedBorrowingCapacity),
                tone: 'blue',
                valueClassName: 'text-[22px] sm:text-[28px] text-emerald-600',
            },
            {
                label: 'Max Loan Amount',
                value: formatCurrency(maxLoanAmount),
                tone: 'blue',
                valueClassName: 'text-[22px] sm:text-[28px] text-amber-500',
            },
            {
                label: 'Monthly Repayment',
                value: formatCurrency(assessedMonthlyRepayment),
                tone: 'teal',
            },
        ],
        estimatedBorrowingCapacity,
        maxLoanAmount,
        repaymentToIncomePct,
    }
}
