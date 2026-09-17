import { describe, it, expect } from 'vitest'
import { affordabilityCalculationSchema } from '../src/validators/affordability-calculation.validator.js'
import { roiCalculationSchema } from '../src/validators/roi-calculation.validator.js'
import {
  createReportSchema,
  sendReportEmailSchema,
  reportRoleValues,
} from '../src/validators/report.validator.js'
import {
  loginSchema,
  forgotPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '../src/validators/auth.validator.js'
import {
  createClientSchema,
  updateClientSchema,
  clientStatusValues,
} from '../src/validators/client.validator.js'
import {
  createInspectionSchema,
  updateInspectionSchema,
} from '../src/validators/inspection.validator.js'

// ---------------------------------------------------------------------------
// affordabilityCalculationSchema
// ---------------------------------------------------------------------------
describe('affordabilityCalculationSchema', () => {
  const VALID = {
    yourAnnualIncome: 100_000,
    partnerAnnualIncome: 50_000,
    availableDeposit: 80_000,
    existingMonthlyDebt: 500,
    monthlyLivingExpenses: 2_000,
    councilRates: 2_000,
    landlordInsurance: 1_200,
  }

  it('accepts a fully valid payload', () => {
    expect(affordabilityCalculationSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts zero values for all number fields', () => {
    const zeros = Object.fromEntries(Object.keys(VALID).map((k) => [k, 0]))
    expect(affordabilityCalculationSchema.safeParse(zeros).success).toBe(true)
  })

  it('rejects negative income', () => {
    expect(affordabilityCalculationSchema.safeParse({ ...VALID, yourAnnualIncome: -1 }).success).toBe(false)
  })

  it('rejects missing field', () => {
    const { yourAnnualIncome, ...rest } = VALID
    expect(affordabilityCalculationSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects non-numeric value', () => {
    expect(affordabilityCalculationSchema.safeParse({ ...VALID, councilRates: 'two thousand' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// roiCalculationSchema
// ---------------------------------------------------------------------------
describe('roiCalculationSchema', () => {
  const VALID = {
    purchasePrice: 600_000,
    deposit: 120_000,
    interestRate: 6.5,
    loanTermYears: 30,
    weeklyRent: 600,
    vacancyAllowance: 3,
    managementFee: 8,
    councilRates: 2_000,
    landlordInsurance: 1_500,
    maintenance: 2_500,
    landTax: 1_000,
  }

  it('accepts a fully valid payload', () => {
    expect(roiCalculationSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects vacancyAllowance > 100', () => {
    expect(roiCalculationSchema.safeParse({ ...VALID, vacancyAllowance: 101 }).success).toBe(false)
  })

  it('rejects managementFee > 100', () => {
    expect(roiCalculationSchema.safeParse({ ...VALID, managementFee: 101 }).success).toBe(false)
  })

  it('accepts vacancyAllowance = 0 and managementFee = 0 (boundary)', () => {
    expect(roiCalculationSchema.safeParse({ ...VALID, vacancyAllowance: 0, managementFee: 0 }).success).toBe(true)
  })

  it('accepts vacancyAllowance = 100 and managementFee = 100 (boundary)', () => {
    expect(roiCalculationSchema.safeParse({ ...VALID, vacancyAllowance: 100, managementFee: 100 }).success).toBe(true)
  })

  it('rejects negative purchase price', () => {
    expect(roiCalculationSchema.safeParse({ ...VALID, purchasePrice: -1 }).success).toBe(false)
  })

  it('rejects missing loanTermYears', () => {
    const { loanTermYears, ...rest } = VALID
    expect(roiCalculationSchema.safeParse(rest).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createReportSchema
// ---------------------------------------------------------------------------
describe('createReportSchema', () => {
  const VALID = {
    role: 'agent',
    propertyAddressLine: '1 Test Street',
    propertySuburb: 'Richmond',
    propertyState: 'VIC',
    propertyPostcode: '3121',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    landSizeSqm: 400,
    reportTemplateId: 'vendor-appraisal',
    estimatedValue: 900_000,
    narrativeText: 'A great property.',
  }

  it('accepts a minimal valid payload (no optional fields)', () => {
    expect(createReportSchema.safeParse(VALID).success).toBe(true)
  })

  it.each(reportRoleValues)('accepts role "%s"', (role) => {
    expect(createReportSchema.safeParse({ ...VALID, role }).success).toBe(true)
  })

  it('rejects an invalid role', () => {
    expect(createReportSchema.safeParse({ ...VALID, role: 'superuser' }).success).toBe(false)
  })

  it('rejects missing propertyAddressLine', () => {
    const { propertyAddressLine, ...rest } = VALID
    expect(createReportSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid clientEmail format', () => {
    expect(createReportSchema.safeParse({ ...VALID, clientEmail: 'not-an-email' }).success).toBe(false)
  })

  it('accepts valid optional clientEmail', () => {
    expect(createReportSchema.safeParse({ ...VALID, clientEmail: 'client@example.com' }).success).toBe(true)
  })

  it('rejects negative estimatedValue', () => {
    expect(createReportSchema.safeParse({ ...VALID, estimatedValue: -1 }).success).toBe(false)
  })

  it('rejects non-integer bedrooms', () => {
    expect(createReportSchema.safeParse({ ...VALID, bedrooms: 2.5 }).success).toBe(false)
  })
})

describe('sendReportEmailSchema', () => {
  it('accepts valid payload', () => {
    expect(sendReportEmailSchema.safeParse({ clientName: 'Alice', clientEmail: 'alice@example.com' }).success).toBe(true)
  })

  it('rejects missing clientName', () => {
    expect(sendReportEmailSchema.safeParse({ clientEmail: 'alice@example.com' }).success).toBe(false)
  })

  it('rejects bad email format', () => {
    expect(sendReportEmailSchema.safeParse({ clientName: 'Alice', clientEmail: 'not-email' }).success).toBe(false)
  })

  it('rejects note longer than 2000 chars', () => {
    expect(
      sendReportEmailSchema.safeParse({
        clientName: 'Alice',
        clientEmail: 'alice@example.com',
        note: 'x'.repeat(2001),
      }).success,
    ).toBe(false)
  })

  it('accepts optional note up to 2000 chars', () => {
    expect(
      sendReportEmailSchema.safeParse({
        clientName: 'Alice',
        clientEmail: 'alice@example.com',
        note: 'x'.repeat(2000),
      }).success,
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepts valid email + password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' }).success).toBe(true)
  })

  it('lowercases email via transform', () => {
    const result = loginSchema.safeParse({ email: 'User@Example.COM', password: 'x' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('user@example.com')
  })

  it('rejects invalid email format', () => {
    expect(loginSchema.safeParse({ email: 'notanemail', password: 'secret' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })

  it('accepts optional turnstileToken', () => {
    expect(loginSchema.safeParse({ email: 'u@e.com', password: 'pass', turnstileToken: 'tok123' }).success).toBe(true)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

describe('refreshTokenSchema', () => {
  it('accepts a non-empty refresh token', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: 'sometoken' }).success).toBe(true)
  })

  it('rejects empty string', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false)
  })

  it('rejects missing field', () => {
    expect(refreshTokenSchema.safeParse({}).success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('accepts fullName only', () => {
    expect(updateProfileSchema.safeParse({ fullName: 'Alice Smith' }).success).toBe(true)
  })

  it('rejects empty fullName', () => {
    expect(updateProfileSchema.safeParse({ fullName: '' }).success).toBe(false)
  })

  it('rejects phone longer than 30 chars', () => {
    expect(updateProfileSchema.safeParse({ fullName: 'Alice', phone: '1'.repeat(31) }).success).toBe(false)
  })

  it('rejects company longer than 120 chars', () => {
    expect(updateProfileSchema.safeParse({ fullName: 'Alice', company: 'x'.repeat(121) }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createClientSchema / updateClientSchema
// ---------------------------------------------------------------------------
describe('createClientSchema', () => {
  const VALID = {
    fullName: 'Bob Jones',
    email: 'bob@example.com',
    phone: '0400000000',
    addressLine: '5 Main Rd',
    suburb: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
  }

  it('accepts a valid client', () => {
    expect(createClientSchema.safeParse(VALID).success).toBe(true)
  })

  it('defaults status to "prospecting" when omitted', () => {
    const result = createClientSchema.safeParse(VALID)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('prospecting')
  })

  it.each(clientStatusValues as unknown as string[])('accepts status "%s"', (status) => {
    expect(createClientSchema.safeParse({ ...VALID, status }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(createClientSchema.safeParse({ ...VALID, status: 'unknown' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(createClientSchema.safeParse({ ...VALID, email: 'bad' }).success).toBe(false)
  })

  it('rejects empty fullName', () => {
    expect(createClientSchema.safeParse({ ...VALID, fullName: '' }).success).toBe(false)
  })
})

describe('updateClientSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(updateClientSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update with just email', () => {
    expect(updateClientSchema.safeParse({ email: 'new@example.com' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createInspectionSchema / updateInspectionSchema
// ---------------------------------------------------------------------------
describe('createInspectionSchema', () => {
  const VALID = {
    addressLine: '10 Smith St',
    suburb: 'Collingwood',
    inspectionDate: '2026-10-01',
    agents: ['Alice'],
  }

  it('accepts a valid payload', () => {
    expect(createInspectionSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty agents array', () => {
    expect(createInspectionSchema.safeParse({ ...VALID, agents: [] }).success).toBe(false)
  })

  it('rejects missing addressLine', () => {
    const { addressLine, ...rest } = VALID
    expect(createInspectionSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts multiple agents', () => {
    expect(createInspectionSchema.safeParse({ ...VALID, agents: ['Alice', 'Bob'] }).success).toBe(true)
  })
})

describe('updateInspectionSchema', () => {
  const VALID = {
    address: '10 Smith St',
    suburb: 'Collingwood',
    inspectionDate: '2026-10-01',
    agents: ['Alice'],
    overallNotes: 'Looks good',
    checklist: [],
  }

  it('accepts a valid payload', () => {
    expect(updateInspectionSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects missing overallNotes', () => {
    const { overallNotes, ...rest } = VALID
    expect(updateInspectionSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects checklist item with invalid status', () => {
    const input = {
      ...VALID,
      checklist: [{ id: '1', label: 'Roof', description: '', status: 'broken' }],
    }
    expect(updateInspectionSchema.safeParse(input).success).toBe(false)
  })

  it('accepts checklist item with valid status "major_issue"', () => {
    const input = {
      ...VALID,
      checklist: [{ id: '1', label: 'Roof', description: 'cracked', status: 'major_issue' }],
    }
    expect(updateInspectionSchema.safeParse(input).success).toBe(true)
  })

  it('accepts checklist item with optional estimatedCost', () => {
    const input = {
      ...VALID,
      checklist: [{ id: '1', label: 'Roof', description: '', status: 'concern', estimatedCost: 2500 }],
    }
    expect(updateInspectionSchema.safeParse(input).success).toBe(true)
  })
})
