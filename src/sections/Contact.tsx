import { useScrollReveal } from '../hooks/useScrollReveal'

export function Contact() {
  const sectionRef = useScrollReveal<HTMLElement>('.contact-card', { y: 40 })

  return (
    <section id="contact" ref={sectionRef} className="section contact-section">
      <div className="container">
        <div className="contact-card">
          <p className="contact-eyebrow">Let's build something</p>
          <h2 className="contact-title">Ready to ship.</h2>
          <p className="contact-body">
            I'm looking for full-stack, security engineering, and product
            internships in the US. If you need someone who can move from
            frontend polish to backend logic — and think like an attacker
            while doing it — let's talk.
          </p>

          <div className="contact-links">
            <a href="mailto:atharvm2005@gmail.com" className="contact-link contact-link--primary">
              atharvm2005@gmail.com
            </a>
            <a href="https://www.linkedin.com/in/atharv-mittal/" target="_blank" rel="noreferrer" className="contact-link">
              LinkedIn
            </a>
            <a href="https://github.com/atharv109" target="_blank" rel="noreferrer" className="contact-link">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
