import { useEffect } from 'react'

const OPEN_PLANS_MENU_EVENT = 'relaive:open-plans-menu'

export function useOpenPlansMenu() {
  return () => window.dispatchEvent(new Event(OPEN_PLANS_MENU_EVENT))
}

export function usePlansMenuListener(onOpen: () => void) {
  useEffect(() => {
    window.addEventListener(OPEN_PLANS_MENU_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_PLANS_MENU_EVENT, onOpen)
  }, [onOpen])
}
