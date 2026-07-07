import type { ReactNode } from 'react'

type SectionShellProps = {
  id: string
  title: string
  eyebrow?: string
  children?: ReactNode
}

export function SectionShell({ id, title, eyebrow, children }: SectionShellProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-black/5 bg-relaive-surface px-6 py-24"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3 text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-relaive-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold text-relaive-navy sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="min-h-[240px]">{children}</div>
      </div>
    </section>
  )
}
