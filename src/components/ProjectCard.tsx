import { useRef, useEffect } from 'react'
import type { Project } from '../data/projects'

export function ProjectCard({ project, visual: Visual }: { project: Project; visual?: React.ComponentType<{ className?: string }> }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return
    // GSAP animation will be attached here by the parent section
  }, [])

  return (
    <article ref={cardRef} className="project-card">
      <div className="project-card__visual">
        {Visual ? <Visual className="project-card__visual-inner" /> : <div className="project-card__fallback" />}
      </div>
      <div className="project-card__content">
        <div className="project-card__meta">
          <span className="project-card__role">{project.role}</span>
          <span className="project-card__time">{project.timeframe}</span>
        </div>
        <h3 className="project-card__title">{project.name}</h3>
        <p className="project-card__desc">{project.description}</p>
        {project.metrics.length > 0 && (
          <ul className="project-card__metrics">
            {project.metrics.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        <div className="project-card__tags">
          {project.techStack.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>

        <div className="project-card__links">
          {project.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target={l.url.startsWith('http') ? '_blank' : undefined}
              rel={l.url.startsWith('http') ? 'noreferrer' : undefined}
              className="project-card__link"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}
