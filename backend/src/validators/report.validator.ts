import { z } from 'zod'

const numberField = z.coerce.number().int().nonnegative()
const decimalField = z.coerce.number().nonnegative()
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()

export const createReportSchema = z.object({
  clientId: z.string().uuid().optional(),
  propertyAddressLine: z.string().trim().min(1),
  propertySuburb: z.string().trim().min(1),
  propertyState: z.string().trim().min(1),
  propertyPostcode: z.string().trim().min(1),
  propertyType: z.string().trim().min(1),
  bedrooms: numberField,
  bathrooms: numberField,
  parking: numberField,
  landSizeSqm: decimalField,
  estimatedValue: decimalField,
  selectedComparableId: z.string().uuid().optional(),
  selectedComparableAddress: z.string().trim().optional(),
  selectedComparableSoldPrice: decimalField.optional(),
  selectedComparableSoldDate: dateField,
  marketSuburb: z.string().trim().optional(),
  marketMeanHousePrice: decimalField.optional(),
  marketMonthGrowthPct: decimalField.optional(),
  marketRentalYieldPct: decimalField.optional(),
  marketBuyerInterestLevel: z.string().trim().optional(),
  marketSupplyLevel: z.string().trim().optional(),
  marketPriceGrowthLevel: z.string().trim().optional(),
  narrativeText: z.string().trim().min(1),
  pdfStoragePath: z.string().trim().optional(),
})

export const updateReportSchema = createReportSchema.partial()
