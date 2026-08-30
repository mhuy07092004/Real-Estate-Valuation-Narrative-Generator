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

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  )
}

export function NavPlaceholderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" />
      <path d="M3 13h18" />
    </svg>
  )
}

export function ValuationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M9 20v-6h6v6" />
      <path d="M12 10v2M12 10h1.5a1.5 1.5 0 0 1 0 3H12" />
    </svg>
  )
}

export function InvestorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 4h7l4 4v12H8z" />
      <path d="M15 4v4h4" />
      <circle cx="12" cy="13" r="2.5" />
      <path d="M14 15l2.5 2.5" />
    </svg>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M15 6l-6 6 6 6" />
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

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 12, height: 12, className: 'text-relaive-gray/60', ...props })}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  )
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 3.5h10v17l-5-3.5-5 3.5z" />
    </svg>
  )
}

export function BotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <rect x="5" y="7" width="14" height="11" rx="3" />
      <path d="M12 4v3" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M5 12H3.5M20.5 12H19" />
    </svg>
  )
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
    </svg>
  )
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
    </svg>
  )
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="M14 12H7" />
      <path d="M17 9l3 3-3 3" />
    </svg>
  )
}

export function ScaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 7h4M15 7h4" />
      <path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0z" />
      <path d="M19 7l-2.5 5a2.5 2.5 0 0 0 5 0z" />
      <path d="M12 3l-5 4M12 3l5 4" />
    </svg>
  )
}

export function UserGroupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="9" cy="8.5" r="2.75" />
      <path d="M3.5 19c0-2.9 2.5-4.75 5.5-4.75s5.5 1.85 5.5 4.75" />
      <circle cx="17" cy="8.5" r="2" />
      <path d="M15.5 14.5c2.2.4 3.9 1.9 3.9 4.5" />
    </svg>
  )
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

// --- Sidebar item icons matching figma-protoype_v2's Sidebar.tsx, reused by concept
// (not one-off per role) wherever the same icon recurs across roles' nav configs. ---

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M8 3v18M16 3v18" />
      <path d="M4 8l4-5 4 5M20 16l-4 5-4-5" />
    </svg>
  )
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 20.5s-7.5-4.6-9.7-9.2C1 8 2.3 4.8 5.6 4.1c2-.4 3.7.5 4.9 2.1a.6.6 0 0 0 1 0c1.2-1.6 2.9-2.5 4.9-2.1 3.3.7 4.6 3.9 3.3 7.2C19.5 15.9 12 20.5 12 20.5z" />
    </svg>
  )
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5V8h4" />
      <path d="M9.5 13h5M9.5 16.5h5" />
    </svg>
  )
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="9" cy="8.5" r="2.75" />
      <path d="M3.5 19c0-2.9 2.5-4.75 5.5-4.75s5.5 1.85 5.5 4.75" />
      <circle cx="17" cy="8.5" r="2" />
      <path d="M15.5 14.5c2.2.4 3.9 1.9 3.9 4.5" />
    </svg>
  )
}

export function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6" />
      <path d="M15 6h5.5v5.5" />
    </svg>
  )
}

export function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  )
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.3 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.25" />
    </svg>
  )
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M12 3.5 21 8l-9 4.5L3 8z" />
      <path d="M3 12.5l9 4.5 9-4.5" />
      <path d="M3 16.5l9 4.5 9-4.5" />
    </svg>
  )
}

export function CalculatorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 7.5h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 15.5h.01M12 15.5h.01M16 15.5h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  )
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11z" />
    </svg>
  )
}

export function ClipboardListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h.01M9 15h.01M9 19h.01" />
      <path d="M12 11h4M12 15h4M12 19h4" />
    </svg>
  )
}
