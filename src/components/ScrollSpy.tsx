import { useEffect } from 'react'
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

export function ScrollSpy() {
  useEffect(() => {
    const triggers = sections.map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => updateHash(id),
        onEnterBack: () => updateHash(id),
      })
    )

    return () => triggers.forEach((t) => t.kill())
  }, [])

  return null
}
