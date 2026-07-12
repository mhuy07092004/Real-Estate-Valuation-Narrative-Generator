import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-[0_4px_24px_rgba(26,32,44,0.06)] sm:p-7 ${className}`}
    >
      {children}
    </article>
  )
}

export function CardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-relaive-primary text-white">
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-relaive-navy sm:text-xl">{children}</h3>
  )
}

export function CardDescription({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-relaive-gray">{children}</p>
  )
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="8" fill="white" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 9L7.5 11L12.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CardFeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm leading-snug text-relaive-gray"
        >
          <span className="mt-0.5 text-relaive-secondary">
            <CheckIcon />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function CardTags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-6">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-relaive-primary/10 px-3 py-1 text-xs font-medium text-relaive-primary"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

type FeatureCardProps = {
  icon: ReactNode
  title: string
  description: string
  features: string[]
  tags?: string[]
  className?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  features,
  tags,
  className = '',
}: FeatureCardProps) {
  return (
    <Card className={className}>
      <CardIcon>{icon}</CardIcon>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardFeatureList items={features} />
      {tags ? <CardTags tags={tags} /> : null}
    </Card>
  )
}
