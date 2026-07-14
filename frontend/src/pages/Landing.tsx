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
    if (hash) {
      // Short delay to let lazy-mounted sections render
      const timer = setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
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
