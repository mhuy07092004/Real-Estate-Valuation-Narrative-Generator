// HTTP handlers for the wizard's small static content endpoints — the
// stepper's step list and the property-type options. No schema needed,
// content doesn't depend on any user/request data (steps only vary by
// role, which just picks a different fixed array). Returns raw JSON
// directly, matching the other /api/appraisal-family endpoints' contract.
import type { Request, Response } from 'express'

const BASE_STEPS = [
    { id: 'property-details', label: 'Property Details' },
    { id: 'comparable-sales', label: 'Comparable Sales' },
    { id: 'market-intelligence', label: 'Market Intelligence' },
]

const TAIL_STEPS = [
    { id: 'report-type', label: 'Report Type' },
    { id: 'generated-report', label: 'Generated Report' },
]

const EXTRA_STEP_BY_ROLE: Record<string, { id: string; label: string }> = {
    investor: { id: 'roi-analysis', label: 'ROI Analysis' },
    buyer: { id: 'affordability', label: 'Affordability' },
}

const PROPERTY_TYPE_OPTIONS = ['House', 'Townhouse', 'Unit', 'Apartment', 'Villa']

export function getAppraisalSteps(req: Request, res: Response) {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined
    const extraStep = role ? EXTRA_STEP_BY_ROLE[role] : undefined
    const steps = extraStep
        ? [...BASE_STEPS, extraStep, ...TAIL_STEPS]
        : [...BASE_STEPS, ...TAIL_STEPS]

    res.json(steps)
}

export function getPropertyTypeOptions(_req: Request, res: Response) {
    res.json(PROPERTY_TYPE_OPTIONS)
}
