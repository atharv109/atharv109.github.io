export function Footer() {
  return (
    <footer className="py-8 px-6 md:px-12 border-t border-[var(--border)]">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="mono text-[10px] text-[var(--muted)]">© {new Date().getFullYear()} Atharv Mittal. Built with React, Vite, Three.js, GSAP.</span>
        <span className="mono text-[10px] text-[var(--muted)]">Available for internships & collaborations</span>
      </div>
    </footer>
  )
}
