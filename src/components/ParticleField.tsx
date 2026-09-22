import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const isMobile = window.matchMedia('(pointer: coarse)').matches
    const particleCount = isMobile ? 40 : 90
    const connectionDistance = isMobile ? 60 : 90

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 55

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities: { x: number; y: number; z: number }[] = []
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      velocities.push({
        x: (Math.random() - 0.5) * 0.03,
        y: (Math.random() - 0.5) * 0.03,
        z: (Math.random() - 0.5) * 0.015,
      })
      const isAccent = Math.random() > 0.9
      colors[i * 3] = isAccent ? 1 : 0.75
      colors[i * 3 + 1] = isAccent ? 0.3 : 0.35
      colors[i * 3 + 2] = isAccent ? 0 : 0.25
    }

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
      color: 0xff4d00,
      transparent: true,
      opacity: 0.06,
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

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const pos = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3
        pos[ix] += velocities[i].x + mouseX * 0.01
        pos[ix + 1] += velocities[i].y + mouseY * 0.01
        pos[ix + 2] += velocities[i].z

        if (Math.abs(pos[ix]) > 70) velocities[i].x *= -1
        if (Math.abs(pos[ix + 1]) > 50) velocities[i].y *= -1
        if (Math.abs(pos[ix + 2]) > 25) velocities[i].z *= -1
      }
      geometry.attributes.position.needsUpdate = true

      const linePositions: number[] = []
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < connectionDistance) {
            const opacity = 1 - dist / connectionDistance
            linePositions.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
            linePositions.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
          }
        }
      }
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3))

      camera.position.x += (mouseX * 2 - camera.position.x) * 0.02
      camera.position.y += (mouseY * 2 - camera.position.y) * 0.02
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
