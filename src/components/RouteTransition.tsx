import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

interface RouteTransitionProps {
  children: React.ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.style.opacity = '1'
      return
    }

    el.style.opacity = '0'
    el.style.transform = 'translateY(18px) scale(0.985)'

    const animation = el.animate(
      [
        { opacity: 0, transform: 'translateY(18px) scale(0.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      {
        duration: 550,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    )

    return () => animation.cancel()
  }, [location.pathname])

  return (
    <div ref={ref} className="opacity-0">
      {children}
    </div>
  )
}
