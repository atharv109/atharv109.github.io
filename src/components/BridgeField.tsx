import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function BridgeField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const isMobile = window.matchMedia('(pointer: coarse)').matches
    const count = isMobile ? 50 : 120
    const connectDistance = isMobile ? 22 : 30

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 60

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    type Side = 'left' | 'bridge' | 'right'

    const mutedColor = new THREE.Color('#444444')
    const lightColor = new THREE.Color('#888888')
    const accentColor = new THREE.Color('#ff4d00')

    const particles: {
      x: number
      y: number
      z: number
      vx: number
      vy: number
      vz: number
      side: Side
      color: THREE.Color
    }[] = []

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const roll = Math.random()
      const side: Side = roll < 0.35 ? 'left' : roll < 0.65 ? 'bridge' : 'right'

      const xBase = side === 'left' ? -42 : side === 'right' ? 42 : 0
      const x = xBase + (Math.random() - 0.5) * (side === 'bridge' ? 24 : 32)
      const y = (Math.random() - 0.5) * 55
      const z = (Math.random() - 0.5) * 20

      const color = side === 'left' ? mutedColor.clone() : side === 'right' ? lightColor.clone() : accentColor.clone()
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1)

      const driftSpeed = side === 'left' ? 0.04 : side === 'right' ? 0.02 : 0.05

      particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * driftSpeed,
        vy: (Math.random() - 0.5) * driftSpeed * 0.8,
        vz: (Math.random() - 0.5) * 0.015,
        side,
        color,
      })
    }

    particles.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      colors[i * 3] = p.color.r
      colors[i * 3 + 1] = p.color.g
      colors[i * 3 + 2] = p.color.b
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    })

    const lineGeometry = new THREE.BufferGeometry()
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineMesh)

    let mouseX = 0
    let mouseY = 0
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const softClamp = (val: number, min: number, max: number) => {
      if (val < min) return min + (val - min) * 0.1
      if (val > max) return max + (val - max) * 0.1
      return val
    }

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const time = Date.now() * 0.0004
      const pos = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < count; i++) {
        const p = particles[i]

        // slight current: left drifts toward center, right holds, bridge oscillates
        let currentX = 0
        if (p.side === 'left') currentX = 0.012 + Math.sin(time + i) * 0.004
        else if (p.side === 'right') currentX = -0.004 + Math.sin(time + i * 1.3) * 0.003
        else currentX = Math.sin(time * 1.5 + i) * 0.02

        // mouse influence: pulls bridge toward cursor, nudges zones
        const mouseInfluence = p.side === 'bridge' ? 0.015 : 0.004
        p.vx += (mouseX * 15 - p.x) * mouseInfluence * 0.02
        p.vy += (mouseY * 10 - p.y) * mouseInfluence * 0.02

        p.x += p.vx + currentX
        p.y += p.vy
        p.z += p.vz

        // soft containment
        const xMin = p.side === 'left' ? -72 : p.side === 'right' ? 10 : -28
        const xMax = p.side === 'left' ? -10 : p.side === 'right' ? 72 : 28
        p.x = softClamp(p.x, xMin, xMax)
        if (Math.abs(p.y) > 48) p.vy *= -0.8
        if (Math.abs(p.z) > 22) p.vz *= -0.8

        // dampen
        p.vx *= 0.98
        p.vy *= 0.98
        p.vz *= 0.98

        pos[i * 3] = p.x
        pos[i * 3 + 1] = p.y
        pos[i * 3 + 2] = p.z
      }
      geometry.attributes.position.needsUpdate = true

      // connections
      const linePositions: number[] = []
      const lineColors: number[] = []

      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dz = a.z - b.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < connectDistance) {
            const t = 1 - dist / connectDistance
            linePositions.push(a.x, a.y, a.z)
            linePositions.push(b.x, b.y, b.z)

            // accent lines for cross-side or bridge connections; muted for same-side
            const isBridgeLine = a.side !== b.side || a.side === 'bridge' || b.side === 'bridge'
            const base = isBridgeLine ? accentColor : a.side === 'right' ? lightColor : mutedColor
            const r = base.r * t
            const g = base.g * t
            const bVal = base.b * t
            lineColors.push(r, g, bVal)
            lineColors.push(r, g, bVal)
          }
        }
      }

      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3))
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineColors), 3))
      lineGeometry.attributes.position.needsUpdate = true
      lineGeometry.attributes.color.needsUpdate = true

      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02
      camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.02
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 -z-10" />
}
