import { ParticleField } from '../components/ParticleField'

export function Hero() {
  return (
    <header id="top" className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">Atharv Mittal</p>
          <h1 className="hero-headline">
            Full-stack engineer.
            <br />
            <span className="accent">Security-trained.</span>
            <br />
            Product-obsessed.
          </h1>
          <p className="hero-body">
            Penn State junior studying Cybersecurity. I ship end-to-end products
            across React, TypeScript, Node, and Python — with a security lens
            from SOC work, CTFs, and research.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">View projects</a>
            <a href="#contact" className="btn btn-ghost">Contact</a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <ParticleField className="particle-canvas" />
        </div>
      </div>
    </header>
  )
}
