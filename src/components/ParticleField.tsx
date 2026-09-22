import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ParticleField({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(pointer: coarse)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const count = isTouch ? 50 : 120
    const positions = new Float32Array(count * 3)
    const velocities: { x: number; y: number; z: number }[] = []
    const palette = [new THREE.Color('#E85A2D'), new THREE.Color('#7A1F1F'), new THREE.Color('#ff7a4d')]
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.001,
      })
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xE85A2D,
      transparent: true,
      opacity: 0.22,
    })

    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(count * count * 3)
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    const handleMove = (x: number, y: number) => {
      mouseRef.current.x = (x / container.clientWidth) * 2 - 1
      mouseRef.current.y = -(y / container.clientHeight) * 2 + 1
      mouseRef.current.active = true
    }

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }

    if (!isTouch) {
      window.addEventListener('mousemove', onMouseMove)
    } else {
      window.addEventListener('touchmove', onTouchMove, { passive: true })
    }

    const resize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', resize)

    let frame = 0
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      frame++

      const pos = geometry.attributes.position.array as Float32Array
      const mouse = mouseRef.current

      for (let i = 0; i < count; i++) {
        const ix = i * 3
        if (!prefersReducedMotion) {
          pos[ix] += velocities[i].x
          pos[ix + 1] += velocities[i].y
          pos[ix + 2] += velocities[i].z

          if (mouse.active && !isTouch) {
            const dx = pos[ix] - mouse.x * 4
            const dy = pos[ix + 1] - mouse.y * 4
            const dz = pos[ix + 2]
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist < 3.5) {
              const force = (3.5 - dist) * 0.0008
              pos[ix] += dx * force
              pos[ix + 1] += dy * force
              pos[ix + 2] += dz * force
            }
          }

          if (pos[ix] < -4.5 || pos[ix] > 4.5) velocities[i].x *= -1
          if (pos[ix + 1] < -4.5 || pos[ix + 1] > 4.5) velocities[i].y *= -1
          if (pos[ix + 2] < -2.5 || pos[ix + 2] > 2.5) velocities[i].z *= -1
        }
      }
      geometry.attributes.position.needsUpdate = true

      if (!prefersReducedMotion && frame % 2 === 0) {
        let lineIndex = 0
        const linePos = lineGeometry.attributes.position.array as Float32Array
        const threshold = 1.4
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const dx = pos[i * 3] - pos[j * 3]
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist < threshold) {
              linePos[lineIndex++] = pos[i * 3]
              linePos[lineIndex++] = pos[i * 3 + 1]
              linePos[lineIndex++] = pos[i * 3 + 2]
              linePos[lineIndex++] = pos[j * 3]
              linePos[lineIndex++] = pos[j * 3 + 1]
              linePos[lineIndex++] = pos[j * 3 + 2]
            }
          }
        }
        lineGeometry.setDrawRange(0, lineIndex / 3)
        lineGeometry.attributes.position.needsUpdate = true
      }

      points.rotation.y += 0.0005
      lines.rotation.y += 0.0005
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      geometry.dispose()
      lineGeometry.dispose()
      material.dispose()
      lineMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: 'inherit' }} />
}
