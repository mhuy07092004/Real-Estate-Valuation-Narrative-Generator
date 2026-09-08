import { useEffect, useRef, type ReactNode } from 'react'

export function NavDropdownPanel({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      event.stopPropagation()
      const el = scrollRef.current
      if (el) {
        el.scrollTop += event.deltaY
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    return () => window.removeEventListener('wheel', handleWheel, { capture: true })
  }, [open])

  return (
    <div
      className={`absolute inset-x-0 top-full z-40 grid overflow-hidden transition-[grid-template-rows,max-height] duration-300 ease-out ${
        open
          ? 'grid-rows-[1fr] pointer-events-auto max-h-[calc(100dvh-100%)] border-b border-black/5 bg-white shadow-[0_16px_40px_rgba(26,32,44,0.08)]'
          : 'grid-rows-[0fr] pointer-events-none max-h-0 border-0 bg-transparent shadow-none'
      }`}
      aria-hidden={!open}
    >
      <div ref={scrollRef} className="min-h-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}
