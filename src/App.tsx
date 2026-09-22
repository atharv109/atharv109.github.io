import { Suspense, lazy, createContext } from 'react'
import type Lenis from 'lenis'
import { Nav } from './components/Nav'
import { ScrollSpy } from './components/ScrollSpy'
import { Hero } from './sections/Hero'
import { useLenis } from './hooks/useLenis'

const CustomCursor = lazy(() => import('./components/CustomCursor').then((m) => ({ default: m.CustomCursor })))
const Work = lazy(() => import('./sections/Work').then((m) => ({ default: m.Work })))
const About = lazy(() => import('./sections/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('./sections/Contact').then((m) => ({ default: m.Contact })))
const Footer = lazy(() => import('./components/Footer').then((m) => ({ default: m.Footer })))

export const LenisContext = createContext<Lenis | null>(null)

function SectionFallback() {
  return <div className="min-h-[50vh]" />
}

export default function App() {
  const lenis = useLenis().current

  return (
    <LenisContext.Provider value={lenis}>
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <ScrollSpy />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}>
          <Work />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <About />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </LenisContext.Provider>
  )
}
