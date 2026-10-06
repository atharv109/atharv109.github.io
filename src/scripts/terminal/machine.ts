// machine.ts — pure command interpreter for <site-terminal>. No DOM, no
// storage: input + state in, lines + new state out. The custom element
// (site-terminal.ts) is a thin renderer around this.

import {
  FILE_SYSTEM, directoryAt, nodeAt, pathString, COMMANDS,
} from './fs';
import type { FsNode } from './fs';

export interface TermState {
  cwd: string[];
  history: string[];
  matrixOn: boolean;
}

export type Tone = 'out' | 'err' | 'sys' | 'muted' | 'accent';

export interface TermLine {
  text: string;
  tone: Tone;
  scramble?: boolean;
}

export interface TermResult {
  lines: TermLine[];
  state: TermState;
  clear?: boolean;
  navigate?: string;
  reboot?: boolean;
  /** Element-side side effects the machine only names. */
  matrix?: boolean;
  glitch?: boolean;
  trophy?: string;
  /** Element reveals lines one per tick (scan). */
  stagger?: boolean;
}

const out = (text: string, tone: Tone = 'out', scramble = false): TermLine => ({
  text,
  tone,
  scramble,
});

function lsLines(cwd: string[]): TermLine[] {
  const dir = directoryAt(FILE_SYSTEM, cwd);
  if (!dir) return [out('ls: cannot access current directory', 'err')];
  return Object.entries(dir)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, node]) => {
      const size =
        node.type === 'dir'
          ? '4096'
          : String((node.content?.join('\n').length ?? 0) + 512).padStart(4);
      const perms = node.type === 'dir' ? 'drwxr-xr-x' : node.executable ? '-rwxr-xr-x' : '-rw-r--r--';
      const suffix = node.type === 'dir' ? '/' : node.executable ? '*' : '';
      return out(`${perms}  atharv  staff  ${size}  Sep 22 00:00  ${name}${suffix}`);
    });
}

function treeLines(path: string[], prefix = ''): TermLine[] {
  const dir = directoryAt(FILE_SYSTEM, path);
  if (!dir) return [out('tree: directory not found', 'err')];
  const lines: TermLine[] = [];
  const entries = Object.entries(dir).sort(([a], [b]) => a.localeCompare(b));
  entries.forEach(([name, node], i) => {
    const isLast = i === entries.length - 1;
    lines.push(out(`${prefix}${isLast ? '└── ' : '├── '}${name}${node.type === 'dir' ? '/' : ''}`));
    if (node.type === 'dir' && node.children) {
      lines.push(...treeLines([...path, name], prefix + (isLast ? '    ' : '│   ')));
    }
  });
  return lines;
}

function scanLines(): TermLine[] {
  const ports = [22, 80, 443, 8080, 8443, 3306, 5432, 6379, 9200, 9300];
  const service = (p: number) =>
    ({ 22: 'ssh', 80: 'http', 443: 'https', 8080: 'http-alt', 8443: 'https-alt', 3306: 'mysql', 5432: 'postgresql', 6379: 'redis' })[p] ?? 'wazuh';
  const state = (p: number) => (p === 443 || p === 9200 ? 'OPEN' : 'FILTERED');
  return [
    out('Starting portfolio surface scan ...', 'sys'),
    ...ports.map((p) =>
      out(`  port ${String(p).padStart(5)}/${service(p).padEnd(12)} ${state(p)}`, state(p) === 'OPEN' ? 'accent' : 'muted'),
    ),
    out('Scan complete. 2 open ports, 8 filtered. Risk: LOW.', 'sys'),
  ];
}

const NEOFETCH = [
  '                 .___                 ',
  '               __| _/___________       ',
  '              / __ |/ __ \\_  __\\      ',
  '             / /_/ \\  ___/|  | \\/      ',
  '             \\____ | \\___  >__|        ',
  '                   \\/    \\/            ',
  '    atharv@security                    ',
  '    ──────────────────────────────────  ',
  '    OS        Security-Product Hybrid   ',
  '    Kernel    wazuh-sigma-elastic-osv   ',
  '    Uptime    2y 11mo                   ',
  '    Shell     bash-mindset              ',
  '    WM         Find → Build → Ship      ',
  '    Theme     meadow-dark / iosevka     ',
  '    CPU        Security+ trained        ',
  '    Memory     8192 MB curiosity        ',
  '    ████████░░ 8/10 shipped proof        ',
];

