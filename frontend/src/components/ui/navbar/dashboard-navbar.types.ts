import type { ReactElement, SVGProps } from 'react'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'

export type RoleOption = {
  label: string
  value: DashboardRole
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

export type SidebarNavItem = {
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
  /** Optional badge count, rendered by shells that support it (currently v2 only). */
  badge?: number
}

export type SidebarNavSection = {
  title: string
  items: SidebarNavItem[]
}
