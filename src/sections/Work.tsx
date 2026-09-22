import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, archiveProjects, type Project } from '../data/projects'

gsap.registerPlugin(ScrollTrigger)

const caseStudyLabels = ['Problem', 'Solution', 'Impact']

function CaseStudyItem({ label, text, delay }: { label: string; text: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tween = gsap.fromTo(
      ref.current,
      { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay,
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
  }, [delay])

  return (
    <div ref={ref} className="mb-8 md:mb-0">
      <span className="mono text-[10px] text-[var(--accent)] block mb-2">{label}</span>
      <p className="text-[var(--text)]/80 text-sm md:text-base leading-relaxed max-w-md">{text}</p>
    </div>
  )
}

function ProjectCase({ project, index }: { project: Project; index: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !lineRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tween = gsap.fromTo(
      lineRef.current,
      { scaleY: prefersReducedMotion ? 1 : 0, transformOrigin: 'top' },
      {
        scaleY: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
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
    <section
      ref={sectionRef}
      className="min-h-screen flex items-center py-16 md:py-24 relative"
    >
      {/* timeline spine */}
      <div className="absolute left-6 md:left-12 top-0 bottom-0 w-px bg-[var(--border)]">
        <div ref={lineRef} className="absolute inset-0 bg-[var(--accent)]" />
      </div>

      <div className="max-w-[1600px] mx-auto w-full pl-16 md:pl-28 pr-6 md:pr-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* left: meta */}
          <div className="lg:col-span-4">
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-[clamp(3rem,8vw,7rem)] font-bold leading-none text-[var(--accent)]/20">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mono text-xs text-[var(--accent)]">{project.timeframe}</span>
            </div>
            <h3 className="text-[clamp(2rem,4vw,4rem)] font-bold leading-[0.95] tracking-tight mb-3">
              {project.name}
            </h3>
            <span className="mono text-xs text-[var(--muted)] block mb-6">{project.role}</span>

            <div className="flex flex-wrap gap-2 mb-8">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="mono text-[10px] px-2 py-1 border border-[var(--border)] text-[var(--muted)]"
                >
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

          {/* right: case study */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <CaseStudyItem label={caseStudyLabels[0]} text={project.problem} delay={0.1} />
            <CaseStudyItem label={caseStudyLabels[1]} text={project.solution} delay={0.25} />
            <CaseStudyItem label={caseStudyLabels[2]} text={project.impact} delay={0.4} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Work() {
  return (
    <div id="work" className="relative">
      <div className="px-6 md:px-12 pt-24 md:pt-32 pb-12">
        <span className="mono text-[var(--accent)] block mb-4">Selected work</span>
        <h2 className="text-[clamp(2rem,6vw,6rem)] font-bold leading-none tracking-tight"
        >
          Projects that
          <br />
          <span className="text-[var(--muted)]">shipped.</span>
        </h2>
      </div>

      {projects.map((project, index) => (
        <ProjectCase key={project.id} project={project} index={index} />
      ))}

      <div className="px-6 md:px-12 pt-24 pb-32">
        <span className="mono text-[var(--muted)] block mb-12">Archive</span>
        <div className="border-t border-[var(--border)]">
          {archiveProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-[var(--border)] group hover:bg-[var(--surface)] hover:px-4 transition-all duration-300"
              data-cursor-hover
            >
              <div className="flex items-baseline gap-6 md:gap-12">
                <span className="mono text-[var(--muted)] w-16">{project.timeframe}</span>
                <span className="text-xl md:text-2xl font-medium group-hover:text-[var(--accent)] transition-colors">
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
    </div>
  )
}
