// Author: Minh Huy Loi
import { Navbar } from '../../components/ui/navbar/navbar'
import { AuthLayout } from './components/auth-layout'
import { OnboardingSlider } from './components/onboarding-slider'

export function SelectRolePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout>
        <OnboardingSlider />
      </AuthLayout>
    </div>
  )
}
