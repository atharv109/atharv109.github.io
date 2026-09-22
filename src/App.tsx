import { Suspense, lazy } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { Work } from './sections/Work'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Footer } from './components/Footer'

const CustomCursor = lazy(() => import('./components/CustomCursor').then((m) => ({ default: m.CustomCursor })))

export default function App() {
  return (
    <>
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
    </>
  )
}
