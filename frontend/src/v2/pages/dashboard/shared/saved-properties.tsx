import { SavedPropertiesView } from '../../../features/dashboard/components/saved-properties/saved-properties-view'

// Agent + Investor "Saved Properties" nav item (figma: Sidebar.tsx lines 38/103).
// Same shared component Buyer already uses at /dashboard/buyer/saved — mounted here at
// the role-agnostic /dashboard/:role/saved-properties route since the underlying data
// (/api/saved-properties) doesn't differ by role.
export function SharedSavedPropertiesPageV2() {
  return <SavedPropertiesView />
}
