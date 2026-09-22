import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMagneticButton } from '../hooks/useMagneticButton'

gsap.registerPlugin(ScrollTrigger)

export function Contact() {
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  useMagneticButton(ctaRef, 0.25)

  useEffect(() => {
    if (!sectionRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tween = gsap.fromTo(
      sectionRef.current.querySelectorAll('.contact-reveal'),
      { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <section id="contact" ref={sectionRef} className="py-32 md:py-48 px-6 md:px-12">
      <div className="max-w-[1600px] mx-auto">
        <span className="contact-reveal mono text-[var(--accent)] block mb-4">Contact</span>
        <h2 className="contact-reveal text-[clamp(3rem,12vw,11rem)] font-bold leading-[0.9] tracking-tighter mb-12"
        >
          LET'S BUILD
          <br />
          <span className="text-[var(--muted)]">SOMETHING.</span>
        </h2>

        <a
          ref={ctaRef}
          href="mailto:atharvm2005@gmail.com"
          className="contact-reveal inline-block px-10 py-5 border border-[var(--accent)] text-[var(--accent)] mono text-sm hover:bg-[var(--accent)] hover:text-black transition-colors duration-300"
          data-cursor-hover
        >
          atharvm2005@gmail.com
        </a>

        <div className="contact-reveal flex flex-wrap gap-8 mt-16 text-[var(--muted)] mono text-xs"
        >
          <a href="https://github.com/atharv109" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" data-cursor-hover>GitHub</a>
          <a href="https://www.linkedin.com/in/atharv-mittal/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" data-cursor-hover>LinkedIn</a>
          <span>State College, PA</span>
        </div>
      </div>
    </section>
  )
}
