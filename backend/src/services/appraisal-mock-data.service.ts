import type {
  AiAnalysisMetric,
  AiAnalysisSummaryNotification,
  ComparableSale,
  DemandSignal,
  PropertyInputMethodOption,
  ReportTemplateOption,
  StepperStep,
  SuburbOverviewMetric,
} from '../types/appraisal.types.js'

export function getAppraisalSteps(): StepperStep[] {
  return [
    { id: 'property-input', label: 'Property Input' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'comparables', label: 'Comparables' },
    { id: 'market-intelligence', label: 'Market Intelligence' },
    { id: 'report', label: 'Report' },
  ]
}

export function getPropertyInputMethods(): PropertyInputMethodOption[] {
  return [
    { id: 'enter-address', title: 'Enter Address', description: 'Type the full property address', iconKey: 'address' },
    { id: 'search-property', title: 'Search Property', description: 'Search our property database', iconKey: 'search' },
    { id: 'upload-file', title: 'Upload File', description: 'Import from CSV or spreadsheet', iconKey: 'upload' },
  ]
}

export function getPropertyTypeOptions(): readonly string[] {
  return ['House', 'Unit', 'Townhouse']
}

export function getAiAnalysisMetrics(): AiAnalysisMetric[] {
  return [
    { id: 'location-quality', label: 'Location Quality', value: 92, tone: 'blue' },
    { id: 'property-condition', label: 'Property Condition', value: 85, tone: 'teal' },
    { id: 'market-demand', label: 'Market Demand', value: 88, tone: 'orange' },
    { id: 'growth-potential', label: 'Growth Potential', value: 78, tone: 'sky' },
  ]
}

export function getAiAnalysisSummaryNotification(): AiAnalysisSummaryNotification {
  return {
    title: 'AI-Generated Summary',
    message:
      'This 3-bedroom house is located in a highly desirable area with strong market fundamentals. The property shows excellent location attributes including proximity to amenities, transport, and quality schools. Current market conditions indicate steady demand with moderate growth potential.',
  }
}

export function getComparableSales(): ComparableSale[] {
  return [
    {
      id: 'comp-smith-st',
      address: '125 Smith Street, Melbourne VIC',
      price: 840_000,
      soldAgo: '2 weeks ago',
      beds: 3,
      baths: 2,
      parking: 2,
      areaSqm: 450,
      matchPercent: 95,
      distanceKm: 0.2,
    },
    {
      id: 'comp-collins-ave',
      address: '89 Collins Avenue, Melbourne VIC',
      price: 825_000,
      soldAgo: '1 month ago',
      beds: 3,
      baths: 2,
      parking: 1,
      areaSqm: 420,
      matchPercent: 88,
      distanceKm: 0.5,
    },
    {
      id: 'comp-park-st',
      address: '234 Park Street, Melbourne VIC',
      price: 865_000,
      soldAgo: '3 weeks ago',
      beds: 4,
      baths: 2,
      parking: 2,
      areaSqm: 480,
      matchPercent: 82,
      distanceKm: 0.8,
    },
  ]
}

export function getSuburbOverview(): SuburbOverviewMetric[] {
  return [
    { id: 'median-price', label: 'Median House Price', value: '$845,000' },
    { id: 'growth-12m', label: '12-Month Growth', value: '+8.5%', tone: 'positive' },
    { id: 'rental-yield', label: 'Rental Yield', value: '3.8%' },
    { id: 'days-on-market', label: 'Days on Market', value: '28 days' },
  ]
}

export function getDemandSignals(): DemandSignal[] {
  return [
    { id: 'buyer-interest', label: 'Buyer Interest', level: 'High', percent: 100, tone: 'high' },
    { id: 'supply-level', label: 'Supply Level', level: 'Medium', percent: 50, tone: 'medium' },
    { id: 'price-growth', label: 'Price Growth', level: 'Strong', percent: 85, tone: 'strong' },
  ]
}

export function getReportTemplates(): ReportTemplateOption[] {
  return [
    { id: 'vendor-appraisal', title: 'Vendor Appraisal', description: 'For sellers listing property', iconKey: 'vendor' },
    { id: 'bank-valuation', title: 'Bank Valuation', description: 'Formal lending valuation', iconKey: 'bank' },
    { id: 'buyer-advisory', title: 'Buyer Advisory', description: 'Purchase decision support', iconKey: 'buyer' },
    { id: 'investment-report', title: 'Investment Report', description: 'ROI and yield analysis', iconKey: 'investment' },
  ]
}
