// HTTP handlers reshaping Report rows into each role's existing list-page
// shape. Read-only — reuses report.service's listReportsByOwnerAndRole,
// no new data-access needed. Every handler filters to its own role's
// reports only (role is a real column on Report — see schema comment) so
// an agent's list never leaks a report saved under a different role.
// agent/buyer/investor share one shape (confirmed field-for-field
// identical); valuer's cases have their own shape. Returns raw JSON
// directly, no envelope, matching each frontend type's direct
// fetchJson<T> usage.
import type { Request, Response } from 'express'
import { listReportsByOwnerAndRole } from '../services/report.service.js'

function toRoleReportItem(row: Awaited<ReturnType<typeof listReportsByOwnerAndRole>>[number]) {
    return {
        id: row.reportId,
        address: row.propertyAddressLine,
        suburb: row.propertySuburb,
        clientName: row.clientName,
        status: row.shareToken ? 'shared' : 'generated',
        estimatedValue: row.estimatedValue,
        beds: row.bedrooms,
        baths: row.bathrooms,
        areaSqm: row.landSizeSqm,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }
}

function makeRoleReportsHandler(role: string) {
    return async (_req: Request, res: Response) => {
        const ownerUserId = String(res.locals.userId)
        const rows = await listReportsByOwnerAndRole(ownerUserId, role)
        res.json(rows.map(toRoleReportItem))
    }
}

export const listAgentReports = makeRoleReportsHandler('agent')
export const listBuyerReports = makeRoleReportsHandler('buyer')
export const listInvestorReports = makeRoleReportsHandler('investor')

export async function getInvestorReportSummary(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listReportsByOwnerAndRole(ownerUserId, 'investor')
    const items = rows.map(toRoleReportItem)

    res.json({
        totalReports: items.length,
        draftCount: items.filter((item) => item.status === 'generated').length,
        sharedCount: items.filter((item) => item.status === 'shared').length,
    })
}

function toCaseItem(row: Awaited<ReturnType<typeof listReportsByOwnerAndRole>>[number]) {
    return {
        id: row.reportId,
        address: row.propertyAddressLine,
        suburb: row.propertySuburb,
        clientName: row.clientName,
        status: row.caseStatus ?? 'draft',
        confidence: row.confidence,
        estimatedValue: row.estimatedValue,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }
}

export async function listValuerCases(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listReportsByOwnerAndRole(ownerUserId, 'valuer')
    res.json(rows.map(toCaseItem))
}

export async function getValuerCaseSummary(_req: Request, res: Response) {
    const ownerUserId = String(res.locals.userId)
    const rows = await listReportsByOwnerAndRole(ownerUserId, 'valuer')
    const cases = rows.map(toCaseItem)

    res.json({
        totalCases: cases.length,
        returnedForRevision: cases.filter((item) => item.status === 'returned_for_revision').length,
    })
}
