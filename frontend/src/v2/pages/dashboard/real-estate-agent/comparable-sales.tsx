import { ComparableSearchPage, type ComparableSearchPageCopy } from '../../../features/dashboard/components/comparable-sales/comparable-search-page'

// New standalone page (net-new route, no v1 counterpart) — figma: ComparableSalesPage.tsx
// (read in full, all 278 lines). Thin copy-config wrapper around the shared
// ComparableSearchPage core (§4.5/§10.2) — Valuer's Evidence Centre is the other consumer.
// See figma-ui-migration-plan.md §9.1 / §9.4 step 5 / §9.7 B.

const COPY: ComparableSearchPageCopy = {
  pageTitle: 'Comparable Sales',
  pageSubtitle: 'Search recent comparable sales for any address',
  searchPlaceholder: 'Enter a property address...',
  emptyStateTitle: 'Enter an address to get started',
  emptyStateSubtitle: "We'll pull the closest comparable sales.",
  loadingLabel: 'Searching comparable sales…',
  resultsHeading: 'Similar Sales Nearby',
  saveIdleLabel: 'Save Property',
  saveSavingLabel: 'Saving…',
  saveSavedLabel: 'Saved',
}

export function ComparableSalesPageV2() {
  return <ComparableSearchPage copy={COPY} />
}
