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
  visualTheme: string
}

export const projects: Project[] = [
  {
    id: 'eleventh-round',
    name: 'Eleventh Round',
    category: 'featured',
    role: 'Full-Stack Developer',
    timeframe: '2026',
    description:
      'Paid Buildora client engagement building a cinematic career platform for fighters, managers, and promotions. Role-specific dashboards, podcast section, apparel integration, and Awwwards-quality scroll-driven motion.',
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'GSAP', 'Framer Motion', 'Lenis', 'Three.js'],
    metrics: [],
    links: [{ label: 'Live site', url: 'https://eleventh-rnd.com/' }],
    visualTheme: 'Cinematic combat sports',
  },
  {
    id: 'vulnswarm-vex',
    name: 'VulnSwarm-VEX',
    category: 'featured',
    role: 'Research / Lead Developer',
    timeframe: '2026',
    description:
      'Deterministic dependency vulnerability triage. Turns OSV advisories into affected / not_affected / manual_review VEX-style verdicts from application-specific evidence, with Z3 checks and LLMs confined to reviewer notes. Paper under review.',
    techStack: ['Python', 'Z3', 'OSV', 'CVE', 'GHSA', 'PYSEC', 'VEX', 'Static Analysis'],
    metrics: [
      '14 benchmark apps',
      '181 holdout findings',
      '9 of 13 decisive predictions correct',
      '168 explicit deferrals',
      '91.7% agreement',
      '2,705 hydration queries',
    ],
    links: [],
    visualTheme: 'Dependency graph / network nodes',
  },
  {
    id: 'prompt-optimiser',
    name: 'Prompt Optimiser',
    category: 'featured',
    role: 'Solo Developer',
    timeframe: '2026',
    description:
      'Production Chrome/Edge extension that injects an Optimize button into ChatGPT, Claude, and Gemini, scrapes the current prompt plus context, and runs a 6-stage rewrite pipeline through the Groq API before replacing text in-place.',
    techStack: ['JavaScript', 'Chrome Extension APIs', 'Groq API', 'Llama 3.3 70B', 'DOM Injection'],
    metrics: ['6-stage pipeline', '3 AI interfaces'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Chatgpt-prompt-optimiser' }],
    visualTheme: 'Browser extension / prompt transformation',
  },
  {
    id: 'adversary-lab',
    name: 'Adversary Emulation & Detection Lab',
    category: 'featured',
    role: 'Solo Security Researcher',
    timeframe: 'January 2026',
    description:
      'Simulated 10+ MITRE ATT&CK techniques across Discovery, Persistence, Lateral Movement, and Collection on Windows and Linux. Collected telemetry with Wazuh and Elastic and authored 10+ custom Sigma rules mapped to technique IDs.',
    techStack: ['MITRE ATT&CK', 'Sigma', 'Wazuh', 'Elastic', 'Windows', 'Linux'],
    metrics: ['10+ ATT&CK techniques', '10+ Sigma rules'],
    links: [],
    visualTheme: 'Security operations center',
  },
  {
    id: 'acctomatic',
    name: 'Acctomatic',
    category: 'featured',
    role: 'Founder / Full-Stack Developer',
    timeframe: '2026 — In Progress',
    description:
      'Agentic invoice ingestion and bookkeeping workflow automation for accounting firms. Uses local OCR and vision models, flags uncertain items for review, and exports validated data into accounting-system formats.',
    techStack: ['React', 'TypeScript', 'PostgreSQL', 'PaddleOCR-VL 1.6', 'Qwen3-VL-2B', 'n8n'],
    metrics: ['Multi-tenant', 'GREEN/RED state machine'],
    links: [{ label: 'Website', url: 'https://acctomatic.com' }],
    visualTheme: 'Documents / invoices',
  },
  {
    id: 'crypton',
    name: 'Crypton',
    category: 'featured',
    role: 'Co-Founder & CTO',
    timeframe: '2026 — Present',
    description:
      'Zero-trust cryptographic identity platform built around trusted devices. Challenge-response verification, device trust and revocation, WebAuthn/passkey support, and auditable access decisions.',
    techStack: ['Rust', 'Axum', 'Redis', 'PostgreSQL', 'WebAuthn', 'JWT', 'JavaScript'],
    metrics: ['~10 beta users'],
    links: [{ label: 'GitHub', url: 'https://github.com/Aryanvirpsu/Crypton-DI' }],
    visualTheme: 'Cryptographic identity',
  },
]

