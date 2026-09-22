import { Suspense, lazy, createContext } from 'react'
import type Lenis from 'lenis'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { Work } from './sections/Work'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Footer } from './components/Footer'
import { useLenis } from './hooks/useLenis'

const CustomCursor = lazy(() => import('./components/CustomCursor').then((m) => ({ default: m.CustomCursor })))

export const LenisContext = createContext<Lenis | null>(null)

export default function App() {
  const lenis = useLenis().current

  return (
    <LenisContext.Provider value={lenis}>
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Work />
        <About />
        <Contact />
      </main>
      <Footer />
    </LenisContext.Provider>
  )
}
