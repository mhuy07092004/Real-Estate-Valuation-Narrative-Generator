import type { SVGProps } from 'react'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 18,
    height: 18,
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

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
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

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M9 4l6 6-2.5.5L15 18l-3-2-3 2 2.5-7.5L9 10z" />
      <path d="M12 18v3" />
    </svg>
  )
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 5v4h4" />
      <path d="M12 8v5l3 2" />
    </svg>
  )
}

export function ExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 18h14" />
    </svg>
  )
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 19l.9-5.4L4.2 9.7l5.4-.8L12 4z" />
    </svg>
  )
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3.5-4 3 2.5L18 8" />
    </svg>
  )
}

export function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M9 20v-5h6v5" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  )
}

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 7h11l-3-3" />
      <path d="M17 17H6l3 3" />
    </svg>
  )
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5v4h4" />
      <path d="M10 12h6M10 16h4" />
    </svg>
  )
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <rect x="8" y="8" width="10" height="10" rx="1.5" />
      <path d="M6 16H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 3h10A1.5 1.5 0 0 1 16.5 4.5V6" />
    </svg>
  )
}

export function ThumbsUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M8 11V7.5A2.5 2.5 0 0 1 10.5 5L12 9h4.5a1.5 1.5 0 0 1 1.5 1.7l-1 6A1.5 1.5 0 0 1 15.5 18H8z" />
      <path d="M8 11H5.5A1.5 1.5 0 0 0 4 12.5v4A1.5 1.5 0 0 0 5.5 18H8" />
    </svg>
  )
}

export function ThumbsDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M16 13v3.5A2.5 2.5 0 0 1 13.5 19L12 15H7.5A1.5 1.5 0 0 1 6 13.3l1-6A1.5 1.5 0 0 1 8.5 6H16z" />
      <path d="M16 13h2.5A1.5 1.5 0 0 0 20 11.5v-4A1.5 1.5 0 0 0 18.5 6H16" />
    </svg>
  )
}

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 5v4h-4" />
    </svg>
  )
}

export function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M15 12.5l-5.8 5.8a4 4 0 0 1-5.7-5.7L14 2.1a2.7 2.7 0 0 1 3.8 3.8L8.3 15.4a1.3 1.3 0 0 1-1.9-1.9L15.5 4.4" />
    </svg>
  )
}

export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M4 16l4.5-4 3.5 3 3-2.5L20 16" />
    </svg>
  )
}

export function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <rect x="9" y="4" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v3" />
    </svg>
  )
}

export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />
    </svg>
  )
}
