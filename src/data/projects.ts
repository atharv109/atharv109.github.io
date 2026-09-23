export type ProjectNode = 'threat' | 'build' | 'ship' | 'impact'

export interface Project {
  id: string
  name: string
  category: 'featured' | 'archive'
  role: string
  timeframe: string
  problem: string
  solution: string
  impact: string
  techStack: string[]
  links: { label: string; url: string }[]
  node?: ProjectNode
  hook?: string
  metric?: string
}

export const projects: Project[] = [
  {
    id: 'vulnswarm-vex',
    name: 'VulnSwarm-VEX',
    category: 'featured',
    role: 'Research / Lead Developer',
    timeframe: '2026',
    node: 'threat',
    hook: 'Most vulnerability alerts are noise. I wanted to know which ones actually matter.',
    metric: '91.7%',
    problem:
      'Dependency vulnerability scanners flood teams with advisories; LLM triage is non-deterministic and hard to audit.',
    solution:
      'Built a deterministic pipeline that turns OSV advisories into VEX-style verdicts using Z3-backed evidence and confined LLM reviewer notes.',
    impact:
      '91.7% agreement with ground truth across 14 benchmark apps and 2,705 hydration queries.',
    techStack: ['Python', 'Z3', 'OSV', 'VEX'],
    links: [],
  },
  {
    id: 'adversary-lab',
    name: 'Adversary Lab',
    category: 'featured',
    role: 'Solo Security Researcher',
    timeframe: '2026',
    node: 'threat',
    hook: 'Security theory is useless if you can’t prove detection works under pressure.',
    metric: '10+',
    problem:
      'Security theory means little without hands-on validation of detection and response workflows.',
    solution:
      'Simulated 10+ MITRE ATT&CK techniques across Windows and Linux, collecting telemetry in Wazuh and Elastic.',
    impact:
      'Authored 10+ custom Sigma rules mapped to technique IDs.',
    techStack: ['MITRE ATT&CK', 'Sigma', 'Wazuh', 'Elastic'],
    links: [],
  },
  {
    id: 'prompt-optimiser',
    name: 'Prompt Optimiser',
    category: 'featured',
    role: 'Solo Developer',
    timeframe: '2026',
    node: 'build',
    hook: 'People copy-paste prompts into three AI chats and hope for the best. I built the optimizer I wished existed.',
    metric: '3 platforms',
    problem:
      'Writing strong prompts across ChatGPT, Claude, and Gemini is repetitive and most users do not optimize their inputs.',
    solution:
      'Created a browser extension that injects an Optimize button and rewrites prompts through a 6-stage Groq pipeline.',
    impact:
      'Works across 3 major AI interfaces; open source on GitHub.',
    techStack: ['JavaScript', 'Chrome APIs', 'Groq'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Chatgpt-prompt-optimiser' }],
  },
  {
    id: 'eleventh-round',
    name: 'Eleventh Round',
    category: 'featured',
    role: 'Full-Stack Developer',
    timeframe: '2026',
    node: 'build',
    hook: 'Combat sports had no platform that treated athletes, managers, and promoters as product stakeholders.',
    metric: 'Live',
    problem:
      'Combat-sports athletes, managers, and promotions need a single cinematic platform for careers, content, and commerce.',
    solution:
      'Built a role-specific career platform with dashboards, podcasts, apparel integration, and scroll-driven motion.',
    impact:
      'Shipped as a paid Buildora client product with a live public site.',
    techStack: ['React', 'Vite', 'GSAP', 'Three.js'],
    links: [{ label: 'Live site', url: 'https://eleventh-rnd.com/' }],
  },
  {
    id: 'crypton',
    name: 'Crypton',
    category: 'featured',
    role: 'Co-Founder & CTO',
    timeframe: '2026',
    node: 'ship',
    hook: 'Passwords and OTPs are the weakest link in every stack. I shipped an identity system that removes them.',
    metric: '10 beta',
    problem:
      'Passwords and OTPs are weak links; identity should bind to trusted devices, not shared secrets.',
    solution:
      'Architected a zero-trust platform with device-centric keys, challenge-response verification, and independent device revocation.',
    impact:
      'Moved into early access with about 10 beta users.',
    techStack: ['Rust', 'Axum', 'Redis', 'WebAuthn'],
    links: [{ label: 'GitHub', url: 'https://github.com/Aryanvirpsu/Crypton-DI' }],
  },
  {
    id: 'acctomatic',
    name: 'Acctomatic',
    category: 'featured',
    role: 'Founder / Full-Stack Developer',
    timeframe: '2026',
    node: 'ship',
    hook: 'Accounting firms still transcribe invoices by hand. I shipped a pipeline that reads, classifies, and flags them.',
    metric: 'GREEN / RED',
    problem:
      'Accounting firms waste hours manually extracting and categorizing invoice data from inconsistent documents.',
    solution:
      'Built an agentic ingestion pipeline using local OCR and vision models with a GREEN/RED state machine for human review.',
    impact:
      'Multi-tenant architecture ready for accounting-firm workflows.',
    techStack: ['React', 'PostgreSQL', 'PaddleOCR', 'n8n'],
    links: [{ label: 'Website', url: 'https://acctomatic.com' }],
  },
]

export const archiveProjects: Project[] = [
  {
    id: 'tinyvulnscanner',
    name: 'TinyVulnScanner',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    problem: 'Sequential port and vulnerability scans are slow for small-scope testing.',
    solution: 'Built a multithreaded Python scanner with banner grabbing and basic XSS/SQLi checks.',
    impact: '500+ concurrent ports; ~70% faster than sequential scanning.',
    techStack: ['Python'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/TinyVulnScanner' }],
  },
  {
    id: 'eduai',
    name: 'EDUAI',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    problem: 'Students struggle to allocate study time across courses and deadlines.',
    solution: 'Built an AI study scheduler that ingests Canvas LMS data and generates weekly plans.',
    impact: 'Used across 5+ courses with 30+ tracked tasks.',
    techStack: ['Python'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/EDUAI' }],
  },
  {
    id: 'protopaper',
    name: 'Proto Paper',
    category: 'archive',
    role: 'Frontend Lead',
    timeframe: '2026',
    problem: 'Research PDFs are dense and hard to turn into executable experiment plans.',
    solution: 'Led the frontend for a hackathon tool that converts PDFs into checklists, seeding plans, and code scaffolds.',
    impact: 'Reduced hours of manual reading to under 2 minutes.',
    techStack: ['Next.js', 'TypeScript', 'Groq'],
    links: [{ label: 'GitHub', url: 'https://github.com/atharv109/Protopaper' }],
  },
  {
    id: 'billshield',
    name: 'BillShield',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2026',
    problem: 'Patients lack tooling to dispute and track confusing healthcare bills.',
    solution: 'Built a dispute workflow product with dashboard UX and AI-assisted patient communication concepts.',
    impact: 'Live demo deployed on Vercel.',
    techStack: ['React', 'Vite', 'Tailwind'],
    links: [
      { label: 'GitHub', url: 'https://github.com/atharv109/Billshield' },
      { label: 'Live demo', url: 'https://billshield-mu.vercel.app' },
    ],
  },
  {
    id: 'ai-outfit',
    name: 'AI Outfit Recommender',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: '2025',
    problem: 'Sparse clothing datasets make personalized outfit recommendations unreliable.',
    solution: 'Built an ML recommender using clothing attributes, occasion, season, and preferences.',
    impact: 'Evaluated under sparse-data conditions.',
    techStack: ['Python', 'Machine Learning'],
    links: [],
  },
  {
    id: 'blinks',
    name: 'A Voice Made of Blinks',
    category: 'archive',
    role: 'Hackathon Builder',
    timeframe: '2026',
    problem: 'Nonverbal ICU patients need a way to communicate without fine motor control.',
    solution: 'Built a real-time webcam blink-detection interface for switch-scanning communication.',
    impact: 'Built at the Claude Life Sciences hackathon.',
    techStack: ['Webcam', 'Blink Detection', 'Switch Scanning'],
    links: [],
  },
  {
    id: 'buildora-agent-pipeline',
    name: 'Buildora Agent Pipeline',
    category: 'archive',
    role: 'Founder / Architect',
    timeframe: '2026',
    problem: 'Lead generation, site building, and outreach are repetitive and slow to scale.',
    solution: 'Architected a 12-agent LangGraph pipeline with a real-time Next.js dashboard.',
    impact: '12 coordinated agents for lead gen, site building, video pitch creation, and cold outreach.',
    techStack: ['LangGraph', 'Stagehand', 'Browserbase', 'Apify', 'Firecrawl', 'Claude API', 'Supabase'],
    links: [],
  },
  {
    id: 'android-app',
    name: 'Android App',
    category: 'archive',
    role: 'Solo Developer',
    timeframe: 'High School',
    problem: 'First hands-on mobile project after learning Java.',
    solution: 'Built an Android app in Java to apply high school computer science concepts.',
    impact: 'First shipped mobile app.',
    techStack: ['Java', 'Android'],
    links: [],
  },
]
