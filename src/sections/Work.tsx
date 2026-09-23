import { useEffect, useRef, useMemo, useState, Suspense, lazy } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, archiveProjects, type Project, type ProjectNode } from '../data/projects'

const ProjectVisual = lazy(() => import('../components/ProjectVisual').then((m) => ({ default: m.ProjectVisual })))

gsap.registerPlugin(ScrollTrigger)

const caseStudyLabels = ['Problem', 'Solution', 'Impact']

const NODE_META: Record<
  ProjectNode,
  { label: string; short: string; color: string; desc: string }
> = {
  threat: {
    label: 'THREAT',
    short: 'Find the break',
    color: 'var(--muted)',
    desc: 'See where it breaks before it breaks',
  },
  build: {
    label: 'BUILD',
    short: 'Build the fix',
    color: 'var(--text)',
    desc: 'Turn the finding into something usable',
  },
  ship: {
    label: 'SHIP',
    short: 'Ship it',
    color: 'var(--accent)',
    desc: 'Release something safe enough to adopt',
  },
  impact: {
    label: 'IMPACT',
    short: 'Prove it',
    color: 'var(--accent)',
    desc: 'Show the loop actually closed',
  },
}

function NodeIcon({ node, active }: { node: ProjectNode; active: boolean }) {
  const strokeWidth = 1.5
  const className = `w-full h-full transition-all duration-500 ${active ? 'scale-110' : 'scale-100 opacity-60'}`

  switch (node) {
    case 'threat':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
          <path d="M10 4 L8 11 L15 12 L12 20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'build':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
          <rect x="4" y="8" width="6" height="8" rx="1" />
          <rect x="14" y="8" width="6" height="8" rx="1" />
          <path d="M10 12 L14 12" strokeDasharray={active ? '0' : '2 2'} className="transition-all duration-500" />
        </svg>
      )
    case 'ship':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
          <path d="M12 3 L20 7 V12 C20 17 12 21 12 21 C12 21 4 17 4 12 V7 Z" />
          <path d="M9 12 L11.5 14.5 L16 10" />
        </svg>
      )
    case 'impact':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 6 V9 M12 15 V18 M6 12 H9 M15 12 H18" />
        </svg>
      )
  }
}

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

