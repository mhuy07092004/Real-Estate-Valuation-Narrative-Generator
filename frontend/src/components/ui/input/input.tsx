import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export function Input({ label, startIcon, endIcon, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-relaive-navy">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {startIcon ? (
          <span className="pointer-events-none absolute left-3 flex items-center text-relaive-gray">
            {startIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={`w-full rounded-lg border border-black/10 bg-white py-2.5 text-sm text-relaive-navy placeholder:text-relaive-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary ${
            startIcon ? 'pl-10' : 'pl-4'
          } ${endIcon ? 'pr-10' : 'pr-4'} ${className}`}
          {...props}
        />
        {endIcon ? (
          <span className="absolute right-3 flex items-center text-relaive-gray">{endIcon}</span>
        ) : null}
      </div>
    </div>
  )
}
