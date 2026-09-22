import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, archiveProjects, type Project } from '../data/projects'

gsap.registerPlugin(ScrollTrigger)

function ProjectPanel({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tween = gsap.fromTo(
      ref.current,
      { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <div
      ref={ref}
      className="min-w-[85vw] md:min-w-[60vw] h-[70vh] md:h-[75vh] flex flex-col justify-between p-6 md:p-10 border border-[var(--border)] bg-[var(--surface)] relative group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex justify-between items-start">
        <span className="mono text-[var(--muted)]">{String(index + 1).padStart(2, '0')}</span>
        <span className="mono text-[var(--accent)]">{project.timeframe}</span>
      </div>

      <div className="relative z-10">
        <h3 className="text-[clamp(2rem,5vw,5rem)] font-bold leading-[0.95] tracking-tight mb-4 group-hover:text-[var(--accent)] transition-colors duration-300">
          {project.name}
        </h3>
        <p className="text-[var(--muted)] max-w-xl text-sm md:text-base leading-relaxed mb-6">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className="mono text-[10px] px-2 py-1 border border-[var(--border)] text-[var(--muted)]">
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-4">
          {project.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs text-[var(--text)] hover:text-[var(--accent-2)] transition-colors"
              data-cursor-hover
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Work() {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [dragX, setDragX] = useState(0)

  useEffect(() => {
    if (!trackRef.current || !sectionRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const track = trackRef.current
    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const onDown = (e: MouseEvent) => {
      isDown = true
      track.classList.add('cursor-grabbing')
      startX = e.pageX - track.offsetLeft
      scrollLeft = track.scrollLeft
    }

    const onUp = () => {
      isDown = false
      track.classList.remove('cursor-grabbing')
    }

    const onMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - track.offsetLeft
      const walk = (x - startX) * 1.5
      track.scrollLeft = scrollLeft - walk
      setDragX(track.scrollLeft)
    }

    track.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    track.addEventListener('mousemove', onMove)
    track.addEventListener('mouseleave', onUp)

    return () => {
      track.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      track.removeEventListener('mousemove', onMove)
      track.removeEventListener('mouseleave', onUp)
    }
  }, [])

  return (
    <section id="work" ref={sectionRef} className="py-24 md:py-32">
      <div className="px-6 md:px-12 mb-12 flex items-end justify-between">
        <div>
          <span className="mono text-[var(--accent)] block mb-3">Selected work</span>
          <h2 className="text-[clamp(2rem,6vw,6rem)] font-bold leading-none tracking-tight">
            Projects that
            <br />
            <span className="text-[var(--muted)]">shipped.</span>
          </h2>
        </div>
        <span className="mono text-[var(--muted)] hidden md:block">Drag to explore →</span>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto px-6 md:px-12 pb-8 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project, index) => (
          <ProjectPanel key={project.id} project={project} index={index} />
        ))}
      </div>

      <div className="px-6 md:px-12 mt-20">
        <span className="mono text-[var(--muted)] block mb-8">Archive</span>
        <div className="border-t border-[var(--border)]">
          {archiveProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-[var(--border)] group hover:bg-[var(--surface)] hover:px-4 transition-all duration-300"
              data-cursor-hover
            >
              <div className="flex items-baseline gap-6">
                <span className="mono text-[var(--muted)] w-20">{project.timeframe}</span>
                <span className="text-lg md:text-xl font-medium group-hover:text-[var(--accent)] transition-colors">
                  {project.name}
                </span>
              </div>
              <div className="flex gap-3 mt-2 md:mt-0">
                {project.techStack.slice(0, 3).map((tech) => (
                  <span key={tech} className="mono text-[10px] text-[var(--muted)]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