function ProjectCase({
  project,
  index,
  onActive,
  isActive,
}: {
  project: Project
  index: number
  onActive: (index: number) => void
  isActive: boolean
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const node = project.node ?? 'threat'
  const meta = NODE_META[node]

  useEffect(() => {
    if (!sectionRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => onActive(index),
      onEnterBack: () => onActive(index),
    })

    return () => trigger.kill()
  }, [index, onActive])

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center py-16 md:py-24 relative">
      <div className="max-w-[1600px] mx-auto w-full pl-6 md:pl-12 xl:pl-48 pr-6 md:pr-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* left: meta */}
          <div className="lg:col-span-4">
            <div className="flex items-baseline gap-4 mb-4">
              <span
                className="text-[clamp(3rem,8vw,7rem)] font-bold leading-none"
                style={{ color: meta.color, opacity: 0.18 }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className="mono text-[10px] px-2 py-1 border"
                style={{ color: meta.color, borderColor: meta.color, opacity: 0.6 }}
              >
                {meta.label}
              </span>
            </div>
            <h3 className="text-[clamp(2rem,4vw,4rem)] font-bold leading-[0.95] tracking-tight mb-3">
              {project.name}
            </h3>
            <div className="w-12 h-px mb-6" style={{ backgroundColor: meta.color }} />
            <span className="mono text-xs text-[var(--muted)] block mb-6">{project.role}</span>

            {project.hook && (
              <p className="text-[var(--text)] text-base md:text-lg leading-relaxed max-w-sm mb-8 border-l-2 pl-4" style={{ borderColor: meta.color }}>
                {project.hook}
              </p>
            )}

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
          <div className="lg:col-span-8">
            <div className="mb-8 lg:mb-10">
              <Suspense fallback={<div className="w-full aspect-[16/10] border border-[var(--border)] bg-[var(--surface)]" />}>
                <ProjectVisual id={project.id} node={node} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <CaseStudyItem label={caseStudyLabels[0]} text={project.problem} delay={0.1} />
              <CaseStudyItem label={caseStudyLabels[1]} text={project.solution} delay={0.25} />
              <CaseStudyItem label={caseStudyLabels[2]} text={project.impact} delay={0.4} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LoopSpine({
  projects,
  activeIndex,
  isImpact,
  opacity,
}: {
  projects: Project[]
  activeIndex: number
  isImpact: boolean
  opacity: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  const nodePositions = useMemo(() => {
    const count = projects.length
    const pad = 64
    const available = 520 - pad * 2
    return projects.map((_, i) => pad + (available / (count - 1)) * i)
  }, [projects.length])

  const pathD = useMemo(() => {
    const w = 128
    const leftX = 44
    const rightX = 84
    const topY = nodePositions[0]
    const bottomY = nodePositions[nodePositions.length - 1]

    let d = `M ${leftX} ${topY}`
    nodePositions.slice(1).forEach((y) => {
      d += ` C ${leftX - 24} ${y - 32}, ${leftX + 24} ${y - 32}, ${leftX} ${y}`
    })

    // close the loop: bottom → right side → top return
    d += ` C ${leftX + 48} ${bottomY + 48}, ${rightX + 48} ${bottomY - 24}, ${rightX} ${bottomY - 40}`
    d += ` L ${rightX} ${topY + 40}`
    d += ` C ${rightX - 32} ${topY - 8}, ${leftX + 32} ${topY - 16}, ${leftX} ${topY}`

    return d
  }, [nodePositions])

  useEffect(() => {
    if (!pathRef.current) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pathLength = pathRef.current.getTotalLength()

    gsap.set(pathRef.current, {
      strokeDasharray: pathLength,
      strokeDashoffset: prefersReducedMotion ? 0 : pathLength,
    })

    if (prefersReducedMotion) return

    const tween = gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#work',
        start: 'top center',
        end: 'bottom bottom',
        scrub: 1,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [pathD])

  return (
    <div
      className="hidden xl:block fixed left-0 top-1/2 -translate-y-1/2 w-36 h-[600px] z-10 pointer-events-none"
      style={{ opacity }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 160 600"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* base track */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--border)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* animated accent path */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* nodes */}
        {projects.map((project, i) => {
          const node = project.node ?? 'threat'
          const meta = NODE_META[node]
          const active = i === activeIndex && !isImpact
          const y = nodePositions[i]

          return (
            <g key={project.id} transform={`translate(44, ${y})`}>
              {/* outer ring */}
              <circle
                r="22"
                fill="var(--bg)"
                stroke={active ? meta.color : 'var(--border)'}
                strokeWidth="1"
                className="transition-all duration-500"
                style={{
                  filter: active ? `drop-shadow(0 0 8px ${meta.color})` : 'none',
                }}
              />

              {/* icon group */}
              <g transform="translate(-10, -10)" style={{ color: active ? meta.color : 'var(--muted)' }}>
                <NodeIcon node={node} active={active} />
              </g>

              {/* label */}
              <text
                x="34"
                y="4"
                fill={active ? meta.color : 'var(--muted)'}
                className="mono transition-colors duration-500"
                style={{ fontSize: '10px' }}
              >
                {meta.label}
              </text>
            </g>
          )
        })}

        {/* impact node at archive */}
        <g transform={`translate(44, ${nodePositions[nodePositions.length - 1] + 80})`}>
          <circle
            r="18"
            fill="var(--bg)"
            stroke={isImpact ? 'var(--accent)' : 'var(--border)'}
            strokeWidth="1"
            className="transition-all duration-500"
            style={{
              filter: isImpact ? 'drop-shadow(0 0 8px var(--accent))' : 'none',
            }}
          />
          <g transform="translate(-8, -8)" style={{ color: isImpact ? 'var(--accent)' : 'var(--muted)' }}>
            <NodeIcon node="impact" active={isImpact} />
          </g>
          <text
            x="30"
            y="4"
            fill={isImpact ? 'var(--accent)' : 'var(--muted)'}
            className="mono transition-colors duration-500"
            style={{ fontSize: '10px' }}
          >
            IMPACT
          </text>
        </g>
      </svg>
    </div>
  )
}

export function Work() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isImpact, setIsImpact] = useState(false)
  const [spineOpacity, setSpineOpacity] = useState(0)

  const featured = projects.filter((p) => p.category === 'featured')

  useEffect(() => {
    if (!containerRef.current) return

    const fadeTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 85%',
      end: 'top 55%',
      scrub: true,
      onUpdate: (self) => setSpineOpacity(self.progress),
    })

    const impactTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setIsImpact(self.progress > 0.88),
    })

    return () => {
      fadeTrigger.kill()
      impactTrigger.kill()
    }
  }, [])

  return (
    <div id="work" ref={containerRef} className="relative">
      <LoopSpine projects={featured} activeIndex={activeIndex} isImpact={isImpact} opacity={spineOpacity} />

      <div className="pl-6 md:pl-12 xl:pl-48 pr-6 md:pr-12 pt-24 md:pt-32 pb-12">
        <span className="mono text-[var(--accent)] block mb-4">Selected work</span>
        <h2 className="text-[clamp(2rem,6vw,6rem)] font-bold leading-none tracking-tight">
          Security finds.
          <br />
          <span className="text-[var(--muted)]">Product ships.</span>
        </h2>
        <p className="mt-6 max-w-xl text-[var(--text)]/70 text-base md:text-lg">
          Six projects, one loop: find the break, build the fix, release it, prove it worked.
        </p>
      </div>

      {featured.map((project, index) => (
        <ProjectCase
          key={project.id}
          project={project}
          index={index}
          onActive={setActiveIndex}
          isActive={activeIndex === index}
        />
      ))}

      <div className="pl-6 md:pl-12 xl:pl-48 pr-6 md:pr-12 pt-24 pb-32">
        <span className="mono text-[var(--muted)] block mb-4">Archive</span>
        <h3 className="text-2xl md:text-3xl font-bold mb-12 max-w-2xl">
          The rest of the loop: smaller breaks, faster fixes, shipped proof.
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archiveProjects.map((project) => (
            <a
              key={project.id}
              href={project.links[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-[var(--border)] p-5 hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all duration-300"
              data-cursor-hover
            >
              <div className="flex items-baseline justify-between mb-3">
                <span className="mono text-[10px] text-[var(--muted)]">{project.timeframe}</span>
                {project.links[0] && <span className="mono text-[10px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>}
              </div>
              <h4 className="text-lg font-medium mb-2 group-hover:text-[var(--accent)] transition-colors">
                {project.name}
              </h4>
              <p className="text-sm text-[var(--text)]/60 leading-relaxed mb-4 line-clamp-2">
                {project.solution}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.slice(0, 3).map((tech) => (
                  <span key={tech} className="mono text-[9px] text-[var(--muted)] px-1.5 py-0.5 border border-[var(--border)]">
                    {tech}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