const HELP = [
  'Available commands:',
  '  whoami              Show operator identity',
  '  neofetch            Show stylized system info',
  '  ls                  List directory contents',
  '  cd <dir> | cd ..    Change directory',
  '  pwd                 Print working directory',
  '  cat <file>          Read a file',
  '  run <script>        Execute a script',
  '  tree                Show filesystem tree',
  '  scan                Run a mock surface scan',
  '  status              Show system status',
  '  matrix              Toggle matrix rain overlay',
  '  stats               Project loop statistics',
  '  history             Command history',
  '  cowsay              Classic security wisdom',
  '  secret              Hidden message',
  '  clear               Clear terminal',
  '  reboot              Reboot terminal',
  '  exit                Return to README',
  '',
  "Try: cat skills.txt, neofetch, scan, stats, cowsay, run contact.sh",
];

const STATUS = [
  'SYSTEM STATUS',
  '─────────────',
  '  Uptime       2y 11mo (since first CVE obsession)',
  '  CPU          Security-Product Hybrid @ 3.8GHz  [████████░░] 80%',
  '  Memory       8192 MB allocated to curiosity     [█████████░] 90%',
  '  Threat level LOW — no unpatched ego detected',
  '  Integrity    VERIFIED — shipped proof available',
  '',
  'Active modules: wazuh, sigma, elastic, osv, webauthn, astro, vite',
];

const WHOAMI = [
  'atharv.mittal',
  '',
  "B.S. Cybersecurity, Penn State '28",
  'CompTIA Security+',
  'SOC Intern @ Centrient Pharma',
  'Founder @ Buildora (~50 clients)',
  '',
  'Operates between offensive discovery and defensive product.',
];

const COWSAY = [
  ' _______________________________________',
  '/ The only secure system is one that    \\',
  '\\ ships. Everything else is theory.     /',
  ' ---------------------------------------',
  '        \\   ^__^',
  '         \\  (oo)\\_______',
  '            (__)\\       )\\/\\',
  '                ||----w |',
  '                ||     ||',
];

const SECRET = [
  '┌───────────────────────────────────────┐',
  '│  EASTER EGG UNLOCKED                  │',
  '│  "The only secure system is one that  │',
  '│   ships. Everything else is theory."  │',
  '└───────────────────────────────────────┘',
];

function statsLines(): TermLine[] {
  const featured = 6;
  const archive = 8;
  const total = featured + archive;
  const bar = (n: number, label: string) => {
    const filled = Math.round((n / total) * 24);
    return out(`  ${label.padEnd(10)} ${'█'.repeat(filled)}${'░'.repeat(24 - filled)} ${n}`);
  };
  return [
    out('PORTFOLIO STATS', 'sys'),
    out('───────────────'),
    bar(featured, 'featured'),
    bar(archive, 'archive'),
    out(''),
    out('  threat     ████████████░░░░░░░░░░░░ 2'),
    out('  build      ████████████░░░░░░░░░░░░ 2'),
    out('  ship       ████████████░░░░░░░░░░░░ 2'),
    out('  impact     ████████████████████████ 9'),
  ];
}

function resolvePath(cwd: string[], target: string): string[] {
  const parts = target.split('/').filter(Boolean);
  if (target === '~') return [];
  if (target.startsWith('~/')) return parts.slice(1); // strip the '~' base — home IS the fs root
  return [...cwd, ...parts];
}

