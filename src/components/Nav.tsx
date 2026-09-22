import { useEffect, useState, useContext } from 'react'
import { LenisContext, ActiveSectionContext } from '../App'

export function Nav() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const lenis = useContext(LenisContext)
  const activeSection = useContext(ActiveSectionContext)

  useEffect(() => {
    const onScroll = () => {
      const scroll = window.scrollY
      setVisible(scroll > window.innerHeight * 0.5)
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? scroll / height : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    if (lenis) {
      lenis.scrollTo(`#${id}`)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 transition-all duration-500 ${
        visible ? 'opacity-100 bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--border)]' : 'opacity-0 pointer-events-none bg-transparent border-b border-transparent'
      }`}
    >
      <div
        className="absolute bottom-0 left-0 h-px bg-[var(--accent)] origin-left"
        style={{ width: '100%', transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      <button
        onClick={() => scrollTo('hero')}
        className={`mono text-xs transition-colors ${activeSection === 'hero' ? 'text-[var(--accent)]' : 'text-white/80 hover:text-[var(--accent)]'}`}
        data-cursor-hover
      >
        ATHARV MITTAL
      </button>
      <nav className="flex gap-8" aria-label="Primary">
        {['work', 'about', 'contact'].map((item) => {
          const isActive = activeSection === item
          return (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className={`mono text-xs transition-colors uppercase relative ${
                isActive ? 'text-[var(--accent)]' : 'text-white/60 hover:text-white'
              }`}
              data-cursor-hover
            >
              {item}
              {isActive && <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)]" />}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
