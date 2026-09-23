import { useEffect, useRef, useMemo } from 'react'
import type { ProjectNode } from '../data/projects'

interface ProjectVisualProps {
  id: string
  node: ProjectNode
}

const COLORS = {
  threat: { bg: 'rgba(17,17,17,0.6)', stroke: '#666666', accent: '#ff4d00' },
  build: { bg: 'rgba(26,26,26,0.5)', stroke: '#888888', accent: '#f5f5f5' },
  ship: { bg: 'rgba(17,17,17,0.6)', stroke: '#ff4d00', accent: '#ff4d00' },
  impact: { bg: 'rgba(17,17,17,0.6)', stroke: '#ff4d00', accent: '#ffffff' },
}

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return () => {
    h = (h * 9301 + 49297) % 233280
    return h / 233280
  }
}

function hexToRgb(hex: string) {
  const m = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)
  if (!m) return { r: 255, g: 255, b: 255 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function ProjectVisual({ id, node }: ProjectVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const params = useMemo(() => {
    const rand = seededRandom(id)
    return {
      crackCount: 3 + Math.floor(rand() * 6),
      crackSegments: 5 + Math.floor(rand() * 5),
      buildCols: 4 + Math.floor(rand() * 4),
      buildRows: 3 + Math.floor(rand() * 3),
      buildFillBias: 0.55 + rand() * 0.25,
      impactRays: 8 + Math.floor(rand() * 10),
      hueShift: (rand() - 0.5) * 20,
    }
  }, [id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    canvas.width = cssWidth * dpr
    canvas.height = cssHeight * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const rand = seededRandom(id)
    const basePalette = COLORS[node]
    const accentRgb = hexToRgb(basePalette.accent)
    // subtle per-project hue shift applied to accent via HSL
    const shiftedAccent = `hsl(${(accentRgb.r / 255) * 360 + params.hueShift}, 85%, 55%)`
    const palette = { ...basePalette, accent: shiftedAccent }
    let frame = 0
    let raf: number

    const drawThreat = (time: number) => {
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      for (let i = 0; i < params.crackCount; i++) {
        const startX = rand() * cssWidth
        const startY = rand() * cssHeight * 0.25
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        let x = startX
        let y = startY
        for (let j = 0; j < params.crackSegments; j++) {
          x += (rand() - 0.5) * 80
          y += cssHeight / params.crackSegments + (rand() - 0.5) * 30
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = i === 0 ? palette.accent : palette.stroke
        ctx.lineWidth = i === 0 ? 2.5 : 1
        ctx.globalAlpha = 0.35 + Math.sin(time * 0.002 + i) * 0.15
        ctx.stroke()
      }

      ctx.globalAlpha = 0.08
      ctx.fillStyle = palette.accent
      for (let y = 0; y < cssHeight; y += 4) {
        ctx.fillRect(0, y, cssWidth, 1)
      }
      ctx.globalAlpha = 1
    }

    const drawBuild = (time: number) => {
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      const cols = params.buildCols
      const rows = params.buildRows
      const cellW = cssWidth / cols
      const cellH = cssHeight / rows
      const offset = Math.sin(time * 0.001) * 8

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() > 0.4) {
            const x = c * cellW + 8
            const y = r * cellH + 8
            const w = cellW - 16
            const h = cellH - 16
            const filled = rand() > params.buildFillBias

            ctx.strokeStyle = filled ? palette.accent : palette.stroke
            ctx.lineWidth = 1.5
            ctx.strokeRect(x, y, w, h)

            if (filled) {
              ctx.fillStyle = `${palette.accent}25`
              ctx.fillRect(x, y, w, h)
            }
          }
        }
      }

      ctx.strokeStyle = palette.stroke
      ctx.globalAlpha = 0.25
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const x1 = rand() * cssWidth
        const y1 = rand() * cssHeight
        const x2 = rand() * cssWidth
        const y2 = rand() * cssHeight
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2 + offset, y2)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const drawShip = (time: number) => {
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      const cx = cssWidth / 2
      const cy = cssHeight / 2
      const size = Math.min(cssWidth, cssHeight) * 0.28
      const pulse = 1 + Math.sin(time * 0.0015) * 0.04

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(pulse, pulse)

      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.bezierCurveTo(size * 0.8, -size * 0.6, size, -size * 0.2, size, size * 0.4)
      ctx.bezierCurveTo(size, size * 0.9, 0, size, 0, size)
      ctx.bezierCurveTo(0, size, -size, size * 0.9, -size, size * 0.4)
      ctx.bezierCurveTo(-size, -size * 0.2, -size * 0.8, -size * 0.6, 0, -size)
      ctx.closePath()
      ctx.strokeStyle = palette.stroke
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-size * 0.25, 0)
      ctx.lineTo(-size * 0.05, size * 0.25)
      ctx.lineTo(size * 0.35, -size * 0.25)
      ctx.strokeStyle = palette.accent
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      ctx.restore()
    }

    const drawImpact = (time: number) => {
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      const cx = cssWidth / 2
      const cy = cssHeight / 2
      const rays = params.impactRays
      const maxRadius = Math.min(cssWidth, cssHeight) * 0.46

      ctx.save()
      ctx.translate(cx, cy)

      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + time * 0.0005
        const length = maxRadius * (0.5 + rand() * 0.5)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
        ctx.strokeStyle = i % 3 === 0 ? palette.accent : palette.stroke
        ctx.lineWidth = i % 3 === 0 ? 2 : 1
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.002 + i) * 0.3
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fillStyle = palette.accent
      ctx.globalAlpha = 1
      ctx.fill()

      const ringR = 20 + Math.sin(time * 0.002) * 4
      ctx.beginPath()
      ctx.arc(0, 0, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = palette.accent
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.4
      ctx.stroke()

      ctx.restore()
      ctx.globalAlpha = 1
    }

    const drawers: Record<ProjectNode, (t: number) => void> = {
      threat: drawThreat,
      build: drawBuild,
      ship: drawShip,
      impact: drawImpact,
    }

    const animate = () => {
      frame = requestAnimationFrame(animate)
      drawers[node](Date.now())
    }

    if (prefersReducedMotion) {
      drawers[node](0)
    } else {
      animate()
    }

    return () => cancelAnimationFrame(frame)
  }, [id, node, params, prefersReducedMotion])

  return (
    <div className="w-full aspect-[16/10] border border-[var(--border)] bg-[var(--surface)] overflow-hidden relative group">
      <canvas ref={canvasRef} className="w-full h-full transition-transform duration-700 group-hover:scale-105" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-3 left-3 mono text-[10px] text-[var(--muted)] uppercase">{node}</div>
    </div>
  )
}
