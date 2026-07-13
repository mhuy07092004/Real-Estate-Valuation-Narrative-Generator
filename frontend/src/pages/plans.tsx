import { PlanComparison } from '../components/landing/plans-page/plan-comparision'
import { PlanPrice } from '../components/landing/plans-page/plan-price'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />

      <main className="flex-1">
        <PlanPrice />
        <PlanComparison />
      </main>

      <Footer />
    </div>
  )
}
