import { useEffect, useRef } from "react";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uEnergy;
  uniform vec2 uPointer;
  attribute float aSize;
  attribute float aPhase;
  attribute float aColor;
  varying float vColor;
  varying float vAlpha;

  void main() {
    vec3 particle = position;
    particle.z = mod(particle.z + uScroll * 18.0 + uTime * 0.08 + 12.0, 16.0) - 12.0;
    particle.x += sin(particle.y * 1.35 + uTime * 0.38 + aPhase) * (0.12 + uEnergy * 0.08);
    particle.y += cos(particle.x * 1.15 + uTime * 0.26 + aPhase) * (0.11 + uEnergy * 0.06);
    particle.xy += uPointer * (0.12 + (-particle.z * 0.012));

    vec4 viewPosition = modelViewMatrix * vec4(particle, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = min(6.5, aSize * (72.0 / max(1.0, -viewPosition.z)) * (1.0 + uEnergy * 0.35));
    vColor = aColor;
    vAlpha = smoothstep(-12.0, -4.0, particle.z) * (1.0 - smoothstep(-1.0, 2.0, particle.z));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float distanceToCenter = length(center);
    float alpha = 1.0 - smoothstep(0.12, 0.5, distanceToCenter);
    vec3 purple = vec3(0.459, 0.349, 1.0);
    vec3 acid = vec3(0.847, 1.0, 0.337);
    vec3 orange = vec3(1.0, 0.361, 0.208);
    vec3 color = vColor < 0.5 ? mix(purple, acid, vColor * 2.0) : mix(acid, orange, (vColor - 0.5) * 2.0);
    gl_FragColor = vec4(color, alpha * vAlpha * 0.9);
  }
`;

const coreVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  varying float vPulse;

  void main() {
    float pulse = sin(position.x * 3.7 + uTime) * cos(position.y * 4.1 - uTime * 0.8);
    vec3 displaced = position + normal * pulse * (0.035 + uEnergy * 0.07);
    vPulse = pulse * 0.5 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const coreFragmentShader = /* glsl */ `
  uniform float uEnergy;
  varying float vPulse;

  void main() {
    vec3 purple = vec3(0.459, 0.349, 1.0);
    vec3 acid = vec3(0.847, 1.0, 0.337);
    vec3 color = mix(purple, acid, vPulse);
    gl_FragColor = vec4(color, 0.28 + uEnergy * 0.22);
  }
`;

export default function ImmersiveScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const desktop = window.matchMedia("(min-width: 1001px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || !desktop.matches || reducedMotion.matches) return;

    let stopped = false;
    let disposeScene = () => {};

    const boot = async () => {
      const THREE = await import("three");
      if (stopped || !canvas.isConnected) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
      } catch {
        canvas.dataset.webgl = "unavailable";
        return;
      }

      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
      camera.position.set(0, 0, 8.4);
      const system = new THREE.Group();
      scene.add(system);

      const particleCount = 920;
      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const phases = new Float32Array(particleCount);
      const colors = new Float32Array(particleCount);

      for (let index = 0; index < particleCount; index += 1) {
        const radius = 1.4 + Math.pow(Math.random(), 0.62) * 5.8;
        const angle = Math.random() * Math.PI * 2;
        positions[index * 3] = Math.cos(angle) * radius * 1.42;
        positions[index * 3 + 1] = Math.sin(angle) * radius * 0.78;
        positions[index * 3 + 2] = Math.random() * 16 - 12;
        sizes[index] = 0.65 + Math.random() * 1.6;
        phases[index] = Math.random() * Math.PI * 2;
        colors[index] = Math.random();
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      particleGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
      particleGeometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 1));

      const particleUniforms = {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uEnergy: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
      };
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      system.add(particles);

      const coreUniforms = { uTime: { value: 0 }, uEnergy: { value: 0 } };
      const coreGeometry = new THREE.IcosahedronGeometry(1.28, 4);
      const coreMaterial = new THREE.ShaderMaterial({
        uniforms: coreUniforms,
        vertexShader: coreVertexShader,
        fragmentShader: coreFragmentShader,
        wireframe: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(2.15, -0.15, -0.7);
      system.add(core);

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5c35,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ringGeometry = new THREE.TorusGeometry(1.9, 0.009, 4, 180);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(core.position);
      ring.rotation.set(1.1, 0.35, 0.2);
      system.add(ring);

      const secondRingMaterial = ringMaterial.clone();
      secondRingMaterial.color.set(0xd8ff56);
      secondRingMaterial.opacity = 0.22;
      const secondRingGeometry = new THREE.TorusGeometry(2.32, 0.006, 4, 180);
      const secondRing = new THREE.Mesh(secondRingGeometry, secondRingMaterial);
      secondRing.position.copy(core.position);
      secondRing.rotation.set(0.35, 1.2, -0.5);
      system.add(secondRing);

      const anchorCount = 42;
      const anchors = Array.from({ length: anchorCount }, (_, index) => {
        const angle = (index / anchorCount) * Math.PI * 2;
        const radius = 2.45 + Math.sin(index * 1.7) * 0.42;
        return new THREE.Vector3(
          core.position.x + Math.cos(angle) * radius,
          core.position.y + Math.sin(angle) * radius * 0.62,
          core.position.z + Math.sin(angle * 3) * 0.62,
        );
      });
      const networkPositions: number[] = [];
      anchors.forEach((anchor, index) => {
        const neighbor = anchors[(index + 1) % anchorCount];
        const crossLink = anchors[(index + 9) % anchorCount];
        networkPositions.push(anchor.x, anchor.y, anchor.z, neighbor.x, neighbor.y, neighbor.z);
        if (index % 2 === 0) networkPositions.push(anchor.x, anchor.y, anchor.z, crossLink.x, crossLink.y, crossLink.z);
      });
      const networkGeometry = new THREE.BufferGeometry();
      networkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(networkPositions, 3));
      const networkMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const network = new THREE.LineSegments(networkGeometry, networkMaterial);
      system.add(network);

      const pointerTarget = new THREE.Vector2();
      const pointerCurrent = new THREE.Vector2();
      let scrollTarget = window.scrollY;
      let scrollCurrent = window.scrollY;
      let energyTarget = 0;
      let energyCurrent = 0;
      let frame = 0;
      let previousTime = performance.now();

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
      };
      const onPointerMove = (event: PointerEvent) => {
        pointerTarget.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1,
        );
      };
      const onPointerDown = () => { energyTarget = Math.min(1, energyTarget + 0.55); };
      const onScroll = () => {
        const delta = Math.abs(window.scrollY - scrollTarget);
        scrollTarget = window.scrollY;
        energyTarget = Math.min(1, energyTarget + Math.min(0.4, delta / 240));
      };

      const render = (time: number) => {
        const delta = Math.min(48, time - previousTime);
        previousTime = time;
        const documentRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(0.18, delta * 0.006);
        const scrollProgress = scrollCurrent / documentRange;
        pointerCurrent.lerp(pointerTarget, Math.min(0.2, delta * 0.008));
        energyCurrent += (energyTarget - energyCurrent) * Math.min(0.16, delta * 0.007);
        energyTarget *= 0.955;

        const seconds = time * 0.001;
        particleUniforms.uTime.value = seconds;
        particleUniforms.uScroll.value = scrollProgress;
        particleUniforms.uEnergy.value = energyCurrent;
        particleUniforms.uPointer.value.copy(pointerCurrent);
        coreUniforms.uTime.value = seconds;
        coreUniforms.uEnergy.value = energyCurrent;

        camera.position.x += (pointerCurrent.x * 0.5 - camera.position.x) * 0.045;
        camera.position.y += (pointerCurrent.y * 0.34 - camera.position.y) * 0.045;
        camera.lookAt(0, 0, -1.4);
        system.rotation.y = scrollProgress * Math.PI * 1.8 + pointerCurrent.x * 0.08;
        system.rotation.z = Math.sin(scrollProgress * Math.PI * 2) * 0.14;
        system.position.y = Math.sin(scrollProgress * Math.PI * 5) * 0.28;
        core.rotation.x = seconds * 0.11 + scrollProgress * Math.PI;
        core.rotation.y = seconds * 0.15 - scrollProgress * Math.PI * 1.4;
        ring.rotation.z = seconds * 0.08 + scrollProgress * Math.PI * 1.6;
        secondRing.rotation.z = -seconds * 0.05 - scrollProgress * Math.PI;
        network.rotation.z = seconds * 0.018 - scrollProgress * 0.6;

        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(render);
      };

      resize();
      canvas.dataset.webgl = "ready";
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      frame = window.requestAnimationFrame(render);

      disposeScene = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("scroll", onScroll);
        particleGeometry.dispose();
        particleMaterial.dispose();
        coreGeometry.dispose();
        coreMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        secondRingGeometry.dispose();
        secondRingMaterial.dispose();
        networkGeometry.dispose();
        networkMaterial.dispose();
        renderer.dispose();
      };
    };

    void boot();
    return () => {
      stopped = true;
      disposeScene();
    };
  }, []);

  return <canvas className="webgl-scene" ref={canvasRef} aria-hidden="true" />;
}
