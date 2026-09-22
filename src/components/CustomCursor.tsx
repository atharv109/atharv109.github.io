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

    const animate = () => {
      x += (targetX - x) * 0.15
      y += (targetY - y) * 0.15
      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
      raf = requestAnimationFrame(animate)
    }

    const onEnter = () => cursor.classList.add('hover')
    const onLeave = () => cursor.classList.remove('hover')

    window.addEventListener('mousemove', onMove)
    const interactive = document.querySelectorAll('a, button, [data-cursor-hover]')
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      interactive.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return <div ref={cursorRef} className="cursor-dot" aria-hidden="true" />
}
