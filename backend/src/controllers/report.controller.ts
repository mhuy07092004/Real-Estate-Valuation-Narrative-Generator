import type { Request, Response } from 'express'
import { getReportStatus } from '../services/report.service.js'
import type { ReportStatus, ReportType } from '../types/report.types.js'

const VALID_STATUSES: ReportStatus[] = ['processing', 'ready', 'failed']
const VALID_TYPES: ReportType[] = [
  'vendor-appraisal',
  'bank-valuation',
  'buyer-advisory',
  'investor-report',
  'affordability-check',
]

function parseEnumQueryParam<T extends string>(value: unknown, valid: T[]): T | undefined {
  return typeof value === 'string' && valid.includes(value as T) ? (value as T) : undefined
}

export function getStatus(req: Request, res: Response) {
  const { reportId } = req.params
  const forceStatus = parseEnumQueryParam(req.query.simulateStatus, VALID_STATUSES)
  const forceType = parseEnumQueryParam(req.query.simulateType, VALID_TYPES)

  const result = getReportStatus(reportId, forceStatus, forceType)
  res.json(result)
}
