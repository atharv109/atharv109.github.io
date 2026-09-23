import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#_\ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function useIdleHint(delay = 12000) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return showHint
}

function DecryptedLine({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion) return

    let frame = 0
    let counter = 0
    const final = text

    const scramble = () => {
      let output = ''
      let complete = 0
      for (let i = 0; i < final.length; i++) {
        if (i < counter) {
          output += final[i]
          complete++
        } else {
          output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
      }
      el.textContent = output
      if (complete === final.length) {
        cancelAnimationFrame(frame)
        return
      }
      counter += 1 / 2
      frame = requestAnimationFrame(scramble)
    }

    scramble()
    return () => cancelAnimationFrame(frame)
  }, [text, prefersReducedMotion])

  return <div ref={ref} className={className}>{prefersReducedMotion ? text : ''}</div>
}

type Entry = {
  type: 'in' | 'out' | 'system'
  lines: string[]
  error?: boolean
  accent?: 'green' | 'red' | 'cyan' | 'muted'
  scramble?: boolean
}

type FsNode = {
  type: 'file' | 'dir'
  content?: string[]
  executable?: boolean
  children?: Record<string, FsNode>
}

const FILE_SYSTEM: Record<string, FsNode> = {
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
}

const BOOT_LINES = [
  { text: 'BIOS DATE 09/22/2026 14:23:01 VER 1.2.7', status: 'ok' },
  { text: 'CPU: Atharv Mittal Core Security-Product Hybrid @ 3.8GHz', status: 'ok' },
  { text: 'Detecting primary storage ... 8192 MB OK', status: 'ok' },
  { text: 'Initializing threat surface ...', status: 'ok' },
  { text: 'Loading kernel modules: wazuh, sigma, elastic, osv, webauthn ...', status: 'ok' },
  { text: 'Mounting /dev/portfolio ...', status: 'ok' },
  { text: 'Secure boot enabled. Root access granted.', status: 'ok' },
  { text: 'Type `help` for available commands.', status: 'info' },
]

const BANNER = [
  '    ___   __  __ ___ _      _   ___   _____ ___  ___ ',
  '   /   \\ |  \\/  |_ _| |    /_\\ |   \\ |_   _/ _ \\| _ \\\\',
  '   | - | || |\\/| || || |__ / _ \\| |) |  | || (_) |   /',
  '   |_|_|||_|  |_|___|____/_/ \\\\___/   |_| \\___/|_|_\\\\',
  '',
  '         SECURITY ENGINEER  ·  PRODUCT BUILDER',
]

function directoryAt(path: string[]): Record<string, FsNode> | null {
  let current: Record<string, FsNode> = FILE_SYSTEM
  for (const part of path) {
    const node = current[part]
    if (!node || node.type !== 'dir' || !node.children) return null
    current = node.children
  }
  return current
}

function nodeAt(path: string[]): FsNode | null {
  let current: Record<string, FsNode> = FILE_SYSTEM
  for (let i = 0; i < path.length; i++) {
    const part = path[i]
    const node = current[part]
    if (!node) return null
    if (i === path.length - 1) return node
    if (node.type !== 'dir' || !node.children) return null
    current = node.children
  }
  return null
}

function pathString(path: string[]) {
  return path.length === 0 ? '~' : `~/${path.join('/')}`
}

function lsLines(path: string[]): string[] {
  const dir = directoryAt(path)
  if (!dir) return ['ls: cannot access current directory']
  const entries = Object.entries(dir).sort(([a], [b]) => a.localeCompare(b))
  const lines = entries.map(([name, node]) => {
    const size = node.type === 'dir' ? '4096' : String((node.content?.join('\n').length ?? 0) + 512).padStart(4)
    const perms = node.type === 'dir' ? 'drwxr-xr-x' : node.executable ? '-rwxr-xr-x' : '-rw-r--r--'
    const type = node.type === 'dir' ? '/' : node.executable ? '*' : ''
    return `${perms}  atharv  staff  ${size}  Sep 22 00:00  ${name}${type}`
  })
  return lines
}

