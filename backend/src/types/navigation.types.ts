export type NavAnchorItem = { type: 'anchor'; label: string; sectionId: string }

export type NavRouteItem = { type: 'route'; label: string; href: string }

export type CtaButton =
  | { type: 'route'; label: string; href: string; variant: 'primary' | 'secondary' | 'link' }
  | { type: 'action'; label: string; action: 'start-demo'; variant: 'primary' | 'secondary' | 'link' }

export type NavigationConfig = {
  navItems: NavAnchorItem[]
  routeItems: NavRouteItem[]
  authButtons: NavRouteItem[]
  heroCtas: CtaButton[]
}

export type DemoSession = {
  sessionId: string
  reportId: string
  status: 'processing' | 'ready'
  createdAt: string
  redirectTo: string
}
