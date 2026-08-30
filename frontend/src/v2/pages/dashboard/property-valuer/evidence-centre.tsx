import { ComparableSearchPage, type ComparableSearchPageCopy } from '../../../features/dashboard/components/comparable-sales/comparable-search-page'

// v2 reskin of Valuer's Evidence Centre (figma: EvidenceCentrePage.tsx, read in full —
// near-identical to ComparableSalesPage.tsx, differing only in copy: "Save Evidence" vs
// "Save Property", "Evidence Sales Nearby" vs "Similar Sales Nearby"). Thin copy-config
// wrapper around the shared ComparableSearchPage core (§4.5/§10.2) rather than a
// hand-duplicated page — same real backend (/api/appraisal/comparable-sales,
// /api/saved-properties) as the Agent version. See figma-ui-migration-plan.md §10.

const COPY: ComparableSearchPageCopy = {
  pageTitle: 'Evidence Centre',
  pageSubtitle: 'Search recent evidence records for any address',
  searchPlaceholder: 'Enter a property address to search evidence records…',
  emptyStateTitle: 'Search a property address to find evidence records',
  emptyStateSubtitle: 'Enter an address above to get started',
  loadingLabel: 'Searching evidence records…',
  resultsHeading: 'Evidence Sales Nearby',
  saveIdleLabel: 'Save Evidence',
  saveSavingLabel: 'Saving…',
  saveSavedLabel: 'Saved',
}

export function EvidenceCentrePageV2() {
  return <ComparableSearchPage copy={COPY} />
}
