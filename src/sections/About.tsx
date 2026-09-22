import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const cells = [
  { label: 'Loop', value: "Started by finding what breaks. Now I build the products that don't.", span: true },
  { label: 'Degree', value: "B.S. Cybersecurity\nPenn State '28", span: false },
  { label: 'Cert', value: 'CompTIA Security+', span: false, accent: true },
  { label: 'Current', value: 'Founder @ Buildora\n~50 clients', span: false },
  { label: 'Focus', value: 'Full-stack · Security · AI infra', span: false },
  { label: 'Experience', value: 'SOC intern @ Centrient\nPharma, India', span: false },
  { label: 'Location', value: 'State College, PA\nWilling to relocate', span: false },
]

export function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !gridRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const headline = sectionRef.current.querySelector('.about-headline')
    const bentoCells = gridRef.current.querySelectorAll('.bento-cell')

    const tweens: gsap.core.Tween[] = []

    if (headline) {
      tweens.push(
        gsap.fromTo(
          headline,
          { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: headline,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      )
    }

    tweens.push(
      gsap.fromTo(
        bentoCells,
        { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    )

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill()
        t.kill()
      })
    }
  }, [])

  return (
    <section id="about" ref={sectionRef} className="py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-[1600px] mx-auto">
        <span className="mono text-[var(--accent)] block mb-3">About</span>
        <h2 className="about-headline text-[clamp(2rem,6vw,6rem)] font-bold leading-none tracking-tight mb-16">
          Not two roles.
          <br />
          <span className="text-[var(--muted)]">One loop.</span>
        </h2>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className={`bento-cell p-6 md:p-8 border border-[var(--border)] flex flex-col justify-between min-h-[180px] ${
                cell.span ? 'md:col-span-2' : ''
              } ${cell.accent ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-[var(--surface)]'}`}
            >
              <span className={`mono text-xs ${cell.accent ? 'text-black/60' : 'text-[var(--muted)]'}`}>
                {cell.label}
              </span>
              <p className="text-xl md:text-2xl font-medium leading-tight whitespace-pre-line mt-4">
                {cell.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
