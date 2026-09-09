// Per-role report/case list endpoints — all read-only reshapes of Report,
// each filtered to its own role, mounted at each role's exact expected
// path in routes/index.ts.
import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
    getInvestorReportSummary,
    getValuerCaseSummary,
    listAgentReports,
    listBuyerReports,
    listInvestorReports,
    listValuerCases,
} from '../controllers/report-list.controller.js'

export const agentReportsRouter = Router()
agentReportsRouter.get('/', requireAuth, asyncHandler(listAgentReports))

export const buyerReportsRouter = Router()
buyerReportsRouter.get('/', requireAuth, asyncHandler(listBuyerReports))

export const investorReportsRouter = Router()
investorReportsRouter.get('/', requireAuth, asyncHandler(listInvestorReports))
investorReportsRouter.get('/summary', requireAuth, asyncHandler(getInvestorReportSummary))

export const valuerCasesRouter = Router()
valuerCasesRouter.get('/', requireAuth, asyncHandler(listValuerCases))
valuerCasesRouter.get('/summary', requireAuth, asyncHandler(getValuerCaseSummary))
