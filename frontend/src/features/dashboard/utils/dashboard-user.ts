export function formatShortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'User'
  if (parts.length === 1) return parts[0]
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? ''
  return `${parts[0]} ${lastInitial}`
}

export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}
