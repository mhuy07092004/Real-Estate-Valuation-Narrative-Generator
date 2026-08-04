import { z } from 'zod'

const numberField = z.coerce.number().int().nonnegative()
const decimalField = z.coerce.number().nonnegative()

export const createReportSchema = z.object({
  clientId: z.string().uuid().nullish(),
  clientName: z.string().trim().min(1).optional(),
  clientEmail: z.string().trim().email().optional(),
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
  selectedComparableId: z.string().uuid().nullish(),
  selectedComparableAddress: z.string().trim().nullish(),
  selectedComparableSoldPrice: decimalField.nullish(),
  selectedComparableSoldDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  marketSuburb: z.string().trim().nullish(),
  marketMeanHousePrice: decimalField.nullish(),
  marketMonthGrowthPct: decimalField.nullish(),
  marketRentalYieldPct: decimalField.nullish(),
  marketBuyerInterestLevel: z.string().trim().nullish(),
  marketSupplyLevel: z.string().trim().nullish(),
  marketPriceGrowthLevel: z.string().trim().nullish(),
  narrativeText: z.string().trim().min(1),
  pdfStoragePath: z.string().trim().nullish(),
})

export const updateReportSchema = createReportSchema.partial()
