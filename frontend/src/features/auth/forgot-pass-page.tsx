import { Navbar } from '../../components/ui/navbar/navbar'
import { Button } from '../../components/ui/button/button'
import { AuthLayout } from './components/auth-layout'
import { ForgotPassForm } from './components/forgot-pass-form'

export function ForgotPassPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout
        footer={
          <span>
            Remember your password?{' '}
            <Button variant="link" href="/signin" className="text-relaive-primary">
              Sign in
            </Button>
          </span>
        }
      >
        <ForgotPassForm />
      </AuthLayout>
    </div>
  )
}
