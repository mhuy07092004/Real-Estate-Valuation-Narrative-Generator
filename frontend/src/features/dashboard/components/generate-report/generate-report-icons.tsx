import type { ReactNode } from 'react'
import type { PropertyInputMethodIconKey } from '../../../../services/mock-common'

function LocationPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21.5s7-6.14 7-11.5A7 7 0 0 0 5 10c0 5.36 7 11.5 7 11.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5V4.5M12 4.5L8 8.5M12 4.5L16 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PROPERTY_INPUT_ICONS: Record<PropertyInputMethodIconKey, () => ReactNode> = {
  address: LocationPinIcon,
  search: SearchIcon,
  upload: UploadIcon,
}

export function getPropertyInputMethodIcon(key: PropertyInputMethodIconKey): ReactNode {
  return PROPERTY_INPUT_ICONS[key]()
}
