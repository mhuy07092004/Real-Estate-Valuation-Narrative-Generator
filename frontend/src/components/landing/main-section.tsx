import { useOpenPlansMenu } from '../../hooks/use-open-plans-menu'
import { Button } from '../ui/button/button'

const METRICS = [
  { value: '98.5%', label: 'Accuracy' },
  { value: '30s', label: 'Generation Time' },
  { value: '10k+', label: 'Valuations' },
] as const

export function MainSection() {
  const openPlansMenu = useOpenPlansMenu()

  return (
    <section
      id="main"
      className="relative flex flex-col items-center justify-center bg-relaive-cream px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 text-center"
    >
      <h1 className="relative text-4xl font-semibold leading-tight text-relaive-navy sm:text-6xl lg:text-7xl">
        The Future of
        <br />
        <span className="text-relaive-accent font-bold">Property Intelligence</span>
      </h1>

      <p className="relative mt-6 max-w-xl text-base text-relaive-gray leading-relaxed">
        <strong className="font-semibold text-relaive-navy">Relaive</strong> helps you generate
        market-aware property appraisal narratives using AI, comparable sales data, and suburb
        insights.
      </p>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button variant="primary" size="md" href="/signin">
          Start Demo Valuation
        </Button>
        <Button variant="secondary" size="md" onClick={openPlansMenu}>
          Explore Plans
        </Button>
      </div>

      <div className="relative mt-12 grid grid-cols-3 gap-4 sm:mt-16 sm:gap-8 lg:gap-12">
        {METRICS.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold text-relaive-primary sm:text-4xl">{value}</span>
            <span className="text-center text-xs text-relaive-gray sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
