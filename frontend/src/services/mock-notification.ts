export type NotificationMock = {
  message: string
}

const ROI_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These calculations are estimates for indicative purposes only. They do not constitute financial advice. Consult a qualified financial adviser before making investment decisions.',
}

export function getRoiDisclaimerNotification(): NotificationMock {
  return ROI_DISCLAIMER
}

const AFFORDABILITY_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These affordability figures are estimates for indicative purposes only. They do not constitute financial or lending advice. Confirm borrowing capacity with your lender before making purchase decisions.',
}

export function getAffordabilityDisclaimerNotification(): NotificationMock {
  return AFFORDABILITY_DISCLAIMER
}
