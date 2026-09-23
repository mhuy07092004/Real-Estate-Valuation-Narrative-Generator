import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

/** Google Sans Code — add to any clickable element that is not a native `<button>`. */
export const BUTTON_FONT_CLASS = 'font-button'

// cursor-pointer is explicit because native <button> defaults to the plain
// arrow cursor, not a hand — unlike <a>, which is why this wasn't noticed
// on link-style usages. disabled:cursor-not-allowed is harmless alongside
// disabled:pointer-events-none (which already blocks hover/click) since it
// only matters if something upstream re-enables pointer events.
const BASE = `inline-flex items-center justify-center ${BUTTON_FONT_CLASS} font-medium rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed`

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary:
    'bg-relaive-primary text-white hover:bg-relaive-primary-hover',
  secondary:
    'bg-relaive-secondary text-white hover:bg-relaive-secondary-hover',
  ghost:
    'bg-transparent text-relaive-navy hover:bg-relaive-navy/10',
  link:
    'bg-transparent text-relaive-navy font-semibold underline-offset-4 hover:underline p-0',
  outline:
    'bg-white text-relaive-navy border border-black/10 hover:bg-relaive-navy/5',
}

const SIZE_MAP: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}): string {
  const sizeClass = variant === 'link' ? '' : SIZE_MAP[size]
  return [BASE, VARIANT_MAP[variant], sizeClass, className]
    .filter(Boolean)
    .join(' ')
}

type ButtonBaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type ButtonAsAnchor = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const classes = buttonVariants({ variant, size, className })

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorProps } = props as ButtonAsAnchor
    return <a href={href} className={classes} {...anchorProps} />
  }

  return <button className={classes} {...(props as ButtonAsButton)} />
}
