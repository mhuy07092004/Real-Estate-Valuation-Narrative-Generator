// Author: The Long Tran
import { Navbar } from '../../components/ui/navbar/navbar'
import { Button } from '../../components/ui/button/button'
import { AuthLayout } from './components/auth-layout'
import { ResetPasswordForm } from './components/reset-password-form'

export function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout
        footer={
          <span>
            Back to{' '}
            <Button variant="link" href="/signin" className="text-relaive-primary">
              Sign in
            </Button>
          </span>
        }
      >
        <ResetPasswordForm />
      </AuthLayout>
    </div>
  )
}
