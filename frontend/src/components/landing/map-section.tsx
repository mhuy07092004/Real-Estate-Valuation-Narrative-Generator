import { MapCard } from '../ui/map-card/map-card'
import { SectionShell } from './section-shell'

export function MapSection() {
  return (
    <SectionShell
      id="platform"
      title="Interactive Property Intelligence Map"
      description="Explore comparable sales, suburb insights, infrastructure layers, and AI-powered market intelligence spatially."
      containerClassName="max-w-6xl"
    >
      <MapCard />
    </SectionShell>
  )
}
