import { useEffect, useRef, Suspense, lazy } from 'react'
import { gsap } from 'gsap'
import { useKineticType } from '../hooks/useKineticType'

const ParticleField = lazy(() => import('../components/ParticleField').then((m) => ({ default: m.ParticleField })))

export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)

  useKineticType('.hero-title', 0.3)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: 'power2.out' }
    )
    gsap.fromTo(
      taglineRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 1.2, ease: 'power2.out' }
    )
  }, [])

  return (
    <section id="hero" className="relative h-screen w-full flex flex-col justify-end pb-12 px-6 md:px-12 overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--surface)_0%,var(--bg)_70%)]" />}>
        <ParticleField />
      </Suspense>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)] z-10 pointer-events-none" />

      <div className="relative z-20 max-w-[1600px] mx-auto w-full">
        <p ref={subtitleRef} className="mono text-[var(--muted)] mb-4">
          Full-stack engineer · Security-trained · Product-obsessed
        </p>
        <h1 ref={titleRef} className="hero-title text-[clamp(3rem,14vw,12rem)] leading-[0.85] font-bold tracking-tighter text-white mix-blend-difference"
        >
          ATHARV MITTAL
        </h1>
        <div ref={taglineRef} className="mt-8 flex flex-wrap gap-6 text-[var(--muted)] mono text-xs">
          <span>Penn State B.S. Cybersecurity '28</span>
          <span className="text-[var(--accent)]">●</span>
          <span>Security+ certified</span>
          <span className="text-[var(--accent)]">●</span>
          <span>Buildora founder</span>
        </div>
      </div>
    </section>
  )
}
