import { useEffect, useMemo, useState, type ReactNode } from 'react'
import heroBg from '../assets/homepage.jpg'
import { Footer } from '../components/ui/footer/footer'
import { Navbar } from '../components/ui/navbar/navbar'

type FadeInProps = {
  delay: number
  duration: number
  children: ReactNode
  className?: string
}

function FadeIn({ delay, duration, children, className }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-opacity ${className ?? ''}`}
      style={{ opacity: isVisible ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

function AnimatedHeading({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const lines = useMemo(() => text.split('\n'), [text])
  const charDelay = 30
  const initialDelay = 200
  const transitionDuration = 500

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), initialDelay)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <h1
      className="mb-4 break-words text-3xl font-normal sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
      style={{ letterSpacing: '-0.04em' }}
    >
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} className="block">
          {Array.from(line).map((char, charIndex) => {
            const delayMs =
              lineIndex * line.length * charDelay + charIndex * charDelay

            return (
              <span
                key={`char-${lineIndex}-${charIndex}`}
                className="inline-block"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-18px)',
                  transitionProperty: 'opacity, transform',
                  transitionDuration: `${transitionDuration}ms`,
                  transitionDelay: `${delayMs}ms`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

export default function Home() {
  return (
    <main className="bg-black font-sans text-white">
      <div className="relative min-h-dvh overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative z-10 flex min-h-dvh flex-col">
          <Navbar />

          <section className="flex flex-1 flex-col justify-center px-[max(1.5rem,env(safe-area-inset-left))] pb-12 pt-8 md:px-12 lg:grid lg:grid-cols-2 lg:items-end lg:px-16 lg:pb-16 lg:pt-0">
            <div className="flex flex-col justify-end">
              <AnimatedHeading text={`Chưa Tày Đâu\n Độ MIXI`} />

              <FadeIn delay={800} duration={1000}>
                <p className="mb-5 max-w-xl text-base text-gray-300 md:text-lg">
                  We back visionaries and craft ventures that define what comes next.
                </p>
              </FadeIn>

              <FadeIn delay={1200} duration={1000}>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="hidden rounded-lg bg-white px-8 py-3 font-medium text-black md:block"
                  >
                    Start a Chat
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-white/15 bg-[#0a0a0a] px-8 py-3 font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-colors hover:border-white/25 hover:bg-white hover:text-black"
                  >
                    Explore Now
                  </button>
                </div>
              </FadeIn>
            </div>

            <div className="mt-8 flex items-end justify-start lg:mt-0 lg:justify-end">
              <FadeIn delay={1400} duration={1000}>
                <div className="hidden rounded-xl border border-white/12 bg-[#0a0a0a] px-6 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] md:block">
                  <p className="text-lg font-light md:text-xl lg:text-2xl">
                    Investing. Building. Advisory.
                  </p>
                </div>
              </FadeIn>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
