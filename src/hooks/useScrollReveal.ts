import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollReveal<T extends HTMLElement>(
  selector: string,
  options?: {
    y?: number
    stagger?: number
    duration?: number
    start?: string
  }
) {
  const containerRef = useRef<T>(null)
  const triggersRef = useRef<ScrollTrigger[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const elements = container.querySelectorAll(selector)
    if (elements.length === 0) return

    gsap.set(elements, { opacity: 0, y: options?.y ?? 40 })

    const tween = gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: options?.duration ?? 0.8,
      stagger: options?.stagger ?? 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: container,
        start: options?.start ?? 'top 80%',
        toggleActions: 'play none none none',
      },
    })

    if (tween.scrollTrigger) {
      triggersRef.current.push(tween.scrollTrigger)
    }

    return () => {
      triggersRef.current.forEach((st) => st.kill())
      triggersRef.current = []
      tween.kill()
    }
  }, [selector, options?.duration, options?.stagger, options?.start, options?.y])

  return containerRef
}
