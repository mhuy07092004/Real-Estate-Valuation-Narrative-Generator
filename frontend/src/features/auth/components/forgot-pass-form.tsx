import { Button } from '../../../components/ui/button/button'
import { Input } from '../../../components/ui/input/input'

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 4L7.29 8.06a1.2 1.2 0 0 0 1.42 0L14 4M2.667 3h10.666c.737 0 1.334.597 1.334 1.333v7.334c0 .736-.597 1.333-1.334 1.333H2.667c-.736 0-1.334-.597-1.334-1.333V4.333C1.333 3.597 1.93 3 2.667 3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.73a5.4 5.4 0 0 1 0-3.46V4.93H.96a9 9 0 0 0 0 8.14l3.01-2.34Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.93l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M0 0h8.5v8.5H0V0Z" fill="#F25022" />
      <path d="M9.5 0H18v8.5H9.5V0Z" fill="#7FBA00" />
      <path d="M0 9.5h8.5V18H0V9.5Z" fill="#00A4EF" />
      <path d="M9.5 9.5H18V18H9.5V9.5Z" fill="#FFB900" />
    </svg>
  )
}

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'microsoft', label: 'Microsoft', icon: MicrosoftIcon },
] as const

function SocialLoginDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-xs text-relaive-gray">Or continue with</span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  )
}

function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SOCIAL_PROVIDERS.map(({ id, label, icon: Icon }) => (
        <Button key={id} type="button" variant="outline" size="md" className="gap-2">
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  )
}

export function ForgotPassForm() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-relaive-navy">Forgot your password?</h1>
        <p className="mt-2 text-sm text-relaive-gray">
          Enter your email to recover your account
        </p>
      </div>

      <form className="flex flex-col gap-5">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          startIcon={<MailIcon />}
          autoComplete="email"
        />

        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-to-r from-relaive-primary to-relaive-secondary hover:opacity-90"
        >
          Continue
        </Button>

        <Button type="button" variant="outline" size="lg" className="w-full">
          Try another way
        </Button>
      </form>

      <SocialLoginDivider />
      <SocialLoginButtons />
    </div>
  )
}