export const archiveProjects: Project[] = [
  {
    id: 'tinyvulnscanner',
    name: 'TinyVulnScanner',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    description:
      'Multithreaded Python vulnerability scanner with 500+ concurrent ports, banner grabbing, XSS/SQLi checks, and severity-rated HTML/JSON reports.',
    techStack: ['Python'],
    metrics: ['500+ ports', '~70% faster than sequential'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/TinyVulnScanner' }],
    visualTheme: 'Port scan radar',
  },
  {
    id: 'eduai',
    name: 'EDUAI',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    description:
      'AI study scheduler that ingests Canvas LMS data and allocates daily/weekly study time around deadlines, difficulty, and availability.',
    techStack: ['Python', 'Canvas LMS API'],
    metrics: ['5+ courses', '30+ tasks'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/EDUAI' }],
    visualTheme: 'Calendar',
  },
  {
    id: 'protopaper',
    name: 'Proto Paper',
    category: 'archive',
    role: 'Frontend Lead / Team Hackathon',
    timeframe: '2026',
    description:
      'Hackathon tool that turns research PDFs into experiment checklists, seeding plans, pseudocode, and runnable code scaffolds. Led the frontend in Next.js and TypeScript.',
    techStack: ['Next.js', 'TypeScript', 'React', 'Python', 'Groq API'],
    metrics: ['Hours → under 2 minutes'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Protopaper' }],
    visualTheme: 'Research PDFs',
  },
  {
    id: 'billshield',
    name: 'BillShield',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2026',
    description:
      'Healthcare billing dispute and workflow automation product with dashboard UX, dispute-management flows, and AI-assisted patient communication concepts.',
    techStack: ['React', 'Vite', 'Tailwind', 'AI-assisted Communication'],
    metrics: [],
    links: [
      { label: 'GitHub', url: 'https://github.com/atharv109/Billshield' },
      { label: 'Live demo', url: 'https://billshield-mu.vercel.app' },
    ],
    visualTheme: 'Healthcare billing',
  },
  {
    id: 'ai-outfit',
    name: 'AI Outfit Recommender',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    description:
      'ML recommender that suggests outfits from clothing attributes, occasion, season, and preferences, evaluated under sparse-data conditions.',
    techStack: ['Python', 'Machine Learning'],
    metrics: [],
    links: [],
    visualTheme: 'Fashion',
  },
  {
    id: 'blinks',
    name: 'A Voice Made of Blinks',
    category: 'archive',
    role: 'Hackathon Builder',
    timeframe: '2026',
    description:
      'Built at the Claude Life Sciences hackathon. Real-time webcam blink detection drives a switch-scanning communication interface for nonverbal ICU patients.',
    techStack: ['Webcam', 'Blink Detection', 'Switch Scanning'],
    metrics: [],
    links: [],
    visualTheme: 'Medical accessibility',
  },
  {
    id: 'buildora-agent-pipeline',
    name: 'Buildora Agent Pipeline',
    category: 'archive',
    role: 'Founder / Architect',
    timeframe: '2026',
    description:
      '12-agent LangGraph pipeline for lead generation, site building, video pitch creation, and cold outreach, monitored through a real-time Next.js dashboard.',
    techStack: ['LangGraph', 'Stagehand', 'Browserbase', 'Apify', 'Firecrawl', 'Claude API', 'Supabase'],
    metrics: ['12 agents'],
    links: [],
    visualTheme: 'Agent pipeline',
  },
  {
    id: 'android-app',
    name: 'Android App',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: 'High School',
    description: 'Android app built in Java after learning the language in high school computer science.',
    techStack: ['Java', 'Android'],
    metrics: [],
    links: [],
    visualTheme: 'Mobile',
  },
]
