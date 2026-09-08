import { type ReactNode, useRef } from 'react'

export function InteractiveCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotateX = ((y - cy) / cy) * -3
    const rotateY = ((x - cx) / cx) * 3
    const pctX = (x / rect.width) * 100
    const pctY = (y / rect.height) * 100

    el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`
    el.style.boxShadow = `0 12px 36px rgba(26,32,44,0.12)`
    el.style.setProperty('--glow-x', `${pctX}%`)
    el.style.setProperty('--glow-y', `${pctY}%`)
    el.style.setProperty('--glow-opacity', '1')
  }

  function handleMouseLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    el.style.boxShadow = ''
    el.style.setProperty('--glow-opacity', '0')
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`feature-interactive-card ${className}`}
      style={{
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        willChange: 'transform',
        borderRadius: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background:
            'radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(196,234,232,0.35) 0%, transparent 65%)',
          opacity: 'var(--glow-opacity, 0)',
          transition: 'opacity 0.25s ease',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>
    </div>
  )
}
