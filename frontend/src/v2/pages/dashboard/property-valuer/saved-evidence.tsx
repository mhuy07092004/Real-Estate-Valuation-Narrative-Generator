import { SavedPropertiesView } from '../../../features/dashboard/components/saved-properties/saved-properties-view'

// Valuer's "Saved Evidence" nav item (figma: Sidebar.tsx line 72 — same saved-properties
// page as every other role, relabeled). Same shared component, evidence-flavored copy.
export function SavedEvidencePageV2() {
  return (
    <SavedPropertiesView
      title="Saved Evidence"
      compareLabel="View in Evidence Centre"
      compareRoute="evidence-centre"
      emptyTitle="No saved evidence yet"
      emptyHint="Save a property from the Evidence Centre to see it here."
    />
  )
}
