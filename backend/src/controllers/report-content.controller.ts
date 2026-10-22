// Author: The Long Tran
// HTTP handlers for the wizard's report-content endpoints (templates,
// executive summary, narrative preview, agent recommendations,
// disclaimer). Returns raw JSON directly, no envelope, matching the
// other /api/appraisal-family endpoints' contract.
import type { Request, Response } from 'express'
import {
    buildAffordabilityOutlook,
    buildExecutiveSummary,
    buildGrowthOutlook,
    buildNarrativePreview,
    getAgentRecommendations,
    getAppraisalDisclaimer,
    getReportTemplateForRole,
    type NarrativeExtras,
    type ReportRole,
} from '../services/report-content.service.js'
import { parseAuAddress } from '../utils/au-address.js'

const VALID_ROLES: ReportRole[] = ['agent', 'valuer', 'buyer', 'investor']

function isReportRole(value: unknown): value is ReportRole {
    return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
}

function parseAddress(address: string): { street: string; suburb: string; state: string; postcode: string } | null {
    const parsed = parseAuAddress(address)
    if (!parsed) return null
    return {
        street: parsed.streetLine,
        suburb: parsed.suburb,
        state: parsed.state,
        postcode: parsed.postcode,
    }
}

export function getReportTemplate(req: Request, res: Response) {
    const role = req.query.role
    if (!isReportRole(role)) {
        res.status(400).json({ message: 'A valid role query param is required.' })
        return
    }

    res.json(getReportTemplateForRole(role))
}

function readSubjectQuery(req: Request) {
    const address = String(req.query.address ?? '')
    const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined
    const bedrooms = req.query.bedrooms ? Number(req.query.bedrooms) : undefined
    const bathrooms = req.query.bathrooms ? Number(req.query.bathrooms) : undefined
    const parking = req.query.parking ? Number(req.query.parking) : undefined
    const landSizeSqm = req.query.landSizeSqm ? Number(req.query.landSizeSqm) : undefined
    return { address, propertyType, bedrooms, bathrooms, parking, landSizeSqm }
}

function allDefined<T extends Record<string, number | undefined>>(fields: T): { [K in keyof T]: number } | null {
    return Object.values(fields).every((value) => value !== undefined) ? (fields as { [K in keyof T]: number }) : null
}

// The buyer's / investor's Step 3 calculator inputs and results, sent along
// so the narrative model gets the same prompt shape it was trained on.
// Either group is dropped unless every field it needs is present.
function readNarrativeExtras(req: Request): NarrativeExtras {
    const q = req.query
    const roiFields = {
        purchasePrice: parseOptionalNumber(q.roiPurchasePrice),
        deposit: parseOptionalNumber(q.roiDeposit),
        interestRate: parseOptionalNumber(q.roiInterestRate),
        weeklyRent: parseOptionalNumber(q.roiWeeklyRent),
        grossYieldPct: parseOptionalNumber(q.roiGrossYieldPct),
        netYieldPct: parseOptionalNumber(q.roiNetYieldPct),
        monthlyCashFlow: parseOptionalNumber(q.roiMonthlyCashFlow),
    }
    const affordabilityFields = {
        yourAnnualIncome: parseOptionalNumber(q.affordabilityAnnualIncome),
        availableDeposit: parseOptionalNumber(q.affordabilityDeposit),
        estimatedBorrowingCapacity: parseOptionalNumber(q.affordabilityEstimatedBorrowingCapacity),
        maxLoanAmount: parseOptionalNumber(q.affordabilityMaxLoanAmount),
        repaymentToIncomePct: parseOptionalNumber(q.affordabilityRepaymentToIncomePct),
    }
    const roi = allDefined(roiFields)
    const affordability = allDefined(affordabilityFields)

    return {
        roi: roi
            ? {
                  inputs: {
                      purchasePrice: roi.purchasePrice,
                      deposit: roi.deposit,
                      interestRate: roi.interestRate,
                      weeklyRent: roi.weeklyRent,
                  },
                  grossYieldPct: roi.grossYieldPct,
                  netYieldPct: roi.netYieldPct,
                  monthlyCashFlow: roi.monthlyCashFlow,
                  cashOnCashReturnPct: parseOptionalNumber(q.roiCashOnCashReturnPct) ?? null,
              }
            : null,
        affordability: affordability
            ? {
                  inputs: {
                      yourAnnualIncome: affordability.yourAnnualIncome,
                      partnerAnnualIncome: parseOptionalNumber(q.affordabilityPartnerIncome),
                      availableDeposit: affordability.availableDeposit,
                  },
                  estimatedBorrowingCapacity: affordability.estimatedBorrowingCapacity,
                  maxLoanAmount: affordability.maxLoanAmount,
                  repaymentToIncomePct: affordability.repaymentToIncomePct,
              }
            : null,
    }
}

