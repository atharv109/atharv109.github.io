import { useEffect, useRef } from 'react'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#_\ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function useTextScramble<E extends HTMLElement>(ref: React.RefObject<E | null>) {
  const originalRef = useRef('')
  const frameRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    originalRef.current = el.textContent || ''

    let frame: number
    let counter = 0

    const setText = (text: string) => {
      el.textContent = text
    }

    const scramble = () => {
      const oldText = originalRef.current
      let output = ''
      let complete = 0

      for (let i = 0; i < oldText.length; i++) {
        if (i < counter) {
          output += oldText[i]
          complete++
        } else {
          output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
      }

      setText(output)

      if (complete === oldText.length) {
        cancelAnimationFrame(frame)
        return
      }

      if (counter < oldText.length) {
        counter += 1 / 3
      }

      frame = requestAnimationFrame(scramble)
    }

    const onEnter = () => {
      cancelAnimationFrame(frame)
      counter = 0
      scramble()
    }

    const onLeave = () => {
      cancelAnimationFrame(frame)
      setText(originalRef.current)
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('focus', onEnter)
    el.addEventListener('blur', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('focus', onEnter)
      el.removeEventListener('blur', onLeave)
      el.textContent = originalRef.current
    }
  }, [ref])
}