export function createMachine() {
  function exec(raw: string, state: TermState): TermResult {
    const cmd = raw.trim();
    const next: TermState = { ...state, cwd: [...state.cwd], history: [...state.history] };
    if (!cmd) return { lines: [], state: next };

    next.history.push(cmd);
    const echo: TermLine = out(cmd, 'sys'); // rendered with prompt by the element

    const lower = cmd.toLowerCase();
    const [name, ...args] = lower.split(/\s+/);
    const rest = lower.slice(name.length).trim();
    const done = (lines: TermLine[], extra: Partial<TermResult> = {}): TermResult => ({
      lines: [echo, ...lines],
      state: next,
      ...extra,
    });

    if (lower === 'clear' || lower === 'cls') return { lines: [], state: next, clear: true };
    if (lower === 'exit') return done([out('Exiting security shell...', 'err')], { navigate: '/' });
    if (lower === 'reboot') return done([out('Reboot sequence initiated...', 'err')], { reboot: true });
    if (lower === 'matrix') {
      next.matrixOn = true;
      return done([out('Matrix rain overlay enabled for 3s.', 'accent')], { matrix: true });
    }
    if (lower === 'scan') return done(scanLines(), { stagger: true });
    if (lower === 'status') return done(STATUS.map((t) => out(t)));
    if (lower === 'stats') return done(statsLines());
    if (lower === 'tree') return done(treeLines(next.cwd));
    if (lower === 'pwd') return done([out(pathString(next.cwd))]);
    if (lower === 'neofetch') return done(NEOFETCH.map((t) => out(t)));
    if (lower === 'whoami') return done(WHOAMI.map((t) => out(t)));
    if (lower === 'cowsay') return done(COWSAY.map((t) => out(t)));
    if (lower === 'secret') return done(SECRET.map((t) => out(t, 'accent')), { trophy: 'secret' });
    if (lower === 'help') return done(HELP.map((t) => out(t)));
    if (lower === 'history') {
      return done(
        next.history.length
          ? next.history.map((h, i) => out(`${String(i + 1).padStart(3)}  ${h}`))
          : [out('No commands in history.')],
      );
    }
    if (lower === 'ls') return done(lsLines(next.cwd));

    if (lower === 'cd' || lower === 'cd ~') {
      next.cwd = [];
      return done([]);
    }
    if (name === 'cd' && args[0]) {
      const target = args[0];
      if (target === '..') {
        next.cwd = next.cwd.slice(0, -1);
        return done([]);
      }
      const resolved = resolvePath(state.cwd, target);
      const node = nodeAt(FILE_SYSTEM, resolved);
      if (node?.type === 'dir' && node.children) {
        next.cwd = resolved;
        return done([]);
      }
      return done([out(`cd: no such directory: ${target}`, 'err')], { glitch: true });
    }

    if ((name === 'cat' || name === 'run') && rest) {
      const resolved = resolvePath(state.cwd, rest);
      const node = nodeAt(FILE_SYSTEM, resolved);
      if (name === 'cat') {
        if (node?.type === 'file' && node.content) {
          return done(node.content.map((t) => out(t, 'out', true)));
        }
        if (node?.type === 'dir') return done([out(`cat: ${rest}: Is a directory`, 'err')]);
        return done([out(`cat: ${rest}: No such file or directory`, 'err')], { glitch: true });
      }
      // run
      if (node?.type === 'file' && node.executable && node.content) {
        return done(node.content.map((t) => out(t, 'out', true)));
      }
      if (node?.type === 'file') {
        return done([out(`run: ${rest}: permission denied (not executable)`, 'err')]);
      }
      return done([out(`run: ${rest}: No such script`, 'err')], { glitch: true });
    }

    return done([out(`bash: ${name}: command not found. Try 'help'.`, 'err')], { glitch: true });
  }

  return { exec };
}

/** Tab-completion helper (pure; used by the element). */
export function complete(input: string, cwd: string[]): { value?: string; options?: string[] } {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    const matches = COMMANDS.filter((c) => c.startsWith(parts[0] || ''));
    if (matches.length === 1) return { value: matches[0] };
    if (matches.length > 1) return { options: matches };
    return {};
  }
  const cmd = parts[0];
  if (cmd !== 'cat' && cmd !== 'run' && cmd !== 'cd') return {};
  const prefix = parts[parts.length - 1] || '';
  const dir = directoryAt(FILE_SYSTEM, cwd);
  if (!dir) return {};
  const matches = Object.keys(dir).filter((n) => n.startsWith(prefix));
  if (matches.length === 1) return { value: `${cmd} ${matches[0]}` };
  if (matches.length > 1) return { options: matches };
  return {};
}
