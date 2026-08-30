import { DEFAULT_AFFORDABILITY_INPUTS, type AffordabilityInputs } from './use-affordability-calculator'

// Same lightweight module-var + localStorage pattern as roi-scenario-store.ts /
// AppraisalInputContext — lets the wizard's Affordability step and the final report step
// share the inputs without prop-drilling through the whole wizard shell.

const AFFORDABILITY_STORAGE_KEY = 'relaive_affordability_inputs'

let affordabilityInputs: AffordabilityInputs | null = null

function readStored(): AffordabilityInputs | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AFFORDABILITY_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AffordabilityInputs
  } catch {
    return null
  }
}

export function getAffordabilityInputs(): AffordabilityInputs {
  if (affordabilityInputs) return affordabilityInputs
  affordabilityInputs = readStored() ?? DEFAULT_AFFORDABILITY_INPUTS
  return affordabilityInputs
}

export function setAffordabilityInputs(inputs: AffordabilityInputs): void {
  affordabilityInputs = inputs
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AFFORDABILITY_STORAGE_KEY, JSON.stringify(inputs))
}
