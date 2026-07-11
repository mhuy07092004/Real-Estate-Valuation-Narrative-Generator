import { Navbar } from '../../components/ui/navbar/navbar'
import { Button } from '../../components/ui/button/button'
import { AuthLayout } from './components/auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout
        footer={
          <span>
            Already have an account?{' '}
            <Button variant="link" href="/signin" className="text-relaive-primary">
              Sign in
            </Button>
          </span>
        }
      >
        <SignUpForm />
      </AuthLayout>
    </div>
  )
}
