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

        <div className="flex items-center justify-between text-sm">
          <Button variant="link" href="/signin" className="text-relaive-navy">
            Cancel
          </Button>
          <Button type="button" variant="link" className="text-relaive-primary">
            Try another way
          </Button>
        </div>
      </form>
    </div>
  )
}