export async function getExecutiveSummary(req: Request, res: Response) {
    const { address, propertyType, bedrooms, bathrooms, parking, landSizeSqm } = readSubjectQuery(req)
    const role = req.query.role
    const parsed = parseAddress(address)

    if (!parsed) {
        res.json({
            title: '1. EXECUTIVE SUMMARY',
            paragraphs: [[{ text: 'Property address could not be determined.' }]],
            observationTitle: 'Key Observation',
            observationMessage: 'No comparable evidence is currently available.',
        })
        return
    }

    const summary = await buildExecutiveSummary(
        { ...parsed, propertyType, bedrooms, bathrooms, parking, landSizeSqm },
        isReportRole(role) ? role : 'agent',
        readNarrativeExtras(req),
    )
    res.json(summary)
}

export async function getNarrativePreview(req: Request, res: Response) {
    const { address, propertyType, bedrooms, bathrooms, parking, landSizeSqm } = readSubjectQuery(req)
    const reportType = typeof req.query.reportType === 'string' ? req.query.reportType : undefined
    const parsed = parseAddress(address)

    const templateTitle =
        VALID_ROLES.map(getReportTemplateForRole).find((template) => template.id === reportType)?.title ??
        'Sample Narrative Preview'

    if (!parsed) {
        res.json({
            title: templateTitle,
            sections: [{ heading: 'Executive Summary:', body: 'Property address could not be determined.' }],
            disclaimer: 'Full report will include comprehensive analysis once a valid address is provided.',
        })
        return
    }

    const preview = await buildNarrativePreview(
        { ...parsed, propertyType, bedrooms, bathrooms, parking, landSizeSqm },
        templateTitle,
    )
    res.json(preview)
}

export function getAgentRecommendationsContent(_req: Request, res: Response) {
    res.json(getAgentRecommendations())
}

function parseOptionalNumber(value: unknown): number | undefined {
    if (typeof value !== 'string' || value.trim() === '') return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

export function getGrowthOutlookContent(req: Request, res: Response) {
    const grossYieldPct = parseOptionalNumber(req.query.roiGrossYieldPct)
    const netYieldPct = parseOptionalNumber(req.query.roiNetYieldPct)
    const monthlyCashFlow = parseOptionalNumber(req.query.roiMonthlyCashFlow)
    const cashOnCashReturnRaw = req.query.roiCashOnCashReturnPct

    if (grossYieldPct === undefined || netYieldPct === undefined || monthlyCashFlow === undefined) {
        res.json(buildGrowthOutlook(null))
        return
    }

    res.json(
        buildGrowthOutlook({
            grossYieldPct,
            netYieldPct,
            monthlyCashFlow,
            cashOnCashReturnPct: parseOptionalNumber(cashOnCashReturnRaw) ?? null,
        }),
    )
}

export function getAffordabilityOutlookContent(req: Request, res: Response) {
    const estimatedBorrowingCapacity = parseOptionalNumber(req.query.affordabilityEstimatedBorrowingCapacity)
    const maxLoanAmount = parseOptionalNumber(req.query.affordabilityMaxLoanAmount)
    const repaymentToIncomePct = parseOptionalNumber(req.query.affordabilityRepaymentToIncomePct)

    if (estimatedBorrowingCapacity === undefined || maxLoanAmount === undefined || repaymentToIncomePct === undefined) {
        res.json(buildAffordabilityOutlook(null))
        return
    }

    res.json(buildAffordabilityOutlook({ estimatedBorrowingCapacity, maxLoanAmount, repaymentToIncomePct }))
}

export function getAppraisalDisclaimerContent(_req: Request, res: Response) {
    res.json(getAppraisalDisclaimer())
}
