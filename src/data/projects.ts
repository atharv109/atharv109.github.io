export interface Project {
  id: string
  name: string
  category: 'featured' | 'archive'
  role: string
  timeframe: string
  description: string
  techStack: string[]
  metrics: string[]
  links: { label: string; url: string }[]
}

export const projects: Project[] = [
  {
    id: 'vulnswarm-vex',
    name: 'VulnSwarm-VEX',
    category: 'featured',
    role: 'Research / Lead Developer',
    timeframe: '2026',
    description:
      'Deterministic dependency vulnerability triage that turns OSV advisories into VEX-style verdicts with Z3-backed evidence.',
    techStack: ['Python', 'Z3', 'OSV', 'VEX'],
    metrics: ['91.7% agreement', '14 apps', '2,705 queries'],
    links: [],
  },
  {
    id: 'eleventh-round',
    name: 'Eleventh Round',
    category: 'featured',
    role: 'Full-Stack Developer',
    timeframe: '2026',
    description:
      'Cinematic career platform for combat sports — role dashboards, podcasts, apparel, and scroll-driven motion.',
    techStack: ['React', 'Vite', 'GSAP', 'Three.js'],
    metrics: ['Paid Buildora client'],
    links: [{ label: 'Live site', url: 'https://eleventh-rnd.com/' }],
  },
  {
    id: 'prompt-optimiser',
    name: 'Prompt Optimiser',
    category: 'featured',
    role: 'Solo Developer',
    timeframe: '2026',
    description:
      'Browser extension that adds an Optimize button to ChatGPT, Claude, and Gemini and rewrites prompts through a 6-stage Groq pipeline.',
    techStack: ['JavaScript', 'Chrome APIs', 'Groq'],
    metrics: ['3 AI interfaces', '6-stage pipeline'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Chatgpt-prompt-optimiser' }],
  },
  {
    id: 'adversary-lab',
    name: 'Adversary Lab',
    category: 'featured',
    role: 'Solo Security Researcher',
    timeframe: '2026',
    description:
      'MITRE ATT&CK emulation lab on Windows and Linux with Wazuh/Elastic telemetry and custom Sigma detections.',
    techStack: ['MITRE ATT&CK', 'Sigma', 'Wazuh', 'Elastic'],
    metrics: ['10+ techniques', '10+ rules'],
    links: [],
  },
  {
    id: 'acctomatic',
    name: 'Acctomatic',
    category: 'featured',
    role: 'Founder / Full-Stack Developer',
    timeframe: '2026',
    description:
      'Agentic invoice ingestion and bookkeeping automation for accounting firms using local OCR and vision models.',
    techStack: ['React', 'PostgreSQL', 'PaddleOCR', 'n8n'],
    metrics: ['Multi-tenant', 'GREEN/RED state machine'],
    links: [{ label: 'Website', url: 'https://acctomatic.com' }],
  },
  {
    id: 'crypton',
    name: 'Crypton',
    category: 'featured',
    role: 'Co-Founder & CTO',
    timeframe: '2026',
    description:
      'Zero-trust cryptographic identity platform around trusted devices, challenge-response, and WebAuthn.',
    techStack: ['Rust', 'Axum', 'Redis', 'WebAuthn'],
    metrics: ['~10 beta users'],
    links: [{ label: 'GitHub', url: 'https://github.com/Aryanvirpsu/Crypton-DI' }],
  },
]

export const archiveProjects: Project[] = [
  {
    id: 'tinyvulnscanner',
    name: 'TinyVulnScanner',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    description: 'Multithreaded Python vulnerability scanner.',
    techStack: ['Python'],
    metrics: ['500+ ports'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/TinyVulnScanner' }],
  },
  {
    id: 'eduai',
    name: 'EDUAI',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    description: 'AI study scheduler ingesting Canvas LMS data.',
    techStack: ['Python'],
    metrics: ['5+ courses'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/EDUAI' }],
  },
  {
    id: 'protopaper',
    name: 'Proto Paper',
    category: 'archive',
    role: 'Frontend Lead',
    timeframe: '2026',
    description: 'Turns research PDFs into experiment checklists and runnable scaffolds.',
    techStack: ['Next.js', 'TypeScript', 'Groq'],
    metrics: ['Hours → 2 min'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Protopaper' }],
  },
  {
    id: 'billshield',
    name: 'BillShield',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2026',
    description: 'Healthcare billing dispute workflow automation.',
    techStack: ['React', 'Vite', 'Tailwind'],
    metrics: [],
    links: [
      { label: 'GitHub', url: 'https://github.com/atharv109/Billshield' },
      { label: 'Live demo', url: 'https://billshield-mu.vercel.app' },
    ],
  },
]
