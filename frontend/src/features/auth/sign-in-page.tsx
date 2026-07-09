import { AuthLayout } from './components/auth-layout'
import { SignInForm } from './components/sign-in-form'
import { Button } from '../../components/ui/button/button'

export function SignInPage() {
  return (
    <AuthLayout
      footer={
        <span>
          Don&apos;t have account yet?{' '}
          <Button variant="link" href="#signup" className="text-relaive-primary">
            Sign up
          </Button>
        </span>
      }
    >
      <SignInForm />
    </AuthLayout>
  )
}