function treeLines(path: string[], prefix = ''): string[] {
  const dir = directoryAt(path)
  if (!dir) return ['tree: directory not found']
  const entries = Object.entries(dir).sort(([a], [b]) => a.localeCompare(b))
  const lines: string[] = []
  entries.forEach(([name, node], i) => {
    const isLast = i === entries.length - 1
    const branch = isLast ? '└── ' : '├── '
    lines.push(`${prefix}${branch}${name}${node.type === 'dir' ? '/' : ''}`)
    if (node.type === 'dir' && node.children) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ')
      lines.push(...treeLines([...path, name], childPrefix))
    }
  })
  return lines
}

function scanPorts() {
  const ports = [22, 80, 443, 8080, 8443, 3306, 5432, 6379, 9200, 9300]
  return ports.map((p) => ({
    port: p,
    state: p === 443 || p === 9200 ? 'OPEN' : 'FILTERED',
    service:
      p === 22
        ? 'ssh'
        : p === 80
          ? 'http'
          : p === 443
            ? 'https'
            : p === 8080
              ? 'http-alt'
              : p === 8443
                ? 'https-alt'
                : p === 3306
                  ? 'mysql'
                  : p === 5432
                    ? 'postgresql'
                    : p === 6379
                      ? 'redis'
                      : 'wazuh',
  }))
}

function statusLines(): string[] {
  return [
    'SYSTEM STATUS',
    '─────────────',
    '  Uptime       2y 11mo (since first CVE obsession)',
    '  CPU          Security-Product Hybrid @ 3.8GHz  [████████░░] 80%',
    '  Memory       8192 MB allocated to curiosity     [█████████░] 90%',
    '  Threat level LOW — no unpatched ego detected',
    '  Integrity    VERIFIED — shipped proof available',
    '',
    'Active modules: wazuh, sigma, elastic, osv, webauthn, react, gsap, three',
  ]
}

