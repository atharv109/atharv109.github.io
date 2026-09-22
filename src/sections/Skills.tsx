import { useScrollReveal } from '../hooks/useScrollReveal'

const skills = {
  languages: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Bash', 'Java'],
  frontend: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'HTML/CSS', 'GSAP', 'Three.js'],
  backend: ['Node.js', 'REST APIs', 'PostgreSQL', 'Supabase', 'Redis'],
  security: ['MITRE ATT&CK', 'Sigma', 'Microsoft Defender', 'Wazuh', 'Elastic', 'Active Directory', 'OWASP'],
  ai: ['LLM APIs', 'LangGraph', 'Z3 / SMT', 'PyTorch', 'YOLOv8', 'OpenCV'],
}

const ctfs = [
  { event: 'LACTF 2026', result: 'Solo Top 100 / 1,000+' },
  { event: '0xFun CTF 2026', result: 'Solo Top 110+ / 900+' },
  { event: 'BSides CTF 2026', result: 'Solo competitor' },
  { event: 'Hack The Box', result: 'WingData completed' },
]

export function Skills() {
  const sectionRef = useScrollReveal<HTMLElement>('.skill-group, .ctf-item', { stagger: 0.08, y: 30 })

  return (
    <section id="skills" ref={sectionRef} className="section skills-section">
      <div className="container">
        <p className="section-eyebrow">Skills & Competitions</p>
        <h2 className="section-title">Tools I use.</h2>

        <div className="skills-grid">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category} className="skill-group">
              <h4 className="skill-group__title">{category}</h4>
              <div className="skill-tags">
                {items.map((s) => (
                  <span key={s} className="tag tag-skill">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ctf-strip">
          {ctfs.map((ctf) => (
            <div key={ctf.event} className="ctf-item">
              <span className="ctf-event">{ctf.event}</span>
              <span className="ctf-result">{ctf.result}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
