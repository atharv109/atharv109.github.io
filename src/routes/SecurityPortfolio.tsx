import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'

const BOOT_LINES = [
  'BIOS DATE 09/22/2026 14:23:01 VER 1.2.7',
  'CPU: Atharv Mittal Core Security-Product Hybrid @ 3.8GHz',
  'Detecting primary storage ... 8192 MB OK',
  'Initializing threat surface ...',
  'Loading kernel modules: wazuh, sigma, elastic, osv, webauthn ...',
  'Mounting /dev/portfolio ...',
  'Secure boot enabled. Root access granted to authorized operators.',
  'Type `help` for available commands.',
]

const COMMANDS: Record<
  string,
  { output: string[] | ((args: string[]) => string[]); color?: string }
> = {
  help: {
    output: [
      'Available commands:',
      '  whoami       Show operator identity',
      '  ls           List directory contents',
      '  cat <file>   Read a file',
      '  run <script> Execute a script',
      '  clear        Clear terminal',
      '  exit         Return to SWE portfolio',
      '',
      'Try: cat skills.txt, cat projects/vex.log, run contact.sh',
    ],
  },
  whoami: {
    output: [
      'atharv.mittal',
      '',
      'B.S. Cybersecurity, Penn State \u002728',
      'CompTIA Security+',
      'SOC Intern @ Centrient Pharma',
      'Founder @ Buildora (~50 clients)',
      '',
      'Operates between offensive discovery and defensive product.',
    ],
  },
  ls: {
    output: [
      'drwxr-xr-x  atharv  staff   4096  Sep 22 00:00  .',
      'drwxr-xr-x  atharv  staff   4096  Sep 22 00:00  ..',
      '-rw-r--r--  atharv  staff   2.1K  Sep 22 00:00  skills.txt',
      'drwxr-xr-x  atharv  staff   4096  Sep 22 00:00  projects/',
      '-rw-r--r--  atharv  staff   4.8K  Sep 22 00:00  exploits.log',
      '-rwxr-xr-x  atharv  staff   1.2K  Sep 22 00:00  contact.sh',
      '-rw-r--r--  atharv  staff    512  Sep 22 00:00  README.md',
    ],
  },
  'cat skills.txt': {
    output: [
      'CORE COMPETENCIES',
      '─────────────────',
      '  Languages      Python, Rust, TypeScript, JavaScript, Java',
      '  Web            React, Vite, Next.js, Tailwind, GSAP, Three.js',
      '  Security       MITRE ATT\u0026CK, Sigma, Wazuh, Elastic, OSV, VEX, WebAuthn',
      '  Infra          PostgreSQL, Redis, n8n, Docker, Linux',
      '  AI/ML          LLM pipelines, Groq, local OCR/vision models',
      '  Method         Find break → Build fix → Ship proof',
    ],
  },
  'cat projects/vex.log': {
    output: [
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
  'cat projects/build.log': {
    output: [
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
  'cat exploits.log': {
    output: [
      '[2026-09-10] Simulated 10+ ATT\u0026CK techniques across Windows / Linux.',
      '[2026-08-22] Authored 10+ custom Sigma rules with mapped technique IDs.',
      '[2026-07-15] Triaged 2,705 dependency queries with Z3-backed verdicts.',
      '[2026-06-01] Built device-centric auth replacing passwords + OTPs.',
      '[2025-12-10] SOC internship: detection engineering + incident response.',
    ],
  },
  'cat README.md': {
    output: [
      '# Atharv Mittal — Security Portfolio',
      '',
      'This terminal is a live interface to my offensive-defensive work.',
      'Everything here maps to real projects, certs, and shipped products.',
      '',
      'No redacted secrets. No fake CVEs. Just proof.',
    ],
  },
  'run contact.sh': {
    output: [
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
  exit: {
    output: [],
  },
  clear: {
    output: [],
  },
}

function resolveCommand(input: string): {
  command: string
  output: string[]
  error?: boolean
} {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return { command: '', output: [] }

  if (trimmed === 'clear') return { command: 'clear', output: [] }
  if (trimmed === 'exit') return { command: 'exit', output: [] }

  const match = COMMANDS[trimmed]
  if (!match) {
    return {
      command: trimmed,
      output: [`bash: ${trimmed.split(' ')[0]}: command not found. Try 'help'.`],
      error: true,
    }
  }

  return {
    command: trimmed,
    output: typeof match.output === 'function' ? match.output([]) : match.output,
  }
}

export function SecurityPortfolio() {
  const navigate = useNavigate()
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [bootIndex, setBootIndex] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [history, setHistory] = useState<{ type: 'in' | 'out'; lines: string[]; error?: boolean }[]>([])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    if (bootIndex < BOOT_LINES.length) {
      const delay = 120 + Math.random() * 300
      const timer = setTimeout(() => setBootIndex((i) => i + 1), delay)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setBootDone(true), 400)
    return () => clearTimeout(timer)
  }, [bootIndex])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history, bootIndex])

  const execute = useCallback(
    (cmd: string) => {
      console.log('execute called', cmd)
      if (!cmd.trim()) return

      setCommandHistory((prev) => [...prev, cmd])
      setHistoryIndex(-1)
      setInput('')

      if (cmd.trim().toLowerCase() === 'clear') {
        setHistory([])
        return
      }

      if (cmd.trim().toLowerCase() === 'exit') {
        setHistory((prev) => [...prev, { type: 'in', lines: [cmd] }, { type: 'out', lines: ['Exiting security shell...'] }])
        setTimeout(() => navigate('/'), 800)
        return
      }

      const resolved = resolveCommand(cmd)

      if (resolved.error) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 120)
      }

      setHistory((prev) => [
        ...prev,
        { type: 'in', lines: [cmd] },
        { type: 'out', lines: resolved.output, error: resolved.error },
      ])
    },
    [navigate]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(input)
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
  }

  useEffect(() => {
    if (bootDone) inputRef.current?.focus()
  }, [bootDone])

  useEffect(() => {
    const onClick = () => inputRef.current?.focus()
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      gsap.fromTo(
        terminalRef.current,
        { opacity: 0.85 },
        { opacity: 1, duration: 0.1, repeat: 5, yoyo: true, ease: 'steps(1)' }
      )
    }
  }, [glitch])

  return (
    <div className="fixed inset-0 bg-[#050505] text-[#00ff41] font-mono text-sm overflow-hidden crt">
      {/* scanlines + vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 scanlines" />
      <div className="pointer-events-none absolute inset-0 z-10 vignette" />

      {/* header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[#00ff41]/20 bg-[#050505]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#ff4d00] animate-pulse" />
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
          textShadow: '0 0 4px rgba(0,255,65,0.5), 0 0 8px rgba(0,255,65,0.25)',
        }}
      >
        {/* ASCII art */}
        <pre className="mb-6 text-[#00ff41]/80 text-xs md:text-sm leading-none">
          {`   _   _     _   _   _   _   _
  / \\ / \\   / \\ / \\ / \\ / \\ / \\
 ( a | t | h | a | r | v ) ( s | e | c )
  \\_/ \\_/   \\_/ \\_/ \\_/ \\_/ \\_/ `}
        </pre>

        {/* boot lines */}
        {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
          <div key={i} className="mb-1 text-[#00ff41]/70">
            <span className="text-[#ff4d00] mr-2">[</span>
            {line}
            <span className="text-[#ff4d00] ml-2">]</span>
          </div>
        ))}

        {/* history */}
        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            {entry.type === 'in' ? (
              <div className="flex items-center">
                <span className="text-[#ff4d00] mr-2">atharv@security:~$</span>
                <span>{entry.lines[0]}</span>
              </div>
            ) : (
              <div className={`whitespace-pre-wrap ${entry.error ? 'text-[#ff4d00]' : 'text-[#00ff41]/90'}`}>
                {entry.lines.map((line, j) => (
                  <div key={j}>{line}</div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* input line */}
        {bootDone && (
          <div className="flex items-center">
            <span className="text-[#ff4d00] mr-2">atharv@security:~$</span>
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
            <span className="inline-block w-2 h-4 bg-[#00ff41] animate-pulse ml-1" />
          </div>
        )}
      </div>
    </div>
  )
}
