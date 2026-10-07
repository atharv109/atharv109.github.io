// fs.ts — the virtual filesystem for <site-terminal>. Ported from the legacy
// React route (main:src/routes/SecurityPortfolio.tsx); contents preserved.

export interface FsNode {
  type: 'file' | 'dir';
  content?: string[];
  executable?: boolean;
  children?: Record<string, FsNode>;
}

export const FILE_SYSTEM: Record<string, FsNode> = {
  'skills.txt': {
    type: 'file',
    content: [
      'CORE COMPETENCIES',
      '─────────────────',
      '  Languages      Python, Rust, TypeScript, JavaScript, Java',
      '  Web            React, Vite, Next.js, Tailwind, GSAP, Three.js',
      '  Security       MITRE ATT&CK, Sigma, Wazuh, Elastic, OSV, VEX, WebAuthn',
      '  Infra          PostgreSQL, Redis, n8n, Docker, Linux',
      '  AI/ML          LLM pipelines, Groq, local OCR/vision models',
      '  Method         Find break → Build fix → Ship proof',
    ],
  },
  'README.md': {
    type: 'file',
    content: [
      '# Atharv Mittal — Security Portfolio',
      '',
      'This terminal is a live interface to my offensive-defensive work.',
      'Everything here maps to real projects, certs, and shipped products.',
      '',
      'No redacted secrets. No fake CVEs. Just proof.',
    ],
  },
  'exploits.log': {
    type: 'file',
    content: [
      '[2026-09-10] Simulated 10+ ATT&CK techniques across Windows / Linux.',
      '[2026-08-22] Authored 10+ custom Sigma rules with mapped technique IDs.',
      '[2026-07-15] Triaged 2,705 dependency queries with Z3-backed verdicts.',
      '[2026-06-01] Built device-centric auth replacing passwords + OTPs.',
      '[2025-12-10] SOC internship: detection engineering + incident response.',
    ],
  },
  'contact.sh': {
    type: 'file',
    executable: true,
    content: [
      '#!/bin/sh',
      'echo "atharvm2005@gmail.com"',
      'echo "https://github.com/atharv109"',
      'echo "https://linkedin.com/in/atharv-mittal"',
      '',
      'atharvm2005@gmail.com',
      'https://github.com/atharv109',
      'https://linkedin.com/in/atharv-mittal',
    ],
  },
  projects: {
    type: 'dir',
    children: {
      'vex.log': {
        type: 'file',
        content: [
          '[VulnSwarm-VEX]  Deterministic OSV → VEX pipeline',
          '  status: SHIPPED',
          '  metric: 91.7% agreement across 2,705 queries',
          '  stack : Python, Z3, OSV',
          '',
          '[Adversary Lab]  MITRE technique simulation lab',
          '  status: OPERATIONAL',
          '  metric: 10+ Sigma rules mapped to technique IDs',
          '  stack : Wazuh, Elastic, Sigma',
        ],
      },
      'build.log': {
        type: 'file',
        content: [
          '[Prompt Optimiser]  Cross-platform LLM prompt enhancer',
          '  status: SHIPPED',
          '  metric: 3 major AI interfaces',
          '  stack : JavaScript, Chrome APIs, Groq',
          '',
          '[Eleventh Round]  Combat-sports career platform',
          '  status: PAID CLIENT PRODUCT',
          '  metric: Live public site',
          '  stack : React, Vite, GSAP, Three.js',
          '',
          '[Crypton]  Device-centric identity system',
          '  status: EARLY ACCESS',
          '  metric: 10 beta users',
          '  stack : Rust, Axum, Redis, WebAuthn',
          '',
          '[Acctomatic]  Agentic invoice ingestion',
          '  status: SHIPPED',
          '  metric: GREEN/RED review state machine',
          '  stack : React, PostgreSQL, PaddleOCR, n8n',
        ],
      },
      'README.md': {
        type: 'file',
        content: [
          '# ./projects',
          '',
          'Each log represents a shipped security or product loop.',
          'Read: cat projects/vex.log, cat projects/build.log',
        ],
      },
    },
  },
};

export function directoryAt(fs: Record<string, FsNode>, path: string[]): Record<string, FsNode> | null {
  let current = fs;
  for (const part of path) {
    const node = current[part];
    if (!node || node.type !== 'dir' || !node.children) return null;
    current = node.children;
  }
  return current;
}

export function nodeAt(fs: Record<string, FsNode>, path: string[]): FsNode | null {
  let current = fs;
  for (let i = 0; i < path.length; i++) {
    const node = current[path[i]];
    if (!node) return null;
    if (i === path.length - 1) return node;
    if (node.type !== 'dir' || !node.children) return null;
    current = node.children;
  }
  return null;
}

export function pathString(path: string[]): string {
  return path.length === 0 ? '~' : `~/${path.join('/')}`;
}

export const BANNER = [
  '    _      _____   _   _      _      ____   __     __ ',
  '   / \\    |_   _| | | | |    / \\    |  _ \\  \\ \\   / / ',
  '  / _ \\     | |   | |_| |   / _ \\   | |_) |  \\ \\_/ /  ',
  ' / ___ \\    | |   |  _  |  / ___ \\  |  _ <    |   |   ',
  '/_/   \\_\\   |_|   |_| |_| /_/   \\_\\ |_| \\_\\   |_|_|   ',
  '',
  '    __  __   ___   _____   _____      _      _      ',
  '   |  \\/  | |_ _| |_   _| |_   _|    / \\    | |     ',
  '   | |\\/| |  | |    | |     | |     / _ \\   | |     ',
  '   | |  | |  | |    | |     | |    / ___ \\  | |     ',
  '   |_|  |_| |___|   |_|     |_|   /_/   \\_\\ |____|  ',
  '',
  '         SECURITY ENGINEER  ·  PRODUCT BUILDER',
];

export const BOOT_LINES: { text: string; status: 'ok' | 'info' }[] = [
  { text: 'BIOS DATE 09/22/2026 14:23:01 VER 1.2.7', status: 'ok' },
  { text: 'CPU: Atharv Mittal Core Security-Product Hybrid @ 3.8GHz', status: 'ok' },
  { text: 'Detecting primary storage ... 8192 MB OK', status: 'ok' },
  { text: 'Initializing threat surface ...', status: 'ok' },
  { text: 'Loading kernel modules: wazuh, sigma, elastic, osv, webauthn ...', status: 'ok' },
  { text: 'Mounting /dev/portfolio ...', status: 'ok' },
  { text: 'Secure boot enabled. Root access granted.', status: 'ok' },
  { text: 'Type `help` for available commands.', status: 'info' },
];

export const COMMANDS = [
  'help', 'whoami', 'neofetch', 'ls', 'cd', 'pwd', 'cat', 'run', 'tree', 'scan',
  'status', 'matrix', 'stats', 'history', 'cowsay', 'secret', 'clear', 'reboot', 'exit',
];
