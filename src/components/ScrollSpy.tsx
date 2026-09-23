import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sections = ['hero', 'work', 'about', 'contact']

function updateHash(id: string) {
  const newHash = `#${id}`
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash)
  }
}

function createTriggers(onChange?: (id: string) => void) {
  const triggers: ScrollTrigger[] = []

  sections.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) return

    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          updateHash(id)
          onChange?.(id)
        },
        onEnterBack: () => {
          updateHash(id)
          onChange?.(id)
        },
      })
    )
  })

  return triggers
}

export function ScrollSpy({ onChange }: { onChange?: (id: string) => void }) {
  const trackedRef = useRef<Set<string>>(new Set())
  const triggersRef = useRef<ScrollTrigger[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const setup = () => {
      triggersRef.current.forEach((t) => t.kill())
      triggersRef.current = createTriggers(onChange)
      trackedRef.current = new Set(sections.filter((id) => document.getElementById(id)))
    }

    setup()

    const observer = new MutationObserver(() => {
      const newlyPresent = sections.some((id) => !trackedRef.current.has(id) && document.getElementById(id))
      if (newlyPresent) setup()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      triggersRef.current.forEach((t) => t.kill())
    }
  }, [onChange])

  return null
}
