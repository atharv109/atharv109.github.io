import { Suspense, lazy, useEffect, useRef } from 'react'
import { Hero } from '../sections/Hero'
import { useLenis } from '../hooks/useLenis'

const Work = lazy(() => import('../sections/Work').then((m) => ({ default: m.Work })))
const About = lazy(() => import('../sections/About').then((m) => ({ default: m.About })))
const Contact = lazy(() => import('../sections/Contact').then((m) => ({ default: m.Contact })))

function SectionFallback() {
  return <div className="min-h-[50vh]" />
}

function VelocitySkew({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const lenis = useLenis().current

  useEffect(() => {
    if (!lenis || !ref.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const el = ref.current
    let raf: number
    let velocity = 0

    const onScroll = ({ velocity: v }: { velocity: number }) => {
      velocity = v
    }

    const animate = () => {
      const skew = Math.max(-2, Math.min(2, velocity * 0.04))
      el.style.transform = `skewY(${skew}deg)`
      raf = requestAnimationFrame(animate)
    }

    lenis.on('scroll', onScroll)
    raf = requestAnimationFrame(animate)

    return () => {
      lenis.off('scroll', onScroll)
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [lenis])

  return (
    <main ref={ref} className="will-change-transform origin-center">
      {children}
    </main>
  )
}

export function SwePortfolio() {
  useEffect(() => {
    document.title = 'Atharv Mittal — Full-Stack Engineer'
  }, [])

  return (
    <VelocitySkew>
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
    </VelocitySkew>
  )
}
