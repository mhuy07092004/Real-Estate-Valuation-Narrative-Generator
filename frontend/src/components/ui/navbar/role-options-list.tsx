import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import { preloadDashboardRole } from '../../../pages/dashboard/dashboard-role-lazy'
import type { RoleOption } from './dashboard-navbar.types'

type RoleOptionsListProps = {
  id: string
  roles: readonly RoleOption[]
  resolvedRole: DashboardRole
  onSelect: (role: DashboardRole) => void
}

export function RoleOptionsList({ id, roles, resolvedRole, onSelect }: RoleOptionsListProps) {
  return (
    <ul id={id} role="listbox" className="flex flex-col gap-0.5 rounded-xl border border-black/10 bg-white p-1.5">
      {roles.map(({ label, value, icon: Icon }) => {
        const selected = value === resolvedRole
        return (
          <li key={value}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(value)}
              onMouseEnter={() => preloadDashboardRole(value)}
              onFocus={() => preloadDashboardRole(value)}
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
  )
}
