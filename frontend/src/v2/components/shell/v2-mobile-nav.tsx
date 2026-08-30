import { useNavigate } from 'react-router-dom'
import { type DashboardRole } from '../../../features/dashboard/utils/dashboard-role'
import {
  HomeIcon,
  BotIcon,
  DocumentIcon,
  TrendingUpIcon,
} from '../../../components/ui/navbar/dashboard-navbar-icons'

// figma: MobileNavigation.tsx — Home / Insights / Generate (FAB) / Reports / Copilot.
// No Alerts/Notifications icon here; that lives in the topbar Bell, matching the prototype.
// Navigates directly by route rather than through handleNavChange's per-role label
// matching, since these 5 items are the same for every role in the prototype (unlike the
// sidebar, which is role-specific) — see v2-sidebar.tsx / use-dashboard-nav-state.ts for
// the role-specific config this intentionally does NOT reuse.

const REPORT_LABEL: Record<DashboardRole, string> = {
  agent: 'Client Reports',
  valuer: 'Valuation Cases',
  investor: 'Investment Reports',
  buyer: 'Buyer Reports',
}

type V2MobileNavProps = {
  resolvedRole: DashboardRole
  activeNav: string
  onNavChange: (label: string) => void
}

export function V2MobileNav({ resolvedRole, activeNav, onNavChange }: V2MobileNavProps) {
  const navigate = useNavigate()
  const generateLabel = resolvedRole === 'valuer' ? 'New Valuation' : 'Generate Appraisal'
  const reportsLabel = resolvedRole === 'valuer' ? 'Valuation Cases' : REPORT_LABEL[resolvedRole]
  const reportsPath = resolvedRole === 'valuer' ? 'valuation-cases' : 'report'

  const items = [
    { id: 'Dashboard', label: 'Home', icon: HomeIcon, onClick: () => navigate(`/dashboard/${resolvedRole}`) },
    {
      id: 'Market Insights',
      label: 'Insights',
      icon: TrendingUpIcon,
      onClick: () => navigate(`/dashboard/${resolvedRole}/market-intelligence`),
    },
  ]
  const rightItems = [
    { id: reportsLabel, label: 'Reports', icon: DocumentIcon, onClick: () => navigate(`/dashboard/${resolvedRole}/${reportsPath}`) },
    { id: 'AI Copilot', label: 'Copilot', icon: BotIcon, onClick: () => navigate(`/dashboard/${resolvedRole}/copilot`) },
  ]

  const renderItem = (item: (typeof items)[number]) => {
    const Icon = item.icon
    const isActive = activeNav === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavChange(item.id)
          item.onClick()
        }}
        className="relative flex min-w-[64px] flex-col items-center gap-1 px-3 py-2"
      >
        <Icon className={isActive ? 'text-[#5193B3]' : 'text-[#1C2A38]/40'} style={{ width: 22, height: 22 }} />
        <span className={['text-xs', isActive ? 'text-[#5193B3]' : 'text-[#1C2A38]/40'].join(' ')}>
          {item.label}
        </span>
        {isActive && (
          <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-gradient-to-r from-[#5193B3] to-[#62C4C3]" />
        )}
      </button>
    )
  }

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[#5193B3]/10 bg-white/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-4 py-3">
        {items.map(renderItem)}

        <button
          type="button"
          onClick={() => {
            onNavChange(generateLabel)
            navigate(`/dashboard/${resolvedRole}/generate-report`)
          }}
          className="relative -mt-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#5193B3] to-[#62C4C3] shadow-2xl transition-transform active:scale-95">
            <span className="text-2xl leading-none text-white">+</span>
          </div>
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[#5193B3] to-[#62C4C3] opacity-30 blur-xl" />
        </button>

        {rightItems.map(renderItem)}
      </div>
    </nav>
  )
}
