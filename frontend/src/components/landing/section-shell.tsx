import type { ReactNode } from 'react'

type SectionShellProps = {
  id: string
  title: string
  eyebrow?: string
  description?: string
  containerClassName?: string
  children?: ReactNode
}

export function SectionShell({
  id,
  title,
  eyebrow,
  description,
  containerClassName = 'max-w-5xl',
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-black/5 bg-white px-6 py-24"
    >
      <div className={`mx-auto flex flex-col gap-10 ${containerClassName}`}>
        <div className="flex flex-col gap-3 text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-relaive-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold text-relaive-navy sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mt-1 max-w-2xl text-base leading-relaxed text-relaive-gray">
              {description}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  )
}
