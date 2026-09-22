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

export function ScrollSpy({ onChange }: { onChange?: (id: string) => void }) {
  useEffect(() => {
    const triggers = sections.map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
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

    return () => triggers.forEach((t) => t.kill())
  }, [onChange])

  return null
}
