import { useState } from 'react'
import logoIcon from '../../../assets/icon.svg'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import {
  ChevronLeftIcon,
  LogOutIcon,
  NavPlaceholderIcon,
} from '../../../components/ui/navbar/dashboard-navbar-icons'
import type { RoleOption, SidebarNavSection } from '../../../components/ui/navbar/dashboard-navbar.types'
import { preloadDashboardRole } from '../../../pages/dashboard/dashboard-role-lazy'

const ROLE_BADGE: Record<DashboardRole, string> = {
  agent: 'AG',
  valuer: 'PV',
  investor: 'IN',
  buyer: 'BY',
}

const ROLE_COLOR: Record<DashboardRole, string> = {
  agent: '#5193B3',
  valuer: '#62C4C3',
  investor: '#FBD49B',
  buyer: '#5193B3',
}

type V2SidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  availableRoles: readonly RoleOption[]
  resolvedRole: DashboardRole
  activeRoleLabel: string
  onRoleChange: (role: DashboardRole) => void
  navSections: SidebarNavSection[]
  activeNav: string
  onNavChange: (label: string) => void
  onNavigateToSettings: () => void
  onSignOut: () => void
}

export function V2Sidebar({
  collapsed,
  onToggleCollapsed,
  availableRoles,
  resolvedRole,
  activeRoleLabel,
  onRoleChange,
  navSections,
  activeNav,
  onNavChange,
  onNavigateToSettings,
  onSignOut,
}: V2SidebarProps) {
  const [showRolePicker, setShowRolePicker] = useState(false)

  function renderItem(label: string, Icon: RoleOption['icon'], badge?: number) {
    const isActive = activeNav === label
    return (
      <button
        key={label}
        type="button"
        onClick={() => onNavChange(label)}
        className={[
          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-gradient-to-r from-[#5193B3] to-[#62C4C3] text-white shadow-md shadow-[#5193B3]/20'
            : 'text-[#1C2A38]/70 hover:bg-[#EEF3F7] hover:text-[#102132]',
        ].join(' ')}
      >
        <div className="relative shrink-0">
          <Icon className={isActive ? 'text-white' : 'text-[#5193B3]'} />
          {badge ? (
            <span
              className={[
                'absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold',
                isActive ? 'bg-white text-[#5193B3]' : 'bg-[#5193B3] text-white',
              ].join(' ')}
            >
              {badge > 9 ? '9+' : badge}
            </span>
          ) : null}
        </div>

        {!collapsed && (
          <span className={['flex-grow text-left text-sm font-medium', isActive ? 'text-white' : ''].join(' ')}>
            {label}
          </span>
        )}

        {collapsed && (
          <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[#102132] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {label}
          </div>
        )}
      </button>
    )
  }

  return (
    <aside
      className={[
        'fixed bottom-0 left-0 top-0 z-40 hidden flex-col overflow-hidden border-r border-[#5193B3]/10 bg-white transition-[width] duration-200 md:flex',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      ].join(' ')}
    >
      {/* Logo + collapse */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#5193B3]/10 px-4">
        {!collapsed && (
          <a href="/" className="flex min-w-0 items-center gap-2.5">
            <img src={logoIcon} alt="Relaive icon" className="h-7 w-7 shrink-0 rounded-lg" />
            <span className="truncate text-sm font-semibold tracking-tight text-[#102132]">Relaive</span>
          </a>
        )}
        {collapsed && (
          <a href="/" className="mx-auto flex h-7 w-7 items-center justify-center">
            <img src={logoIcon} alt="Relaive icon" className="h-7 w-7 shrink-0 rounded-lg" />
          </a>
        )}
        {!collapsed && (
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapsed}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#1C2A38]/40 transition-colors hover:bg-[#EEF3F7]"
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      {/* Role switcher */}
      <div className="shrink-0 border-b border-[#5193B3]/[0.08] px-3 pb-2 pt-3">
        {collapsed ? (
          <button
            type="button"
            onClick={() => {
              onToggleCollapsed()
              setShowRolePicker(true)
            }}
            className="flex w-full justify-center"
            title={`Switch role (current: ${activeRoleLabel})`}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${ROLE_COLOR[resolvedRole]}, #62C4C3)` }}
            >
              {ROLE_BADGE[resolvedRole]}
            </div>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowRolePicker((v) => !v)}
              aria-expanded={showRolePicker}
              aria-controls="v2-sidebar-role-picker"
              className="group flex w-full items-center gap-2.5 rounded-xl bg-[#EEF3F7]/60 p-2.5 transition-colors hover:bg-[#EEF3F7]"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ROLE_COLOR[resolvedRole]}, #62C4C3)` }}
              >
                {ROLE_BADGE[resolvedRole]}
              </div>
              <div className="min-w-0 flex-grow text-left">
                <p className="truncate text-xs font-semibold text-[#102132]">{activeRoleLabel}</p>
                <p className="truncate text-[10px] text-[#1C2A38]/50">Switch role</p>
              </div>
              <ChevronLeftIcon
                className={[
                  'shrink-0 text-[#1C2A38]/30 transition-transform duration-200',
                  showRolePicker ? '-rotate-90' : 'rotate-90',
                ].join(' ')}
              />
            </button>

            {showRolePicker && (
              <div id="v2-sidebar-role-picker" className="mt-2 grid grid-cols-2 gap-1.5">
                {availableRoles.map((r) => {
                  const isActive = resolvedRole === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        onRoleChange(r.value)
                        setShowRolePicker(false)
                      }}
                      onMouseEnter={() => preloadDashboardRole(r.value)}
                      onFocus={() => preloadDashboardRole(r.value)}
                      className={[
                        'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-150',
                        isActive
                          ? 'border-[#5193B3]/40 bg-gradient-to-br from-[#5193B3]/10 to-[#62C4C3]/10'
                          : 'border-transparent hover:border-[#5193B3]/20 hover:bg-[#EEF3F7]',
                      ].join(' ')}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${ROLE_COLOR[r.value]}, #62C4C3)`
                            : `${ROLE_COLOR[r.value]}60`,
                        }}
                      >
                        {ROLE_BADGE[r.value]}
                      </div>
                      <span
                        className={[
                          'text-center text-[10px] font-medium leading-tight',
                          isActive ? 'text-[#5193B3]' : 'text-[#1C2A38]/60',
                        ].join(' ')}
                      >
                        {r.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex-grow space-y-5 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'none' }}>
        {navSections.map((section) => {
          if (section.items.length === 0) return null
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#1C2A38]/35">
                  {section.title}
                </p>
              )}
              {collapsed && <div className="mb-2 border-t border-[#EEF3F7]" />}
              <div className="space-y-0.5">
                {section.items.map((item) => renderItem(item.label, item.icon, item.badge))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom */}
      <div className="shrink-0 space-y-0.5 border-t border-[#5193B3]/[0.08] px-3 pb-3 pt-2">
        <button
          type="button"
          onClick={onNavigateToSettings}
          className={[
            'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#1C2A38]/70 transition-colors hover:bg-[#EEF3F7] hover:text-[#102132]',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <NavPlaceholderIcon className="shrink-0 text-[#5193B3]" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
          {collapsed && (
            <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[#102132] px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Settings
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className={[
            'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#1C2A38]/70 transition-colors hover:bg-red-50 hover:text-red-500',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <LogOutIcon className="shrink-0 text-[#1C2A38]/40 transition-colors group-hover:text-red-500" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          {collapsed && (
            <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-[#102132] px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Sign Out
            </div>
          )}
        </button>

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            className="mt-1 flex w-full items-center justify-center rounded-xl py-2 text-[#5193B3] transition-colors hover:bg-[#EEF3F7]"
          >
            <ChevronLeftIcon className="rotate-180" />
          </button>
        )}
      </div>
    </aside>
  )
}
