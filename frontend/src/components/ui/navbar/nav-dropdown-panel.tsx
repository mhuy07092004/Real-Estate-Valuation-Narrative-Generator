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
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [open])

  return (
    <div
      className={`absolute inset-x-0 top-full z-40 grid overflow-hidden transition-[grid-template-rows,max-height,opacity] duration-300 ease-out ${
        open
          ? 'grid-rows-[1fr] pointer-events-auto max-h-[calc(100dvh-100%)] opacity-100 border-b border-black/5 bg-white shadow-[0_16px_40px_rgba(26,32,44,0.08)]'
          : 'grid-rows-[0fr] pointer-events-none max-h-0 opacity-0 border-0 bg-transparent shadow-none'
      }`}
      aria-hidden={!open}
    >
      {/* data-lenis-prevent: Lenis root hijacks wheel/touch globally, so nested
          scroll containers must opt out or the page scrolls instead. */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        className={`min-h-0 overflow-y-auto overscroll-contain transition-[opacity,transform] duration-200 ease-out ${
          open ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 -translate-y-1 delay-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
