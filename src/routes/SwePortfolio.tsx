import { Suspense, lazy } from 'react'
import { Hero } from '../sections/Hero'

const Work = lazy(() => import('../sections/Work').then((m) => ({ default: m.Work })))
const About = lazy(() => import('../sections/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('../sections/Contact').then((m) => ({ default: m.Contact })))

function SectionFallback() {
  return <div className="min-h-[50vh]" />
}

export function SwePortfolio() {
  return (
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
  )
}
