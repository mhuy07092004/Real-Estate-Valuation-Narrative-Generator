import { AboutSection } from '../components/landing/about-section'
import { FeaturesSection } from '../components/landing/features-section'
import { MainSection } from '../components/landing/main-section'
import { MapSection } from '../components/landing/map-section'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'
import { LazyMount } from '../components/ui/lazy-mount/lazy-mount'

export default function Landing() {
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
