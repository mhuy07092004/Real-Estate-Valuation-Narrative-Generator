import type { ReactNode } from 'react'
import logoIcon from '../../../assets/icon.svg'

type AuthLayoutProps = {
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-relaive-cream to-relaive-surface px-6 py-12">
      <a href="/" className="mb-8 flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Relaive icon" className="h-9 w-9" />
          <span className="text-lg font-bold text-relaive-navy tracking-tight">Relaive</span>
        </div>
        <span className="text-[11px] text-relaive-gray">Real-estate AI Evaluation</span>
      </a>

      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-10">
        {children}
      </div>

      {footer ? <div className="mt-6 text-sm text-relaive-gray">{footer}</div> : null}
    </div>
  )
}
