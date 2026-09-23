import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hero } from '../sections/Hero'
import { useLenis } from '../hooks/useLenis'

function KeyboardShortcuts() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const lenis = useLenis().current

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return

    const scrollTo = (id: string) => {
      if (lenis) lenis.scrollTo(`#${id}`)
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toLowerCase()

      switch (key) {
        case 't':
          e.preventDefault()
          navigate('/security')
          break
        case 'h':
          e.preventDefault()
          scrollTo('hero')
          break
        case 'w':
          e.preventDefault()
          scrollTo('work')
          break
        case 'a':
          e.preventDefault()
          scrollTo('about')
          break
        case 'c':
          e.preventDefault()
          scrollTo('contact')
          break
        case '?':
        case '/':
          e.preventDefault()
          setVisible((v) => !v)
          break
        case 'escape':
          setVisible(false)
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lenis, navigate])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <span className="mono text-xs text-[var(--accent)]">KEYBOARD SHORTCUTS</span>
          <button onClick={() => setVisible(false)} className="mono text-xs text-[var(--muted)] hover:text-white">ESC</button>
        </div>
        <div className="space-y-3 mono text-xs">
          {[
            { key: 'H', action: 'Scroll to hero' },
            { key: 'W', action: 'Scroll to work' },
            { key: 'A', action: 'Scroll to about' },
            { key: 'C', action: 'Scroll to contact' },
            { key: 'T', action: 'Enter security terminal' },
          ].map((item) => (
            <div key={item.key} className="flex justify-between">
              <span className="text-[var(--text)]">{item.action}</span>
              <span className="px-2 py-0.5 border border-[var(--border)] text-[var(--muted)]">{item.key}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 mono text-[10px] text-[var(--muted)]">Press ? to toggle this menu.</p>
      </div>
    </div>
  )
}

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
      <KeyboardShortcuts />
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
