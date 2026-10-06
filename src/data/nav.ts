export interface NavNode {
  label: string;
  icon?: string;
  href?: string;
  children?: NavNode[];
  end?: boolean;
}

// Sidebar cwd header (rendered purple by Task 3's sidebar).
export const NAV_HEADER = '~/atharv';

// Nerd-Font codepoints (degrade gracefully until the subset font ships NF glyphs).
const FILE = '\u{F0219}';
const INDEX = '\u{F1860}';
const MAIL = '\u{F09EB}';
const GITHUB = '\u{E709}';
const EXTERNAL = '\u{F0337}'; // stand-in for linkedin (subset lacks the brand glyph)
// Folder open/closed \u{E5FE}/\u{E5FF} are handled by the TreeFolder component;
// the config marks folders purely by presence of children.

export const NAV: NavNode[] = [
  { label: 'README', icon: FILE, href: '/' },
  {
    label: 'projects',
    children: [
      { label: 'index', icon: INDEX, href: '/projects/' },
      { label: 'vulnswarm-vex', icon: FILE, href: '/projects/vulnswarm-vex/' },
      { label: 'adversary-lab', icon: FILE, href: '/projects/adversary-lab/' },
      { label: 'prompt-optimiser', icon: FILE, href: '/projects/prompt-optimiser/' },
      { label: 'eleventh-round', icon: FILE, href: '/projects/eleventh-round/' },
      { label: 'crypton', icon: FILE, href: '/projects/crypton/' },
      { label: 'acctomatic', icon: FILE, href: '/projects/acctomatic/' },
    ],
  },
  {
    label: 'archive',
    children: [
      { label: 'index', icon: INDEX, href: '/archive/' },
      { label: 'tinyvulnscanner', icon: FILE, href: '/archive/tinyvulnscanner/' },
      { label: 'eduai', icon: FILE, href: '/archive/eduai/' },
      { label: 'protopaper', icon: FILE, href: '/archive/protopaper/' },
      { label: 'billshield', icon: FILE, href: '/archive/billshield/' },
      { label: 'ai-outfit', icon: FILE, href: '/archive/ai-outfit/' },
      { label: 'blinks', icon: FILE, href: '/archive/blinks/' },
      { label: 'buildora-agent-pipeline', icon: FILE, href: '/archive/buildora-agent-pipeline/' },
      { label: 'android-app', icon: FILE, href: '/archive/android-app/' },
    ],
  },
  { label: 'experience.md', icon: FILE, href: '/experience/' },
  { label: 'about.me', icon: FILE, href: '/about/' },
  { label: 'contact.md', icon: MAIL, href: '/contact/', end: true },
  { label: 'shell', icon: FILE, href: '/shell/' },
  { label: 'resume.md', icon: FILE, href: '/resume/' },
  { label: 'github', icon: GITHUB, href: 'https://github.com/atharv109' },
  { label: 'linkedin', icon: EXTERNAL, href: 'https://www.linkedin.com/in/atharv-mittal/' },
  { label: 'email', icon: MAIL, href: 'mailto:atharvm2005@gmail.com' },
];
