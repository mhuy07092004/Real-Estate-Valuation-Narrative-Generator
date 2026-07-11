import { AboutSection } from '../components/landing/about-section'
import { FeaturesSection } from '../components/landing/features-section'
import { MainSection } from '../components/landing/main-section'
import { MapSection } from '../components/landing/map-section'
import { Navbar } from '../components/ui/navbar/navbar'
import { Footer } from '../components/ui/footer/footer'

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <MainSection />
      <MapSection />
      <FeaturesSection />
      <AboutSection />
      <Footer />
    </div>
  )
}
