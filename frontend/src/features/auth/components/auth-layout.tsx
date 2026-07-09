import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ children, footer }: AuthLayoutProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-10">
        {children}
      </div>

      {footer ? <div className="mt-6 text-sm text-relaive-gray">{footer}</div> : null}
    </div>
  )
}
