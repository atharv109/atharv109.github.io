import { useScrollReveal } from '../hooks/useScrollReveal'

const experiences = [
  {
    title: 'Cybersecurity Intern',
    org: 'Centrient Pharmaceuticals',
    location: 'Gurugram, India',
    date: 'Oct 2025 – Dec 2025',
    bullets: [
      'Supported SOC operations across 5,000+ endpoints using Microsoft Defender and Mimecast; triaged 200+ daily alerts.',
      'Investigated endpoint, email, identity, and cloud-connected events; escalated confirmed incidents.',
      'Authored detection rules and followed alerts through triage, containment, and response documentation.',
    ],
  },
  {
    title: 'Founder / Full-Stack Developer',
    org: 'Buildora Developers',
    location: 'Remote',
    date: 'Oct 2025 – Present',
    bullets: [
      'Founded a freelance web-development business serving ~50 local-business clients across scoping, delivery, and support.',
      'Shipped full-stack products in React, Next.js, TypeScript, Node.js, Supabase, and Stripe; grew to ~$5,000/mo revenue.',
      'Built the 12-agent Buildora Agent Pipeline and led the Eleventh Round client build.',
    ],
  },
  {
    title: 'Co-Founder & CTO',
    org: 'Crypton',
    location: 'Remote',
    date: '2026 – Present',
    bullets: [
      'Leads technical direction for a zero-trust cryptographic identity platform with ~10 beta users.',
      'Designed device-centric challenge-response auth, trust/revocation flows, and auditable access decisions.',
    ],
  },
  {
    title: 'Research with Prof. Mahanth Gowda',
    org: 'Penn State University',
    location: 'University Park, PA',
    date: 'May 2026 – Present',
    bullets: [
      'Automated schematic/PCB annotation: source parsing, graph-aware connectivity reconstruction, logical-net recovery.',
      'Trained a YOLOv8n component detector and validated net-label matching across multi-sheet schematics.',
      'VulnSwarm-VEX: deterministic dependency vulnerability triage using Z3 and OSV evidence.',
    ],
  },
]

export function Experience() {
  const sectionRef = useScrollReveal<HTMLElement>('.experience-card', { stagger: 0.12, y: 40 })

  return (
    <section id="experience" ref={sectionRef} className="section experience-section">
      <div className="container">
        <p className="section-eyebrow">Experience</p>
        <h2 className="section-title">Where I have worked.</h2>

        <div className="experience-list">
          {experiences.map((exp) => (
            <article key={exp.org} className="experience-card">
              <div className="experience-meta">
                <span className="experience-date">{exp.date}</span>
                <span className="experience-location">{exp.location}</span>
              </div>
              <h3 className="experience-title">{exp.title}</h3>
              <p className="experience-org">{exp.org}</p>
              <ul className="experience-bullets">
                {exp.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
