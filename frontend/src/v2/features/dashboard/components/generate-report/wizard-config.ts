// Role-parameterized wizard config, ported from figma's STEP_LABELS/AI_STEPS/getStepNumbers
// (GenerateAppraisalPage.tsx). v2's wizard was originally built Agent-only; this is the one
// piece of shared architecture all four roles need — see figma-ui-migration-plan.md §10.1.
//
// Client-side only, deliberately not sourced from the backend's /api/appraisal/steps mock
// endpoint (it always returns a fixed 4-item Agent-shaped list, no role param support) —
// per the "frontend-first on mock/existing data" migration approach for these roles.

export type WizardRole = 'agent' | 'valuer' | 'investor' | 'buyer'

export type WizardStep = { id: string; label: string }

const AGENT_STEPS: WizardStep[] = [
  { id: 'property-input', label: 'Property Details' },
  { id: 'comparables', label: 'Comparable Sales' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'report', label: 'Report' },
]

const VALUER_STEPS: WizardStep[] = [
  { id: 'property-input', label: 'Property Details' },
  { id: 'evidence-centre', label: 'Evidence Centre' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'report', label: 'Report' },
]

const INVESTOR_STEPS: WizardStep[] = [
  { id: 'property-input', label: 'Property Details' },
  { id: 'comparables', label: 'Comparable Sales' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'roi-analysis', label: 'ROI Analysis' },
  { id: 'report', label: 'Report' },
]

const BUYER_STEPS: WizardStep[] = [
  { id: 'property-input', label: 'Property Details' },
  { id: 'comparables', label: 'Comparable Sales' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'affordability', label: 'Affordability' },
  { id: 'report', label: 'Report' },
]

export const WIZARD_STEPS: Record<WizardRole, WizardStep[]> = {
  agent: AGENT_STEPS,
  valuer: VALUER_STEPS,
  investor: INVESTOR_STEPS,
  buyer: BUYER_STEPS,
}

// AI processing checklist text (ProcessingOverlayV2) per role, ported from figma's AI_STEPS.
export const WIZARD_AI_STEPS: Record<WizardRole, string[]> = {
  agent: [
    'Searching comparable sales…',
    'Analysing suburb market data…',
    'Running valuation model…',
    'Generating appraisal narrative…',
    'Finalising report…',
  ],
  valuer: [
    'Searching evidence records…',
    'Analysing market context…',
    'Applying Direct Comparison Method…',
    'Generating valuation narrative…',
    'Finalising report…',
  ],
  investor: [
    'Searching comparable sales…',
    'Analysing suburb market data…',
    'Calculating ROI metrics…',
    'Generating investment analysis…',
    'Finalising report…',
  ],
  buyer: [
    'Searching comparable sales…',
    'Analysing property value drivers…',
    'Assessing fair value position…',
    'Generating buyer advisory…',
    'Finalising report…',
  ],
}

export const WIZARD_PROCESSING_TITLE: Record<WizardRole, string> = {
  agent: 'Generating Appraisal Report',
  valuer: 'Generating Valuation Report',
  investor: 'Generating Investment Analysis',
  buyer: 'Generating Buyer Advisory',
}

export function isValidWizardRole(value: string | undefined): value is WizardRole {
  return value === 'agent' || value === 'valuer' || value === 'investor' || value === 'buyer'
}

export function resolveWizardRole(value: string | undefined): WizardRole {
  return isValidWizardRole(value) ? value : 'agent'
}