export function SecurityPortfolio() {
  const navigate = useNavigate()
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const matrixRef = useRef<HTMLCanvasElement>(null)

  const [bootIndex, setBootIndex] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [history, setHistory] = useState<Entry[]>([])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [cwd, setCwd] = useState<string[]>([])
  const [glitch, setGlitch] = useState(false)
  const [matrix, setMatrix] = useState(false)
  const showHint = useIdleHint()

  useEffect(() => {
    document.title = 'atharv.mittal // secure shell'
  }, [])

  const prompt = useMemo(() => `atharv@security:${pathString(cwd)}$`, [cwd])

  useEffect(() => {
    if (bootIndex < BOOT_LINES.length) {
      const delay = 120 + Math.random() * 280
      const timer = setTimeout(() => setBootIndex((i) => i + 1), delay)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setBootDone(true), 500)
    return () => clearTimeout(timer)
  }, [bootIndex])

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'auto' })
  }, [history, bootIndex])

  useEffect(() => {
    if (!bootDone) return
    inputRef.current?.focus()
  }, [bootDone])

  useEffect(() => {
    const onClick = () => inputRef.current?.focus()
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (!matrix || !matrixRef.current) return
    const canvas = matrixRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const cols = Math.floor(window.innerWidth / 14)
    const drops = new Array(cols).fill(0)
    const chars = '01アイウエオカキクケコサシスセソタチツテト0123456789ATHARVSEC'

    let raf: number
    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.12)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.fillStyle = '#00ff41'
      ctx.font = '12px JetBrains Mono, monospace'

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * 14
        const y = drops[i] * 16
        ctx.fillText(char, x, y)
        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const timer = setTimeout(() => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      setMatrix(false)
    }, 3200)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('resize', resize)
    }
  }, [matrix])

  const appendOutput = useCallback((entry: Entry) => {
    setHistory((prev) => [...prev, entry])
  }, [])

  const execute = useCallback(
    (raw: string) => {
      const cmd = raw.trim()
      if (!cmd) return

      setCommandHistory((prev) => [...prev, cmd])
      setHistoryIndex(-1)
      setInput('')

      appendOutput({ type: 'in', lines: [cmd] })

      const lower = cmd.toLowerCase()
      const [name, ...args] = lower.split(/\s+/)
      const rest = lower.slice(name.length).trim()

      if (lower === 'clear' || lower === 'cls') {
        setHistory([])
        return
      }

      if (lower === 'exit') {
        appendOutput({ type: 'system', lines: ['Exiting security shell...'], accent: 'red' })
        setTimeout(() => navigate('/'), 900)
        return
      }

      if (lower === 'reboot') {
        appendOutput({ type: 'system', lines: ['Reboot sequence initiated...'], accent: 'red' })
        setTimeout(() => {
          setHistory([])
          setBootDone(false)
          setBootIndex(0)
          setCwd([])
        }, 700)
        return
      }

      if (lower === 'matrix') {
        setMatrix(true)
        appendOutput({ type: 'system', lines: ['Matrix rain overlay enabled for 3s.'], accent: 'green' })
        return
      }

      if (lower === 'scan') {
        const ports = scanPorts()
        appendOutput({ type: 'system', lines: ['Starting portfolio surface scan ...'], accent: 'green' })
        ports.forEach((s, i) => {
          setTimeout(() => {
            appendOutput({
              type: 'out',
              lines: [`  port ${String(s.port).padStart(5)}/${s.service.padEnd(12)} ${s.state}`],
              accent: s.state === 'OPEN' ? 'green' : 'muted',
            })
          }, 100 * (i + 1))
        })
        setTimeout(() => {
          appendOutput({
            type: 'system',
            lines: ['Scan complete. 2 open ports, 8 filtered. Risk: LOW.'],
            accent: 'green',
          })
        }, 100 * (ports.length + 2))
        return
      }

      if (lower === 'status') {
        appendOutput({ type: 'out', lines: statusLines() })
        return
      }

      if (lower === 'tree') {
        const lines = treeLines(cwd)
        appendOutput({ type: 'out', lines })
        return
      }

      if (lower === 'pwd') {
        appendOutput({ type: 'out', lines: [pathString(cwd)] })
        return
      }

      if (lower === 'neofetch') {
        appendOutput({
          type: 'out',
          lines: [
            '                 .___                 ',
            '               __| _/___________       ',
            '              / __ |/ __ \_  __\\      ',
            '             / /_/ \\  ___/|  | \/      ',
            '             \\____ | \\___  >__|        ',
            '                   \\/    \\/            ',
            '    atharv@security                    ',
            '    ────────────────────────────────── ',
            '    OS        Security-Product Hybrid   ',
            '    Kernel    wazuh-sigma-elastic-osv   ',
            '    Uptime    2y 11mo                   ',
            '    Shell     bash-mindset              ',
            '    WM         Find → Build → Ship      ',
            '    Theme     threat-orange / product-bw',
            '    CPU        Security+ trained         ',
            '    Memory     8192 MB curiosity        ',
            '    ████████░░ 8/10 shipped proof        ',
          ],
        })
        return
      }

      if (lower === 'whoami') {
        appendOutput({
          type: 'out',
          lines: [
            'atharv.mittal',
            '',
            'B.S. Cybersecurity, Penn State \'28',
            'CompTIA Security+',
            'SOC Intern @ Centrient Pharma',
            'Founder @ Buildora (~50 clients)',
            '',
            'Operates between offensive discovery and defensive product.',
          ],
        })
        return
      }

      if (lower === 'ls') {
        appendOutput({ type: 'out', lines: lsLines(cwd) })
        return
      }

      if (lower === 'cd' || lower === 'cd ~') {
        setCwd([])
        return
      }

      if (name === 'cd' && args[0]) {
        const target = args[0]
        if (target === '..') {
          setCwd((prev) => prev.slice(0, -1))
          return
        }
        const dir = directoryAt(cwd)
        const node = dir?.[target]
        if (node?.type === 'dir' && node.children) {
          setCwd((prev) => [...prev, target])
        } else {
          appendOutput({ type: 'out', lines: [`cd: no such directory: ${target}`], error: true })
          setGlitch(true)
          setTimeout(() => setGlitch(false), 140)
        }
        return
      }

      if (name === 'cat' && rest) {
        const targetPath = rest.split('/').filter(Boolean)
        let lookupPath: string[]
        let fileName: string

        if (targetPath.length === 1) {
          fileName = targetPath[0]
          lookupPath = cwd
        } else {
          fileName = targetPath[targetPath.length - 1]
          const base = targetPath.slice(0, -1)
          lookupPath = base[0] === '~' ? base.slice(1) : base
        }

        const dir = directoryAt(lookupPath)
        const node = dir?.[fileName]
        if (node?.type === 'file' && node.content) {
          appendOutput({ type: 'out', lines: node.content, scramble: true })
        } else if (node?.type === 'dir') {
          appendOutput({ type: 'out', lines: [`cat: ${rest}: Is a directory`] })
        } else {
          appendOutput({ type: 'out', lines: [`cat: ${rest}: No such file or directory`] })
          setGlitch(true)
          setTimeout(() => setGlitch(false), 140)
        }
        return
      }

      if (name === 'run' && rest) {
        const targetPath = rest.split('/').filter(Boolean)
        const fileName = targetPath[targetPath.length - 1]
        const base = targetPath.slice(0, -1)
        const lookupPath = base.length && base[0] === '~' ? base.slice(1) : base.length ? base : cwd

        const dir = directoryAt(lookupPath)
        const node = dir?.[fileName]
        if (node?.type === 'file' && node.executable && node.content) {
          appendOutput({ type: 'out', lines: node.content, scramble: true })
        } else if (node?.type === 'file') {
          appendOutput({ type: 'out', lines: [`run: ${rest}: permission denied (not executable)`] })
        } else {
          appendOutput({ type: 'out', lines: [`run: ${rest}: No such script`] })
        }
        return
      }

      if (lower === 'history') {
        appendOutput({
          type: 'out',
          lines: commandHistory.length
            ? commandHistory.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`)
            : ['No commands in history.'],
        })
        return
      }

      if (lower === 'cowsay') {
        appendOutput({
          type: 'out',
          lines: [
            ' _______________________________________',
            '/ The only secure system is one that    \\',
            '\\ ships. Everything else is theory.     /',
            ' ---------------------------------------',
            '        \\   ^__^',
            '         \\  (oo)\\_______',
            '            (__)\\       )\\/\\',
            '                ||----w |',
            '                ||     ||',
          ],
        })
        return
      }

      if (lower === 'secret') {
        appendOutput({
          type: 'out',
          lines: [
            '╔═══════════════════════════════════════╗',
            '║  EASTER EGG UNLOCKED                  ║',
            '║  "The only secure system is one that   ║',
            '║   ships. Everything else is theory."   ║',
            '╚═══════════════════════════════════════╝',
          ],
        })
        return
      }

      if (lower === 'help') {
        appendOutput({
          type: 'out',
          lines: [
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
            '  history             Command history',
            '  cowsay              Classic security wisdom',
            '  secret              Hidden message',
            '  clear               Clear terminal',
            '  reboot              Reboot terminal',
            '  exit                Return to SWE portfolio',
            '',
            'Try: cat skills.txt, neofetch, scan, cowsay, run contact.sh',
          ],
        })
        return
      }

      appendOutput({ type: 'out', lines: [`bash: ${name}: command not found. Try 'help'.`], error: true })
      setGlitch(true)
      setTimeout(() => setGlitch(false), 180)
    },
    [appendOutput, commandHistory, cwd, navigate]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(input)
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const parts = input.split(/\s+/)
      if (parts.length <= 1) {
        const prefix = parts[0] || ''
        const matches = ['help', 'whoami', 'ls', 'cd', 'pwd', 'cat', 'run', 'clear', 'exit', 'scan', 'status', 'matrix', 'tree', 'history', 'secret', 'reboot'].filter((c) =>
          c.startsWith(prefix)
        )
        if (matches.length === 1) {
          setInput(matches[0])
        } else if (matches.length > 1) {
          appendOutput({ type: 'out', lines: [matches.join('  ')] })
        }
      } else {
        const cmd = parts[0]
        if (cmd === 'cat' || cmd === 'run' || cmd === 'cd') {
          const prefix = parts[parts.length - 1] || ''
          const dir = directoryAt(cwd)
          if (!dir) return
          const matches = Object.keys(dir).filter((name) => name.startsWith(prefix))
          if (matches.length === 1) {
            setInput(`${cmd} ${matches[0]}`)
          } else if (matches.length > 1) {
            appendOutput({ type: 'out', lines: [matches.join('  ')] })
          }
        }
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length === 0) return
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex])
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return
      const nextIndex = Math.min(commandHistory.length - 1, historyIndex + 1)
      if (nextIndex === historyIndex) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(nextIndex)
        setInput(commandHistory[nextIndex])
      }
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setHistory([])
    }
  }

  useEffect(() => {
    if (!glitch || !terminalRef.current) return
    const el = terminalRef.current
    gsap.fromTo(
      el,
      { skewX: 0, x: 0 },
      {
        skewX: 2,
        x: -2,
        duration: 0.05,
        repeat: 3,
        yoyo: true,
        ease: 'steps(1)',
        onComplete: () => gsap.set(el, { skewX: 0, x: 0 }),
      }
    )
  }, [glitch])

  const lineColor = (entry: Entry) => {
    if (entry.error) return 'text-[#ff4d00]'
    if (entry.accent === 'red') return 'text-[#ff4d00]'
    if (entry.accent === 'cyan') return 'text-[#00e5ff]'
    if (entry.accent === 'muted') return 'text-[#888888]'
    if (entry.type === 'system') return 'text-[#00ff41]'
    return 'text-[#00ff41]/90'
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-[#00ff41] font-mono text-sm overflow-hidden crt-subtle">
      {matrix && (
        <canvas
          ref={matrixRef}
          className="fixed inset-0 z-50 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* scanlines + vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />
      <div className="pointer-events-none absolute inset-0 z-10 vignette" />

      {/* header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[#00ff41]/20 bg-[#050505]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#ff4d00] terminal-dot" />
          <span className="uppercase tracking-widest text-xs">SECURE SHELL — atharv.mittal</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs uppercase tracking-widest hover:text-[#ff4d00] transition-colors"
        >
          [ EXIT ]
        </button>
      </header>

      {/* terminal */}
      <div
        ref={terminalRef}
        className="absolute inset-0 top-12 bottom-0 overflow-y-auto p-4 md:p-6 pb-24"
        style={{
          textShadow: '0 0 4px rgba(0,255,65,0.5), 0 0 10px rgba(0,255,65,0.25)',
        }}
      >
        {/* ASCII banner */}
        <pre className="mb-6 text-[#00ff41]/80 text-[10px] md:text-xs leading-none">
          {BANNER.join('\n')}
        </pre>

        {/* boot lines */}
        {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
          <div key={i} className="mb-1 text-[#00ff41]/70">
            <span className="text-[#ff4d00] mr-2">[</span>
            {line.text}
            <span className={`ml-2 ${line.status === 'ok' ? 'text-[#00ff41]' : 'text-[#00e5ff]'}`}>
              {line.status === 'ok' ? 'OK' : 'INFO'}
            </span>
            <span className="text-[#ff4d00] ml-2">]</span>
          </div>
        ))}

        {/* history */}
        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            {entry.type === 'in' ? (
              <div className="flex items-center">
                <span className="text-[#ff4d00] mr-2">{prompt}</span>
                <span>{entry.lines[0]}</span>
              </div>
            ) : (
              <div className={`whitespace-pre-wrap ${lineColor(entry)}`}>
                {entry.lines.map((line, j) =>
                  entry.scramble ? (
                    <DecryptedLine key={j} text={line} className={lineColor(entry)} />
                  ) : (
                    <div key={j}>{line}</div>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        {/* input line */}
        {bootDone && (
          <div className="flex items-center">
            <span className="text-[#ff4d00] mr-2">{prompt}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="bg-transparent outline-none border-none text-[#00ff41] w-full caret-transparent"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Terminal input"
            />
            <span className="inline-block w-2 h-4 bg-[#00ff41] terminal-cursor ml-1" />
          </div>
        )}

        {bootDone && showHint && history.length === 0 && (
          <div className="mt-4 text-[#00e5ff]/70 text-xs mono">
            Hint: try `help`, `neofetch`, or `cat skills.txt`
          </div>
        )}
      </div>
    </div>
  )
}
