import { useState, type ReactNode, type SVGProps } from 'react'
import logoIcon from '../../../assets/icon.svg'

const ROLES = [
  { label: 'Real-Estate Agent', icon: BriefcaseIcon },
  { label: 'Property Valuer', icon: ValuationIcon },
  { label: 'Investor', icon: InvestorIcon },
  { label: 'Buyer', icon: UserIcon },
] as const

type Role = (typeof ROLES)[number]['label']

const NAV_ITEMS = [
  { label: 'Dashboard', icon: HomeIcon, active: true },
  { label: 'Generate Appraisal', icon: SparklesIcon, active: false },
  { label: 'Comparable Sales', icon: BuildingIcon, active: false },
  { label: 'Client Reports', icon: DocumentIcon, active: false },
  { label: 'Buyer Advisory', icon: UsersIcon, active: false },
  { label: 'Market Insights', icon: ChartIcon, active: false },
] as const

type DashboardNavbarProps = {
  children?: ReactNode
}

export function DashboardNavbar({ children }: DashboardNavbarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [role, setRole] = useState<Role>('Real-Estate Agent')
  const ActiveRoleIcon = ROLES.find((item) => item.label === role)?.icon ?? BriefcaseIcon

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      {/* Sidebar */}
      <aside
        className={[
          'sticky top-0 flex h-screen shrink-0 flex-col border-r border-black/5 bg-white transition-[width] duration-200',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        ].join(' ')}
      >
        <div
          className={[
            'flex border-b border-black/5',
            collapsed ? 'flex-col items-center gap-2 px-2 py-4' : 'items-start gap-2 px-4 py-4',
          ].join(' ')}
        >
          <a
            href="/"
            className={['flex min-w-0 items-center gap-2.5', collapsed ? 'justify-center' : 'flex-1'].join(' ')}
          >
            <img src={logoIcon} alt="Relaive icon" className="h-9 w-9 shrink-0" />
            {!collapsed && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="font-logo text-lg font-bold tracking-tight text-relaive-navy">
                  Relaive
                </span>
                <span className="truncate text-[10px] text-relaive-gray">
                  Real-estate AI Evaluation
                </span>
              </div>
            )}
          </a>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy"
          >
            <ChevronLeftIcon className={collapsed ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className={['border-b border-black/5', collapsed ? 'px-2 py-3' : 'px-3 py-3'].join(' ')}>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              aria-expanded={roleOpen}
              aria-controls="dashboard-role-accordion"
              onClick={() => {
                if (collapsed) setCollapsed(false)
                setRoleOpen((open) => !open)
              }}
              className={[
                'flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white text-left text-sm font-medium text-relaive-navy transition-colors hover:bg-[#F8F9FB]',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
              ].join(' ')}
            >
              <ActiveRoleIcon className="shrink-0 text-relaive-primary" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{role}</span>
                  <ChevronDownIcon
                    className={[
                      'shrink-0 text-relaive-gray transition-transform',
                      roleOpen ? 'rotate-180' : '',
                    ].join(' ')}
                  />
                </>
              )}
            </button>

            {roleOpen && !collapsed && (
              <ul
                id="dashboard-role-accordion"
                role="listbox"
                className="flex flex-col gap-0.5 rounded-xl border border-black/10 bg-white p-1.5"
              >
                {ROLES.map(({ label, icon: Icon }) => {
                  const selected = label === role
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setRole(label)
                          setRoleOpen(false)
                        }}
                        className={[
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          selected
                            ? 'bg-relaive-primary/15 font-medium text-relaive-primary'
                            : 'text-relaive-navy/80 hover:bg-relaive-navy/5',
                        ].join(' ')}
                      >
                        <Icon className={selected ? 'text-relaive-primary' : 'text-relaive-gray'} />
                        <span className="truncate">{label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <nav className={['flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3'].join(' ')}>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
              <li key={label}>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  className={[
                    'flex items-center gap-3 rounded-xl text-sm transition-colors',
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                    active
                      ? 'bg-relaive-navy/[0.06] font-semibold text-relaive-navy'
                      : 'font-medium text-relaive-gray hover:bg-relaive-navy/[0.04] hover:text-relaive-navy',
                  ].join(' ')}
                >
                  <Icon className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/5 bg-white px-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-relaive-gray">
            <span className="inline-flex items-center gap-1.5">
              <HomeIcon className="h-3.5 w-3.5" />
              Homepage
            </span>
            <ChevronRightIcon />
            <span className="inline-flex items-center gap-1.5 font-medium text-relaive-navy">
              <GridIcon className="h-3.5 w-3.5" />
              Platform
            </span>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-relaive-navy/5 hover:text-relaive-navy"
            >
              <BellIcon />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-relaive-navy transition-colors hover:bg-relaive-navy/5"
            >
              <BookmarkIcon />
              Watchlist
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-relaive-navy transition-colors hover:bg-relaive-navy/5"
            >
              <BotIcon />
              AI Copilot
            </button>

            <button
              type="button"
              aria-label="User profile"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#EEF1F5] text-relaive-gray transition-colors hover:bg-relaive-navy/10"
            >
              <UserIcon />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

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

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  )
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z" />
      <path d="M18.5 13l.7 2.1L21.5 16l-2.3.8-.7 2.2-.7-2.2L15.5 16l2.3-.9.7-2.1z" />
      <path d="M6 14.5l.6 1.8L8.5 17l-1.9.7L6 19.5l-.6-1.8L3.5 17l1.9-.7L6 14.5z" />
    </svg>
  )
}

function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M9 20v-5h6v5" />
      <path d="M9 10h.01M15 10h.01M9 13.5h.01M15 13.5h.01" />
    </svg>
  )
}

function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M10 12h5M10 15.5h5" />
    </svg>
  )
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
      <path d="M16.5 10.5a2.5 2.5 0 1 0 0-5" />
      <path d="M20.5 19c0-2.2-1.6-4-3.8-4.6" />
    </svg>
  )
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 19h16" />
      <path d="M7 16V11" />
      <path d="M12 16V7" />
      <path d="M17 16v-4" />
    </svg>
  )
}

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" />
      <path d="M3 13h18" />
    </svg>
  )
}

function ValuationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M9 20v-6h6v6" />
      <path d="M12 10v2M12 10h1.5a1.5 1.5 0 0 1 0 3H12" />
    </svg>
  )
}

function InvestorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 4h7l4 4v12H8z" />
      <path d="M15 4v4h4" />
      <circle cx="12" cy="13" r="2.5" />
      <path d="M14 15l2.5 2.5" />
    </svg>
  )
}

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 14, height: 14, ...props })}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 12, height: 12, className: 'text-relaive-gray/60', ...props })}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  )
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 3.5h10v17l-5-3.5-5 3.5z" />
    </svg>
  )
}

function BotIcon(props: SVGProps<SVGSVGElement>) {
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

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
    </svg>
  )
}
