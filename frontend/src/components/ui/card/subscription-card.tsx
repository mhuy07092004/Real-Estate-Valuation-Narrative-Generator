import type { ReactNode } from 'react'
import { Button } from '../button/button'
import { Card, CardDescription, CardTitle } from './card'

type BadgeTone = 'default' | 'popular' | 'enterprise'
type CardVariant = 'light' | 'dark'
type PrimaryCtaStyle = 'primary' | 'soft' | 'gold'

type Cta = {
  label: string
  href: string
}

export type SubscriptionCardProps = {
  icon: ReactNode
  badge: string
  badgeTone?: BadgeTone
  title: string
  description: string
  price: string
  priceSuffix?: string
  features: string[]
  primaryCta: Cta
  secondaryCta: Cta
  primaryCtaStyle?: PrimaryCtaStyle
  highlighted?: boolean
  variant?: CardVariant
  billingPeriod?: 'monthly' | 'annually'
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
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

function SubscriptionFeatureList({
  items,
  variant,
}: {
  items: string[]
  variant: CardVariant
}) {
  const isDark = variant === 'dark'

  return (
    <ul className="mt-5 flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-2.5 text-sm leading-snug ${
            isDark ? 'text-white/80' : 'text-relaive-gray'
          }`}
        >
          <span className={`mt-0.5 ${isDark ? 'text-amber-400' : 'text-relaive-secondary'}`}>
            <CheckIcon />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function ChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="ml-1 shrink-0"
    >
      <path
        d="M5 3L9 7L5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const BADGE_STYLES: Record<BadgeTone, string> = {
  default: 'bg-relaive-primary/10 text-relaive-primary',
  popular: 'bg-relaive-primary text-white',
  enterprise: 'bg-gradient-to-r from-[#F0B100] to-[#D08700] text-white',
}

const PRIMARY_CTA_STYLES: Record<PrimaryCtaStyle, string> = {
  primary: '',
  soft: 'bg-relaive-primary/10 text-relaive-primary hover:bg-relaive-primary/20 border-0',
  gold: 'bg-gradient-to-r from-[#F0B100] to-[#D08700] text-white hover:opacity-90 border-0',
}

export function SubscriptionCard({
  icon,
  badge,
  badgeTone = 'default',
  title,
  description,
  price,
  priceSuffix,
  features,
  primaryCta,
  secondaryCta,
  primaryCtaStyle = 'soft',
  highlighted = false,
  variant = 'light',
  billingPeriod = 'monthly',
}: SubscriptionCardProps) {
  const isDark = variant === 'dark'

  const cardClassName = [
    isDark
      ? 'border-white/10 bg-gradient-to-br from-[#102132f2] to-[#1c2a38f2] text-white shadow-[0_8px_32px_rgba(15,23,42,0.35)]'
      : '',
    highlighted ? 'ring-2 ring-relaive-primary/40 shadow-[0_8px_32px_rgba(84,148,182,0.18)]' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isDark
              ? 'bg-gradient-to-r from-[#F0B100] to-[#D08700] text-white'
              : 'bg-relaive-primary/10 text-relaive-primary'
          }`}
        >
          {icon}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE_STYLES[badgeTone]}`}
        >
          {badge}
        </span>
      </div>

      {isDark ? (
        <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
      ) : (
        <CardTitle>{title}</CardTitle>
      )}

      {isDark ? (
        <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
      ) : (
        <CardDescription>{description}</CardDescription>
      )}

      <div className="mt-5">
        {billingPeriod === 'annually' && price !== 'Free' && price !== 'Contact Us' ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg text-relaive-gray line-through decoration-1">{price}</span>
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                Save 20%
              </span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-relaive-navy'}`}>
              ${(parseFloat(price.replace('$', '')) * 0.8).toFixed(1)}
              {priceSuffix ? (
                <span className={`ml-1 text-base font-medium ${isDark ? 'text-white/60' : 'text-relaive-gray'}`}>
                  {priceSuffix}
                </span>
              ) : null}
            </p>
          </div>
        ) : (
          <p className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-relaive-navy'}`}>
            {price}
            {priceSuffix ? (
              <span className={`ml-1 text-base font-medium ${isDark ? 'text-white/60' : 'text-relaive-gray'}`}>
                {priceSuffix}
              </span>
            ) : null}
          </p>
        )}
      </div>

      <SubscriptionFeatureList items={features} variant={variant} />

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button
          variant={
            primaryCtaStyle === 'primary'
              ? 'primary'
              : primaryCtaStyle === 'gold'
                ? 'ghost'
                : 'outline'
          }
          href={primaryCta.href}
          className={`w-full ${PRIMARY_CTA_STYLES[primaryCtaStyle]}`}
        >
          {primaryCta.label}
          <ChevronRight />
        </Button>
        <Button variant="outline" href={secondaryCta.href} className="w-full">
          {secondaryCta.label}
        </Button>
      </div>
    </Card>
  )
}
