import { Suspense, lazy, createContext, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import type Lenis from 'lenis'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { ScrollSpy } from './components/ScrollSpy'
import { Spotlight } from './components/Spotlight'
import { SwePortfolio } from './routes/SwePortfolio'
import { SecurityPortfolio } from './routes/SecurityPortfolio'
import { useLenis } from './hooks/useLenis'

const CustomCursor = lazy(() => import('./components/CustomCursor').then((m) => ({ default: m.CustomCursor })))
const Footer = lazy(() => import('./components/Footer').then((m) => ({ default: m.Footer })))

export const LenisContext = createContext<Lenis | null>(null)
export const ActiveSectionContext = createContext<string>('hero')

function AppShell() {
  const lenis = useLenis().current
  const [activeSection, setActiveSection] = useState('hero')
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const isSwe = location.pathname === '/'

  return (
    <LenisContext.Provider value={lenis}>
      <ActiveSectionContext.Provider value={activeSection}>
        <Preloader onDone={() => setLoading(false)} />

        {!loading && (
          <>
            <Suspense fallback={null}>
              <CustomCursor />
            </Suspense>
            <div className="grain" aria-hidden="true" />
            {isSwe && <div className="scanline-swe" aria-hidden="true" />}

            {isSwe && <Nav />}
            {isSwe && <ScrollSpy onChange={setActiveSection} />}
            {isSwe && <Spotlight />}

            <Routes>
              <Route path="/" element={<SwePortfolio />} />
              <Route path="/security" element={<SecurityPortfolio />} />
            </Routes>

            {isSwe && (
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
            )}
          </>
        )}
      </ActiveSectionContext.Provider>
    </LenisContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell />
    </BrowserRouter>
  )
}
