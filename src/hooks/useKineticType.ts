import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function useKineticType(selector: string, delay = 0) {
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const elements = document.querySelectorAll(selector)
    if (!elements.length) return

    triggered.current = true

    elements.forEach((el) => {
      const text = el.textContent || ''
      el.innerHTML = text
        .split('')
        .map((char) => `<span class="kinetic-char" style="display:inline-block;opacity:0;transform:translateY(40px)">${char === ' ' ? ' ' : char}</span>`)
        .join('')

      const chars = el.querySelectorAll('.kinetic-char')
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.03,
        delay,
      })
    })
  }, [selector, delay])
}
