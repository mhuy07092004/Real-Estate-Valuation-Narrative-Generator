import { http, HttpResponse } from 'msw'
import type { PropertyCardData } from '../../../components/ui/property-card/property-card'
import type { AffordabilityCalculationMock } from '../../../services/buyer'
import type { CaseItem } from '../../../services/dashboard'
import type { InboxNotification } from '../../../services/common'
import { simulateLatency } from './mock-utils'

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

const AFFORDABILITY_CALCULATION_DATA: AffordabilityCalculationMock = {
  summary: [
    { label: 'Repayment-to-income', value: '26%', valueTone: 'orange' },
    { label: 'Ideal Range', value: 'below 30%' },
    { label: 'AFFORDABILITY', value: 'Moderate', valueTone: 'orange' },
  ],
  metrics: [
    {
      label: 'Estimate Borrowing Capacity',
      value: '$798,000',
      tone: 'blue',
      valueClassName: 'text-[22px] sm:text-[28px] text-emerald-600',
    },
    {
      label: 'Max Loan Amount',
      value: '$550,000',
      tone: 'blue',
      valueClassName: 'text-[22px] sm:text-[28px] text-amber-500',
    },
    {
      label: 'Monthly Repayment',
      value: '$3,200',
      tone: 'teal',
    },
  ],
}

const SEARCH_PROPERTIES_DATA: PropertyCardData[] = [
  {
    id: 'prop-1',
    address: {
      street: '45 Clarendon St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1180000,
    estimatedRange: { min: '$1.09M', max: '$1.21M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 312 },
    listedDays: 8,
    status: 'within_range',
  },
  {
    id: 'prop-2',
    address: {
      street: '12 Park St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 920000,
    estimatedRange: { min: '$890k', max: '$960k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 1, areaSqm: 98 },
    listedDays: 14,
    status: 'below_range',
  },
  {
    id: 'prop-3',
    address: {
      street: '8 Dorcas St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1450000,
    estimatedRange: { min: '$1.32M', max: '$1.48M' },
    propertyType: 'Townhouse',
    features: { beds: 4, baths: 3, areaSqm: 245, parking: 2 },
    listedDays: 3,
    status: 'above_range',
  },
  {
    id: 'prop-4',
    address: {
      street: '22 Bank St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1050000,
    estimatedRange: { min: '$980k', max: '$1.12M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 280 },
    listedDays: 21,
    status: 'within_range',
  },
  {
    id: 'prop-5',
    address: {
      street: '5 Coventry St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 785000,
    estimatedRange: { min: '$720k', max: '$800k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 1, areaSqm: 85 },
    listedDays: 5,
    status: 'below_range',
  },
  {
    id: 'prop-6',
    address: {
      street: '31 Moray St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1620000,
    estimatedRange: { min: '$1.55M', max: '$1.70M' },
    propertyType: 'House',
    features: { beds: 4, baths: 2, areaSqm: 420, parking: 2 },
    listedDays: 11,
    status: 'above_range',
  },
]

const SAVED_PROPERTIES_DATA: PropertyCardData[] = [
  {
    id: 'saved-1',
    address: {
      street: '18 Cecil St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1325000,
    estimatedRange: { min: '$1.25M', max: '$1.38M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 295, parking: 1 },
    listedDays: 6,
    status: 'within_range',
  },
  {
    id: 'saved-2',
    address: {
      street: '9 York St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 865000,
    estimatedRange: { min: '$810k', max: '$890k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 2, areaSqm: 110 },
    listedDays: 12,
    status: 'below_range',
  },
]

const BUYER_REPORT_LIST: CaseItem[] = [
  {
    id: 'BY-5210',
    address: '3 Grove St',
    suburb: 'Camberwell VIC 3124',
    clientName: 'Self',
    status: 'exported',
    purpose: 'Pre-Purchase Report',
    confidence: 88,
    updatedAt: hoursAgo(6),
    hasWarning: false,
  },
  {
    id: 'BY-5209',
    address: '27 Toorak Rd',
    suburb: 'Toorak VIC 3142',
    clientName: 'Self',
    status: 'draft',
    purpose: 'Due Diligence Review',
    confidence: null,
    updatedAt: daysAgo(2),
    hasWarning: false,
  },
  {
    id: 'BY-5208',
    address: '44 High St',
    suburb: 'Kew VIC 3101',
    clientName: 'Self',
    status: 'approved',
    purpose: 'Buyer Advisory Report',
    confidence: 91,
    updatedAt: daysAgo(5),
    hasWarning: false,
  },
]

const BUYER_NOTIFICATIONS_DATA: InboxNotification[] = [
  {
    id: 'buyer-notif-1',
    title: 'Price Drop – 123 Smith St',
    description:
      'A saved property dropped $25,000 to $807,000. Within your current affordability range.',
    priority: 'high',
    timestamp: '15 mins ago',
    isRead: false,
    icon: 'sale',
  },
  {
    id: 'buyer-notif-2',
    title: 'Affordability Update',
    description:
      'Your borrowing capacity estimate increased to $920,000 after the latest rate assumptions.',
    priority: 'high',
    timestamp: '1 hour ago',
    isRead: false,
    icon: 'ai',
  },
  {
    id: 'buyer-notif-3',
    title: 'New Listing Near You',
    description:
      '18 Bridge Rd, Richmond listed at $795,000 – matches your search filters for 2+ bedrooms.',
    priority: 'medium',
    timestamp: '3 hours ago',
    isRead: false,
    icon: 'market',
  },
  {
    id: 'buyer-notif-4',
    title: 'Comparable Sale Nearby',
    description:
      '9 Swan St sold for $815,000 – useful benchmark for your saved property at 123 Smith St.',
    priority: 'medium',
    timestamp: '5 hours ago',
    isRead: false,
    icon: 'sale',
  },
  {
    id: 'buyer-notif-5',
    title: 'Buyer Advisory Ready',
    description: 'Your advisory report for Carlton North is ready to view in Reports.',
    priority: 'low',
    timestamp: '1 day ago',
    isRead: true,
    icon: 'report',
  },
  {
    id: 'buyer-notif-6',
    title: 'Suburb Forecast – Fitzroy',
    description: 'AI growth outlook for Fitzroy moved from Moderate to Strong (6.8% p.a.).',
    priority: 'low',
    timestamp: '3 days ago',
    isRead: true,
    icon: 'forecast',
  },
]

export const buyerHandlers = [
  http.get('/api/buyer/affordability-calculation', async () => {
    await simulateLatency()
    return HttpResponse.json(AFFORDABILITY_CALCULATION_DATA)
  }),

  http.get('/api/buyer/properties/search', async () => {
    await simulateLatency()
    return HttpResponse.json(SEARCH_PROPERTIES_DATA)
  }),

  http.get('/api/buyer/properties/saved', async () => {
    await simulateLatency()
    return HttpResponse.json(SAVED_PROPERTIES_DATA)
  }),

  http.get('/api/buyer/reports', async () => {
    await simulateLatency()
    return HttpResponse.json(BUYER_REPORT_LIST)
  }),

  http.get('/api/buyer/notifications', async () => {
    await simulateLatency()
    return HttpResponse.json(BUYER_NOTIFICATIONS_DATA)
  }),

  http.get('/api/buyer/notifications/unread-count', async () => {
    await simulateLatency()
    return HttpResponse.json(BUYER_NOTIFICATIONS_DATA.filter((n) => !n.isRead).length)
  }),
]
