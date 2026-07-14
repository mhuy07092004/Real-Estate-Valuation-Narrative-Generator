import { useEffect } from 'react'
import { AboutSection } from '../components/landing/about-section'
import { FeaturesSection } from '../components/landing/features-section'
import { MainSection } from '../components/landing/main-section'
import { MapSection } from '../components/landing/map-section'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'
import { LazyMount } from '../components/ui/lazy-mount/lazy-mount'

export default function Landing() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return

    // Try to find the element directly first
    const el = document.getElementById(hash)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    // Element not in DOM yet — LazyMount hasn't rendered it.
    // Scroll to the very bottom to force all lazy sections to mount,
    // then scroll to the target after they appear.
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

    let attempts = 0
    const maxAttempts = 10
    const poll = setInterval(() => {
      attempts++
      const target = document.getElementById(hash)
      if (target) {
        clearInterval(poll)
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (attempts >= maxAttempts) {
        clearInterval(poll)
      }
    }, 150)

    return () => clearInterval(poll)
  }, [])

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <MainSection />
      <LazyMount minHeight={640}>
        <MapSection />
      </LazyMount>
      <LazyMount minHeight={720}>
        <FeaturesSection />
      </LazyMount>
      <LazyMount minHeight={520}>
        <AboutSection />
      </LazyMount>
      <LazyMount minHeight={480}>
        <Footer />
      </LazyMount>
    </div>
  )
}
