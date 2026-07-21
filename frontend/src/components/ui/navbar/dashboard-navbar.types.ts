import type { ReactElement, SVGProps } from 'react'
import type { DashboardRole } from '../../../features/dashboard/utils/dashboard-role'

export type RoleOption = {
  label: string
  value: DashboardRole
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}
