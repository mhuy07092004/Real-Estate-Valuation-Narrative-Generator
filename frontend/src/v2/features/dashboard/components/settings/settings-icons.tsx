import type { SVGProps } from 'react'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    ...props,
  }
}

export function CreditCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14.5h4" />
    </svg>
  )
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.5l7 3v5c0 5-3 7.5-7 9-4-1.5-7-4-7-9v-5z" />
      <path d="M9.5 12l1.8 1.8 3.2-3.6" />
    </svg>
  )
}

export function HelpCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1.9-1.1 1.6" />
      <circle cx="12" cy="16.7" r="0.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function MessageCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.5A7.96 7.96 0 0 1 4 12z" />
    </svg>
  )
}

export function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M9 6h9v9" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 18h14" />
    </svg>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A9.9 9.9 0 0 1 12 5.5c6.5 0 9.5 6.5 9.5 6.5a13.4 13.4 0 0 1-3.2 4.1M7 7.3A13 13 0 0 0 2.5 12S5.5 18.5 12 18.5a10.4 10.4 0 0 0 3.3-.5" />
      <path d="M9.5 9.9a3 3 0 0 0 4.1 4.1" />
    </svg>
  )
}

export function CheckSmallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M4.5 12.5l4.5 4.5 10-11" />
    </svg>
  )
}
