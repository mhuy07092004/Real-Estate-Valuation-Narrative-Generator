import { Navbar } from '../../components/ui/navbar/navbar'
import { Button } from '../../components/ui/button/button'
import { AuthLayout } from './components/auth-layout'
import { SignInForm } from './components/sign-in-form'

export function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout
        footer={
          <span>
            Don&apos;t have account yet?{' '}
            <Button variant="link" href="/signup" className="text-relaive-primary">
              Sign up
            </Button>
          </span>
        }
      >
        <SignInForm />
      </AuthLayout>
    </div>
  )
}
