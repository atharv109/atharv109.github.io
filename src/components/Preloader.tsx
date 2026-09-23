import { useEffect, useRef, useState } from 'react'

export function Preloader({ onDone }: { onDone?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setPercent(100)
      setDone(true)
      onDone?.()
      return
    }

    const duration = 1800
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / duration)
      setPercent(Math.round(progress * 100))

      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setExiting(true)
      }
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [onDone])

  useEffect(() => {
    if (!lineRef.current) return
    lineRef.current.style.transition = 'transform 1.8s cubic-bezier(0.65, 0, 0.35, 1)'
    lineRef.current.style.transform = 'scaleX(1)'
  }, [])

  useEffect(() => {
    if (!exiting) return
    const timer = setTimeout(() => {
      setDone(true)
      onDone?.()
    }, 850)
    return () => clearTimeout(timer)
  }, [exiting, onDone])

  if (done) return null

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] bg-[var(--bg)] flex flex-col items-center justify-center transition-transform duration-700 ease-in-out ${
        exiting ? '-translate-y-full' : 'translate-y-0'
      }`}
      aria-hidden="true"
    >
      <div className="w-64">
        <div className="flex justify-between items-end mb-2">
          <span className="mono text-xs text-[var(--muted)]">SECURITY × PRODUCT</span>
          <span className="mono text-xs text-[var(--accent)]">{percent}%</span>
        </div>
        <div className="h-px bg-[var(--border)] w-full origin-left">
          <div ref={lineRef} className="h-full bg-[var(--accent)] origin-left" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  )
}
