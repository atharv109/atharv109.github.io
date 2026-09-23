import { useEffect, useRef, Suspense, lazy } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const BridgeField = lazy(() => import('../components/BridgeField').then((m) => ({ default: m.BridgeField })))

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const scrollCueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro
        .fromTo(leftRef.current, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 }, 0)
        .fromTo(centerRef.current, { scale: 0.5, opacity: 0, rotation: -45 }, { scale: 1, opacity: 1, rotation: 0, duration: 1 }, 0.15)
        .fromTo(rightRef.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 }, 0)
        .fromTo(nameRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.9)
        .fromTo(metaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 1.1)
        .fromTo(scrollCueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.6)

      gsap.to(contentRef.current, {
        y: -90,
        scale: 0.94,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to(bridgeRef.current, {
        scale: 1.08,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-screen w-full flex items-center justify-center px-6 md:px-12 overflow-hidden"
    >
      <div ref={bridgeRef} className="absolute inset-0 -z-10">
        <Suspense
          fallback={
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--surface)_0%,var(--bg)_70%)]" />
          }
        >
          <BridgeField />
        </Suspense>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-transparent to-[var(--bg)] z-10 pointer-events-none" />

      <div ref={contentRef} className="relative z-20 w-full max-w-[1600px] mx-auto text-center">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-2 lg:gap-6">
          <div ref={leftRef} className="text-center lg:text-right">
            <span className="text-[clamp(2.5rem,12vw,7rem)] lg:text-[clamp(2.5rem,8vw,6rem)] font-bold leading-none tracking-tighter text-[var(--muted)]">
              SECURITY
            </span>
          </div>
          <div ref={centerRef} className="flex justify-center items-center">
            <span className="text-[clamp(3rem,16vw,8rem)] lg:text-[clamp(3rem,10vw,7rem)] font-bold leading-none text-[var(--accent)]">
              ×
            </span>
          </div>
          <div ref={rightRef} className="text-center lg:text-left">
            <span className="text-[clamp(2.5rem,12vw,7rem)] lg:text-[clamp(2.5rem,8vw,6rem)] font-bold leading-none tracking-tighter text-[var(--text)]">
              PRODUCT
            </span>
          </div>
        </div>

        <div ref={nameRef} className="mt-8 md:mt-12">
          <h1 className="text-[clamp(1.25rem,3vw,2.5rem)] font-bold tracking-tight">ATHARV MITTAL</h1>
        </div>

        <div ref={metaRef} className="mt-4 md:mt-6 flex flex-wrap justify-center gap-3 md:gap-8 text-[var(--muted)] mono text-xs">
          <span>Full-stack engineer</span>
          <span className="text-[var(--accent)]">●</span>
          <span>Security-trained</span>
          <span className="text-[var(--accent)]">●</span>
          <span>Product-obsessed</span>
        </div>
      </div>

      <div
        ref={scrollCueRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 mono text-[10px] text-[var(--muted)]"
      >
        <span>SCROLL</span>
        <span className="w-px h-8 bg-[var(--muted)] animate-pulse" />
      </div>
    </section>
  )
}
