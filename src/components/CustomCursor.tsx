import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    if (window.matchMedia('(pointer: coarse)').matches) {
      cursor.style.display = 'none'
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cursor.style.display = 'none'
      return
    }

    let raf: number
    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const isInteractive = (el: HTMLElement) =>
      el.matches('a, button, [data-cursor-hover], a *, button *')

    const onOver = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && isInteractive(e.target)) {
        cursor.classList.add('hover')
      }
    }

    const onOut = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && isInteractive(e.target)) {
        cursor.classList.remove('hover')
      }
    }

    const animate = () => {
      x += (targetX - x) * 0.15
      y += (targetY - y) * 0.15
      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
      raf = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })

    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={cursorRef} className="cursor-dot" aria-hidden="true" />
}
