import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relaive-primary disabled:opacity-50 disabled:pointer-events-none'

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary:
    'bg-relaive-primary text-white hover:bg-relaive-primary-hover',
  secondary:
    'bg-relaive-secondary text-white hover:bg-relaive-secondary-hover',
  ghost:
    'bg-transparent text-relaive-navy hover:bg-relaive-navy/10',
  link:
    'bg-transparent text-relaive-navy font-semibold underline-offset-4 hover:underline p-0',
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
