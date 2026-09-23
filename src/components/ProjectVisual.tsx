import { useEffect, useRef } from 'react'
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

export function ProjectVisual({ id, node }: ProjectVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
    const palette = COLORS[node]
    let frame = 0
    let raf: number

    const drawThreat = (time: number) => {
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      const crackCount = 5
      for (let i = 0; i < crackCount; i++) {
        const startX = rand() * cssWidth
        const startY = rand() * cssHeight * 0.3
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        let x = startX
        let y = startY
        const segments = 8 + Math.floor(rand() * 6)
        for (let j = 0; j < segments; j++) {
          x += (rand() - 0.5) * 60
          y += cssHeight / segments + (rand() - 0.5) * 20
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = i === 0 ? palette.accent : palette.stroke
        ctx.lineWidth = i === 0 ? 2 : 1
        ctx.globalAlpha = 0.4 + Math.sin(time * 0.002 + i) * 0.2
        ctx.stroke()
      }

      // scan lines
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

      const cols = 6
      const rows = 4
      const cellW = cssWidth / cols
      const cellH = cssHeight / rows
      const offset = Math.sin(time * 0.001) * 6

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() > 0.55) {
            const x = c * cellW + 8
            const y = r * cellH + 8
            const w = cellW - 16
            const h = cellH - 16
            const filled = rand() > 0.7

            ctx.strokeStyle = filled ? palette.accent : palette.stroke
            ctx.lineWidth = 1.5
            ctx.strokeRect(x, y, w, h)

            if (filled) {
              ctx.fillStyle = `${palette.accent}20`
              ctx.fillRect(x, y, w, h)
            }
          }
        }
      }

      // connecting lines
      ctx.strokeStyle = palette.stroke
      ctx.globalAlpha = 0.25
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
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
      const pulse = 1 + Math.sin(time * 0.0015) * 0.03

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(pulse, pulse)

      // shield outline
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

      // inner check
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
      const rays = 12
      const maxRadius = Math.min(cssWidth, cssHeight) * 0.45

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

      // core
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fillStyle = palette.accent
      ctx.globalAlpha = 1
      ctx.fill()

      // ring
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
  }, [id, node, prefersReducedMotion])

  return (
    <div className="w-full aspect-[16/10] border border-[var(--border)] bg-[var(--surface)] overflow-hidden relative">
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
      <div className="absolute top-3 left-3 mono text-[10px] text-[var(--muted)] uppercase">{node}</div>
    </div>
  )
}
