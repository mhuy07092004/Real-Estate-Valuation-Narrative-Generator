import logoIcon from '../../../assets/icon.svg'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import { ChevronDownIcon, ChevronLeftIcon, NavPlaceholderIcon } from './dashboard-navbar-icons'
import { RoleOptionsList } from './role-options-list'
import type { RoleOption, SidebarNavSection } from './dashboard-navbar.types'

const BOTTOM_NAV_ITEMS = ['Settings', 'Account'] as const

type DashboardSidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  roleOpen: boolean
  onExpandRole: () => void
  availableRoles: readonly RoleOption[]
  resolvedRole: DashboardRole
  activeRoleLabel: string
  ActiveRoleIcon: RoleOption['icon']
  onRoleChange: (role: DashboardRole) => void
  navSections: SidebarNavSection[]
  activeNav: string
  onNavChange: (label: string) => void
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
  roleOpen,
  onExpandRole,
  availableRoles,
  resolvedRole,
  activeRoleLabel,
  ActiveRoleIcon,
  onRoleChange,
  navSections,
  activeNav,
  onNavChange,
}: DashboardSidebarProps) {
  return (
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
          onClick={onToggleCollapsed}
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
            onClick={onExpandRole}
            className={[
              'flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white text-left text-sm font-medium text-relaive-navy transition-colors hover:bg-[#F8F9FB]',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
            ].join(' ')}
          >
            <ActiveRoleIcon className="shrink-0 text-relaive-primary" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{activeRoleLabel}</span>
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
            <RoleOptionsList
              id="dashboard-role-accordion"
              roles={availableRoles}
              resolvedRole={resolvedRole}
              onSelect={onRoleChange}
            />
          )}
        </div>
      </div>

      <nav className={['flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        {navSections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={sectionIndex > 0 ? (collapsed ? 'mt-2' : 'mt-4') : undefined}
          >
            {!collapsed && (
              <p className="px-3 pb-1.5 pt-1 text-sm font-semibold uppercase tracking-wide text-relaive-gray/60">
                {section.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.label === activeNav
                const Icon = item.icon
                return (
                  <li key={item.label}>
                    <a
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        onNavChange(item.label)
                      }}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={[
                        'flex items-center gap-2.5 text-xs transition-all',
                        collapsed ? 'justify-center px-2 py-2' : 'px-3.5 py-2.5',
                        active
                          ? 'rounded-full bg-gradient-to-r from-[#5D8CAE] to-[#86C5C9] font-medium text-white shadow-[0_4px_14px_rgba(93,140,174,0.35)]'
                          : 'rounded-xl font-medium text-relaive-gray hover:bg-relaive-navy/[0.04] hover:text-relaive-navy',
                      ].join(' ')}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={['shrink-0 border-t border-black/5 py-3', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        <ul className="flex flex-col gap-0.5">
          {BOTTOM_NAV_ITEMS.map((label) => {
            const active = label === activeNav
            return (
              <li key={label}>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    onNavChange(label)
                  }}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  className={[
                    'flex items-center gap-2.5 text-xs transition-all',
                    collapsed ? 'justify-center px-2 py-2' : 'px-3.5 py-2.5',
                    active
                      ? 'rounded-full bg-gradient-to-r from-[#5D8CAE] to-[#86C5C9] font-medium text-white shadow-[0_4px_14px_rgba(93,140,174,0.35)]'
                      : 'rounded-xl font-medium text-relaive-gray hover:bg-relaive-navy/[0.04] hover:text-relaive-navy',
                  ].join(' ')}
                >
                  <NavPlaceholderIcon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
