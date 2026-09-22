import { useEffect, useState, useContext } from 'react'
import { LenisContext } from '../App'

export function Nav() {
  const [visible, setVisible] = useState(false)
  const lenis = useContext(LenisContext)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5)
    window.addEventListener('scroll', onScroll, { passive: true })
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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={() => scrollTo('hero')}
        className="mono text-xs text-white/80 hover:text-[var(--accent)] transition-colors"
        data-cursor-hover
      >
        ATHARV MITTAL
      </button>
      <nav className="flex gap-8" aria-label="Primary">
        {['work', 'about', 'contact'].map((item) => (
          <button
            key={item}
            onClick={() => scrollTo(item)}
            className="mono text-xs text-white/60 hover:text-white transition-colors uppercase"
            data-cursor-hover
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  )
}
