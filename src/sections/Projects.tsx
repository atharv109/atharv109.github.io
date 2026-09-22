import { useScrollReveal } from '../hooks/useScrollReveal'
import { projects, archiveProjects } from '../data/projects'
import { ProjectCard } from '../components/ProjectCard'
import { projectVisuals } from '../components/visuals'
import type { Project } from '../data/projects'

export function Projects() {
  const sectionRef = useScrollReveal<HTMLElement>('.project-card', { stagger: 0.12, y: 50 })

  const groupedArchive = archiveProjects.reduce((acc, p) => {
    const year = p.timeframe.split(' ')[0]
    if (!acc[year]) acc[year] = []
    acc[year].push(p)
    return acc
  }, {} as Record<string, Project[]>)

  return (
    <section id="projects" ref={sectionRef} className="section projects-section">
      <div className="container">
        <p className="section-eyebrow">Selected work</p>
        <h2 className="section-title">Projects that shipped.</h2>

        <div className="featured-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} visual={projectVisuals[p.id]} />
          ))}
        </div>

        <div className="archive-section">
          <h3 className="archive-title">Earlier builds</h3>
          {Object.entries(groupedArchive).map(([year, items]) => (
            <div key={year} className="archive-year-group">
              <span className="archive-year">{year}</span>
              <ul className="archive-list">
                {items.map((p) => (
                  <li key={p.id} className="archive-item">
                    <span className="archive-name">{p.name}</span>
                    <span className="archive-desc">{p.description}</span>
                    <span className="archive-stack">{p.techStack.join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
