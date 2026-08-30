import { DEFAULT_ROI_SCENARIO, type RoiScenario } from './use-roi-calculator'

// Same lightweight module-var + localStorage pattern as v1's AppraisalInputContext
// (services/common.ts) — lets the wizard's ROI Analysis step and the final report step
// share the scenario without prop-drilling through the whole wizard shell.

const ROI_SCENARIO_STORAGE_KEY = 'relaive_roi_scenario'

let roiScenario: RoiScenario | null = null

function readStored(): RoiScenario | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ROI_SCENARIO_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RoiScenario
  } catch {
    return null
  }
}

export function getRoiScenario(): RoiScenario {
  if (roiScenario) return roiScenario
  roiScenario = readStored() ?? DEFAULT_ROI_SCENARIO
  return roiScenario
}

export function setRoiScenario(scenario: RoiScenario): void {
  roiScenario = scenario
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROI_SCENARIO_STORAGE_KEY, JSON.stringify(scenario))
}
