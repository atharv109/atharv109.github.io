import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const vertexShader = (
  /* glsl */
  `
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
`
);
const fragmentShader = (
  /* glsl */
  `
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
`
);
const coreVertexShader = (
  /* glsl */
  `
  uniform float uTime;
  uniform float uEnergy;
  varying float vPulse;

  void main() {
    float pulse = sin(position.x * 3.7 + uTime) * cos(position.y * 4.1 - uTime * 0.8);
    vec3 displaced = position + normal * pulse * (0.035 + uEnergy * 0.07);
    vPulse = pulse * 0.5 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`
);
const coreFragmentShader = (
  /* glsl */
  `
  uniform float uEnergy;
  varying float vPulse;

  void main() {
    vec3 purple = vec3(0.459, 0.349, 1.0);
    vec3 acid = vec3(0.847, 1.0, 0.337);
    vec3 color = mix(purple, acid, vPulse);
    gl_FragColor = vec4(color, 0.28 + uEnergy * 0.22);
  }
`
);
function ImmersiveScene() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const desktop = window.matchMedia("(min-width: 1001px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || !desktop.matches || reducedMotion.matches) return;
    let stopped = false;
    let disposeScene = () => {
    };
    const boot = async () => {
      const THREE = await __vitePreload(() => import("three"), true ? [] : void 0);
      if (stopped || !canvas.isConnected) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance"
        });
      } catch {
        canvas.dataset.webgl = "unavailable";
        return;
      }
      renderer.setClearColor(0, 0);
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
        uPointer: { value: new THREE.Vector2() }
      };
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
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
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(2.15, -0.15, -0.7);
      system.add(core);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 16735285,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ringGeometry = new THREE.TorusGeometry(1.9, 9e-3, 4, 180);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(core.position);
      ring.rotation.set(1.1, 0.35, 0.2);
      system.add(ring);
      const secondRingMaterial = ringMaterial.clone();
      secondRingMaterial.color.set(14221142);
      secondRingMaterial.opacity = 0.22;
      const secondRingGeometry = new THREE.TorusGeometry(2.32, 6e-3, 4, 180);
      const secondRing = new THREE.Mesh(secondRingGeometry, secondRingMaterial);
      secondRing.position.copy(core.position);
      secondRing.rotation.set(0.35, 1.2, -0.5);
      system.add(secondRing);
      const anchorCount = 42;
      const anchors = Array.from({ length: anchorCount }, (_, index) => {
        const angle = index / anchorCount * Math.PI * 2;
        const radius = 2.45 + Math.sin(index * 1.7) * 0.42;
        return new THREE.Vector3(
          core.position.x + Math.cos(angle) * radius,
          core.position.y + Math.sin(angle) * radius * 0.62,
          core.position.z + Math.sin(angle * 3) * 0.62
        );
      });
      const networkPositions = [];
      anchors.forEach((anchor, index) => {
        const neighbor = anchors[(index + 1) % anchorCount];
        const crossLink = anchors[(index + 9) % anchorCount];
        networkPositions.push(anchor.x, anchor.y, anchor.z, neighbor.x, neighbor.y, neighbor.z);
        if (index % 2 === 0) networkPositions.push(anchor.x, anchor.y, anchor.z, crossLink.x, crossLink.y, crossLink.z);
      });
      const networkGeometry = new THREE.BufferGeometry();
      networkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(networkPositions, 3));
      const networkMaterial = new THREE.LineBasicMaterial({
        color: 16777215,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending
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
      const onPointerMove = (event) => {
        pointerTarget.set(
          event.clientX / window.innerWidth * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
      };
      const onPointerDown = () => {
        energyTarget = Math.min(1, energyTarget + 0.55);
      };
      const onScroll = () => {
        const delta = Math.abs(window.scrollY - scrollTarget);
        scrollTarget = window.scrollY;
        energyTarget = Math.min(1, energyTarget + Math.min(0.4, delta / 240));
      };
      const render = (time) => {
        const delta = Math.min(48, time - previousTime);
        previousTime = time;
        const documentRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(0.18, delta * 6e-3);
        const scrollProgress = scrollCurrent / documentRange;
        pointerCurrent.lerp(pointerTarget, Math.min(0.2, delta * 8e-3));
        energyCurrent += (energyTarget - energyCurrent) * Math.min(0.16, delta * 7e-3);
        energyTarget *= 0.955;
        const seconds = time * 1e-3;
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
  return /* @__PURE__ */ jsx("canvas", { className: "webgl-scene", ref: canvasRef, "aria-hidden": "true" });
}
const projects = [
  {
    number: "01",
    name: "VeriTriage-VEX",
    type: "Vulnerability intelligence",
    thesis: "A verdict engine that asks for evidence before confidence.",
    color: "#7559ff",
    metrics: ["8 ecosystems", "1,388 tests", "0 LLM verdicts"],
    bullets: [
      "Normalizes scanner findings across eight package ecosystems and produces auditable VEX decisions.",
      "Validated with 1,387 passing tests, one intentional skip, and 14/14 controlled cases.",
      "Keeps generative AI away from the final verdict. Helpful assistant, terrible judge."
    ],
    stack: "Python · SBOM · VEX · Security automation"
  },
  {
    number: "02",
    name: "Crypton",
    type: "Zero-trust identity",
    thesis: "Trust the enrolled device. Make everything else prove itself.",
    color: "#ff5c35",
    metrics: ["5 services", "4 endpoints", "24h recovery"],
    bullets: [
      "Architected device registration, challenge-response authentication, revocation, and recovery.",
      "Designed hardware-backed, device-local key flows so private keys stay on the enrolled device.",
      "Introduced a deliberate recovery delay and began testing the system with early-access users."
    ],
    stack: "TypeScript · Cryptography · Identity · Cloud"
  },
  {
    number: "03",
    name: "PromptPro",
    type: "AI product",
    thesis: "Better prompts, without turning prompting into another full-time job.",
    color: "#d8ff56",
    metrics: ["6 stages", "4 platforms", "~1–2 seconds"],
    bullets: [
      "Transforms rough input through a six-stage enhancement pipeline powered by Llama 3.3 70B.",
      "Works across four AI platforms and preserves context from the current prompt plus two prior turns.",
      "Built the workflow around speed, continuity, and staying out of the user’s way."
    ],
    stack: "Llama 3.3 · Browser extension · JavaScript · UX"
  },
  {
    number: "04",
    name: "ProtoPaper",
    type: "Research tooling",
    thesis: "Turn a half-formed research idea into something worth arguing with.",
    color: "#8ed7ff",
    metrics: ["3 input modes", "7 output layers", "2-day build"],
    bullets: [
      "Accepts a prompt, idea, or paper and generates structured framing, evidence, methodology, and next steps.",
      "Scores output quality from 0–100 and can execute up to three refinement attempts.",
      "Built across five routes during a two-day hackathon using Next.js, React, TypeScript, and Groq."
    ],
    stack: "Next.js · React · TypeScript · Groq"
  },
  {
    number: "05",
    name: "Adversary Lab",
    type: "Detection engineering",
    thesis: "Break the system legally. Then teach the system what breaking looks like.",
    color: "#ff9fbd",
    metrics: ["10+ techniques", "2 operating systems", "10+ Sigma rules"],
    bullets: [
      "Emulated more than ten MITRE ATT&CK techniques across controlled Windows and Linux targets.",
      "Investigated telemetry through Wazuh and Elastic across four attack phases.",
      "Translated observed behavior into more than ten portable Sigma detection rules."
    ],
    stack: "MITRE ATT&CK · Wazuh · Elastic · Sigma"
  }
];
const courseClusters = [
  "Data structures & algorithms",
  "Object-oriented programming",
  "Frontend systems",
  "Database design & SQL",
  "Networking & computer systems",
  "Cyber defense & risk",
  "Discrete mathematics & logic"
];
const skillGroups = [
  ["SECURITY", "Detection engineering", "Vulnerability triage", "Incident response", "Zero-trust identity"],
  ["BUILD", "React / Next.js", "Python", "TypeScript / JavaScript", "API & database design"],
  ["OPERATE", "Microsoft Defender", "Wazuh / Elastic", "Active Directory", "Git / CI workflows"]
];
function DraggableIdentity({
  className,
  number,
  title,
  detail
}) {
  const nodeRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
  const moveNode = (event) => {
    if (!drag.current.active || !nodeRef.current) return;
    const x = drag.current.x + event.clientX - drag.current.startX;
    const y = drag.current.y + event.clientY - drag.current.startY;
    nodeRef.current.style.setProperty("--drag-x", `${x}px`);
    nodeRef.current.style.setProperty("--drag-y", `${y}px`);
  };
  const stopDragging = (event) => {
    if (!drag.current.active || !nodeRef.current) return;
    drag.current.x += event.clientX - drag.current.startX;
    drag.current.y += event.clientY - drag.current.startY;
    drag.current.active = false;
    nodeRef.current.classList.remove("is-dragging");
    if (nodeRef.current.hasPointerCapture(event.pointerId)) nodeRef.current.releasePointerCapture(event.pointerId);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `identity-node ${className}`,
      ref: nodeRef,
      "data-draggable": "true",
      onPointerDown: (event) => {
        if (!nodeRef.current) return;
        drag.current.active = true;
        drag.current.startX = event.clientX;
        drag.current.startY = event.clientY;
        nodeRef.current.classList.add("is-dragging");
        nodeRef.current.setPointerCapture(event.pointerId);
      },
      onPointerMove: moveNode,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
      role: "img",
      "aria-label": `${title}: ${detail}. Drag to move this identity node.`,
      children: [
        /* @__PURE__ */ jsx("span", { children: number }),
        /* @__PURE__ */ jsx("strong", { children: title }),
        /* @__PURE__ */ jsx("small", { children: detail }),
        /* @__PURE__ */ jsx("i", { children: "DRAG ME" })
      ]
    }
  );
}
function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [activeProject, setActiveProject] = useState(0);
  const progressRef = useRef(null);
  useEffect(() => {
    const seen2 = sessionStorage.getItem("atharv-intro-seen");
    if (seen2) {
      const frame = window.requestAnimationFrame(() => setIntroVisible(false));
      return () => window.cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => {
      setIntroVisible(false);
      sessionStorage.setItem("atharv-intro-seen", "true");
    }, 2100);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const flowElements = Array.from(document.querySelectorAll("[data-flow]"));
    let measurements = flowElements.map((element) => ({ element, top: 0, height: 1 }));
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let frame = 0;
    const measure = () => {
      measurements = flowElements.map((element) => ({
        element,
        top: element.getBoundingClientRect().top + window.scrollY,
        height: Math.max(1, element.offsetHeight)
      }));
    };
    const moveLight = (event) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--pointer-nx", `${event.clientX / window.innerWidth - 0.5}`);
      root.style.setProperty("--pointer-ny", `${event.clientY / window.innerHeight - 0.5}`);
    };
    const updateTarget = () => {
      targetScroll = window.scrollY;
    };
    const onResize = () => {
      targetScroll = window.scrollY;
      measure();
    };
    const renderMotion = () => {
      currentScroll += (targetScroll - currentScroll) * 0.09;
      const viewportHeight = window.innerHeight;
      const available = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
      const progress = Math.min(1, Math.max(0, currentScroll / available));
      const heroProgress = Math.min(1, Math.max(0, currentScroll / (viewportHeight * 0.92)));
      const mobileFactor = window.innerWidth < 720 ? 0.38 : 1;
      progressRef.current?.style.setProperty("--scroll", `${progress * 100}%`);
      root.style.setProperty("--hero-progress", `${heroProgress}`);
      root.style.setProperty("--smooth-scroll", `${currentScroll}px`);
      if (!reducedMotion.matches) {
        measurements.forEach(({ element, top, height }) => {
          const sectionTop = top - currentScroll;
          const sectionProgress = Math.min(1, Math.max(0, (viewportHeight - sectionTop) / (viewportHeight + height)));
          const visibility = Math.max(0.12, Math.sin(sectionProgress * Math.PI) * 1.18);
          const direction = element.dataset.flowDirection === "right" ? 1 : -1;
          const amplitude = 82 * mobileFactor;
          element.style.setProperty("--flow", `${sectionProgress}`);
          element.style.setProperty("--flow-x", `${(0.5 - sectionProgress) * amplitude * direction}px`);
          element.style.setProperty("--flow-y", `${(0.5 - sectionProgress) * amplitude * 0.72}px`);
          element.style.setProperty("--flow-scale", `${0.955 + visibility * 0.045}`);
          element.style.setProperty("--flow-opacity", `${Math.min(1, visibility)}`);
        });
      }
      frame = window.requestAnimationFrame(renderMotion);
    };
    measure();
    const settleTimer = window.setTimeout(measure, 720);
    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("pointermove", moveLight, { passive: true });
    window.addEventListener("resize", onResize);
    frame = window.requestAnimationFrame(renderMotion);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("pointermove", moveLight);
      window.removeEventListener("resize", onResize);
    };
  }, [activeProject]);
  const skipIntro = () => {
    setIntroVisible(false);
    sessionStorage.setItem("atharv-intro-seen", "true");
  };
  return /* @__PURE__ */ jsxs("main", { children: [
    /* @__PURE__ */ jsx("a", { className: "skip-link", href: "#journey", children: "Skip the theatrics" }),
    /* @__PURE__ */ jsx(ImmersiveScene, {}),
    /* @__PURE__ */ jsxs("div", { className: `intro-screen ${introVisible ? "is-visible" : "is-gone"}`, "aria-hidden": !introVisible, children: [
      /* @__PURE__ */ jsx("button", { onClick: skipIntro, children: "Skip intro" }),
      /* @__PURE__ */ jsxs("div", { className: "intro-copy", children: [
        /* @__PURE__ */ jsx("p", { children: "Connecting the dots..." }),
        /* @__PURE__ */ jsxs("div", { className: "intro-word-stack", children: [
          /* @__PURE__ */ jsx("span", { children: "STUDENT" }),
          /* @__PURE__ */ jsx("span", { children: "SECURITY BUILDER" }),
          /* @__PURE__ */ jsx("span", { children: "FOUNDER" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "intro-punchline", children: "Turns out they were the same system." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "intro-loader", children: /* @__PURE__ */ jsx("span", {}) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "cursor-light", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx("div", { className: "scroll-progress", ref: progressRef, "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("header", { className: "site-header", children: [
      /* @__PURE__ */ jsxs("a", { className: "wordmark", href: "#top", "aria-label": "Atharv Mittal, home", children: [
        "ATHARV",
        /* @__PURE__ */ jsx("sup", { children: "®" })
      ] }),
      /* @__PURE__ */ jsxs("nav", { "aria-label": "Primary navigation", children: [
        /* @__PURE__ */ jsx("a", { href: "#journey", children: "Journey" }),
        /* @__PURE__ */ jsx("a", { href: "#work", children: "Systems" }),
        /* @__PURE__ */ jsx("a", { href: "#research", children: "Research" }),
        /* @__PURE__ */ jsx("a", { href: "#contact", children: "Contact" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "header-status", children: [
        /* @__PURE__ */ jsx("span", {}),
        " Available for the right problem"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "hero", id: "top", children: [
      /* @__PURE__ */ jsxs("div", { className: "hero-corner corner-left", children: [
        "STATE COLLEGE, PA",
        /* @__PURE__ */ jsx("br", {}),
        "40.7934° N"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hero-corner corner-right", children: [
        "SYSTEM STATUS",
        /* @__PURE__ */ jsx("br", {}),
        "STILL LEARNING"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hero-title-wrap", "data-flow": true, "data-flow-direction": "left", children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "ATHARV MITTAL / PERSONAL SYSTEMS MAP / 2026" }),
        /* @__PURE__ */ jsxs("h1", { children: [
          /* @__PURE__ */ jsx("span", { children: "I don't fit" }),
          /* @__PURE__ */ jsx("span", { children: "inside one" }),
          /* @__PURE__ */ jsx("span", { className: "title-displaced", children: "job title." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "hero-aside", children: "Good." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "identity-network", "aria-label": "Atharv's connected identities", "data-flow": true, "data-flow-direction": "right", children: [
        /* @__PURE__ */ jsx(DraggableIdentity, { className: "node-student", number: "01", title: "STUDENT", detail: "Penn State · CAO · 2028" }),
        /* @__PURE__ */ jsx(DraggableIdentity, { className: "node-security", number: "02", title: "SECURITY", detail: "Defend · Test · Detect" }),
        /* @__PURE__ */ jsx(DraggableIdentity, { className: "node-founder", number: "03", title: "FOUNDER", detail: "Buildora · Crypton" }),
        /* @__PURE__ */ jsx("div", { className: "identity-core", children: /* @__PURE__ */ jsx("span", { children: "AM" }) }),
        /* @__PURE__ */ jsx("i", { className: "connector line-a" }),
        /* @__PURE__ */ jsx("i", { className: "connector line-b" }),
        /* @__PURE__ */ jsx("i", { className: "connector line-c" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hero-bottom", children: [
        /* @__PURE__ */ jsx("p", { children: "I learn the foundations, test the assumptions, and ship the system. Usually in that order." }),
        /* @__PURE__ */ jsxs("a", { href: "#journey", children: [
          "Follow the connections ",
          /* @__PURE__ */ jsx("span", { children: "↓" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ticker", "aria-hidden": "true", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { children: "CYBERSECURITY" }),
      /* @__PURE__ */ jsx("i", { children: "✦" }),
      /* @__PURE__ */ jsx("span", { children: "PRODUCT ENGINEERING" }),
      /* @__PURE__ */ jsx("i", { children: "✦" }),
      /* @__PURE__ */ jsx("span", { children: "RESEARCH" }),
      /* @__PURE__ */ jsx("i", { children: "✦" }),
      /* @__PURE__ */ jsx("span", { children: "ENTREPRENEURSHIP" }),
      /* @__PURE__ */ jsx("i", { children: "✦" }),
      /* @__PURE__ */ jsx("span", { children: "CYBERSECURITY" }),
      /* @__PURE__ */ jsx("i", { children: "✦" }),
      /* @__PURE__ */ jsx("span", { children: "PRODUCT ENGINEERING" }),
      /* @__PURE__ */ jsx("i", { children: "✦" })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "journey", id: "journey", children: [
      /* @__PURE__ */ jsxs("div", { className: "journey-intro", "data-flow": true, "data-flow-direction": "right", children: [
        /* @__PURE__ */ jsx("p", { className: "chapter-label", children: "01 — HOW THE NODES CONNECTED" }),
        /* @__PURE__ */ jsxs("h2", { children: [
          "It started with curiosity.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("em", { children: "Structure came later." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "journey-note", children: "Here's the part where a normal portfolio would say “About Me.” This is not that part." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "path", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", {}) }),
      /* @__PURE__ */ jsxs("article", { className: "story-node story-education", children: [
        /* @__PURE__ */ jsxs("div", { className: "story-index", children: [
          /* @__PURE__ */ jsx("span", { children: "NODE 01" }),
          /* @__PURE__ */ jsx("b", { children: "2024—2028" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "story-copy", "data-flow": true, "data-flow-direction": "left", children: [
          /* @__PURE__ */ jsx("p", { className: "overline", children: "THE FOUNDATION / PENN STATE" }),
          /* @__PURE__ */ jsxs("h3", { children: [
            "Learning how systems work",
            /* @__PURE__ */ jsx("br", {}),
            "before deciding how to break them."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "B.S. Cybersecurity Analytics & Operations, expected 2028. The coursework connects programming, data, infrastructure, risk, and defense into one operating model." }),
          /* @__PURE__ */ jsxs("div", { className: "story-metrics", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "3.5" }),
              /* @__PURE__ */ jsx("span", { children: "GPA / 4.0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "2028" }),
              /* @__PURE__ */ jsx("span", { children: "Expected graduation" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "SEC+" }),
              /* @__PURE__ */ jsx("span", { children: "Certified Jan 2026" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "course-cloud", children: courseClusters.map((course, index) => /* @__PURE__ */ jsx("span", { style: { "--delay": `${index * -0.45}s` }, children: course }, course)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "story-node story-buildora", children: [
        /* @__PURE__ */ jsxs("div", { className: "story-index", children: [
          /* @__PURE__ */ jsx("span", { children: "NODE 02" }),
          /* @__PURE__ */ jsx("b", { children: "OCT 2025—NOW" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "story-copy", "data-flow": true, "data-flow-direction": "right", children: [
          /* @__PURE__ */ jsx("p", { className: "overline", children: "THE BUILDER / BUILDORA DEVELOPERS" }),
          /* @__PURE__ */ jsxs("h3", { children: [
            "Then theory met",
            /* @__PURE__ */ jsx("br", {}),
            "a paying client."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Founded a development studio and learned the less glamorous parts of building: scope, QA, deployment, revisions, and making the thing work outside localhost." }),
          /* @__PURE__ */ jsxs("div", { className: "oversized-proof", children: [
            /* @__PURE__ */ jsx("strong", { children: "50+" }),
            /* @__PURE__ */ jsx("span", { children: "client builds shipped" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "oversized-proof proof-alt", children: [
            /* @__PURE__ */ jsx("strong", { children: "~$5K" }),
            /* @__PURE__ */ jsx("span", { children: "monthly revenue" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "story-node story-security", children: [
        /* @__PURE__ */ jsxs("div", { className: "story-index", children: [
          /* @__PURE__ */ jsx("span", { children: "NODE 03" }),
          /* @__PURE__ */ jsx("b", { children: "OCT—DEC 2025" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "story-copy", "data-flow": true, "data-flow-direction": "left", children: [
          /* @__PURE__ */ jsx("p", { className: "overline", children: "THE DEFENDER / CENTRIENT" }),
          /* @__PURE__ */ jsxs("h3", { children: [
            "Real systems generate",
            /* @__PURE__ */ jsx("br", {}),
            "real noise."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Supported enterprise monitoring across Microsoft Defender, Mimecast, Active Directory, and cloud telemetry. Two hundred alerts before lunch has a way of sharpening prioritization." }),
          /* @__PURE__ */ jsxs("div", { className: "security-counter", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "5,000+" }),
              /* @__PURE__ */ jsx("span", { children: "endpoints monitored" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "200+" }),
              /* @__PURE__ */ jsx("span", { children: "alerts triaged daily" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small-proof", children: "Correlated signals, documented repeatable investigation workflows, and made escalation decisions easier to audit." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("article", { className: "story-node story-crypton", children: [
        /* @__PURE__ */ jsxs("div", { className: "story-index", children: [
          /* @__PURE__ */ jsx("span", { children: "NODE 04" }),
          /* @__PURE__ */ jsx("b", { children: "2026—NOW" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "story-copy", "data-flow": true, "data-flow-direction": "right", children: [
          /* @__PURE__ */ jsx("p", { className: "overline", children: "THE FOUNDER / CRYPTON" }),
          /* @__PURE__ */ jsxs("h3", { children: [
            "Passwords had",
            /* @__PURE__ */ jsx("br", {}),
            "a good run."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Co-founding a device-bound identity platform where trusted hardware—not a reusable secret—becomes the security boundary." }),
          /* @__PURE__ */ jsxs("div", { className: "crypton-system", "aria-label": "Crypton system metrics", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "05" }),
              /* @__PURE__ */ jsx("small", { children: "services" })
            ] }),
            /* @__PURE__ */ jsx("i", { children: "↔" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "04" }),
              /* @__PURE__ */ jsx("small", { children: "public endpoints" })
            ] }),
            /* @__PURE__ */ jsx("i", { children: "↔" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "24H" }),
              /* @__PURE__ */ jsx("small", { children: "recovery delay" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small-proof", children: "Hardware-backed keys. Challenge-response authentication. Revocation. Recovery. Early-access users currently testing the edges." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "work", id: "work", children: [
      /* @__PURE__ */ jsxs("div", { className: "work-heading", "data-flow": true, "data-flow-direction": "left", children: [
        /* @__PURE__ */ jsx("p", { className: "chapter-label", children: "02 — SELECTED SYSTEMS" }),
        /* @__PURE__ */ jsxs("h2", { children: [
          "Five things worth",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { children: "clicking." })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Click anything that looks suspicious. That advice applies only on this portfolio." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "project-list", children: projects.map((project, index) => {
        const isActive = activeProject === index;
        return /* @__PURE__ */ jsxs(
          "article",
          {
            className: `project ${isActive ? "is-active" : ""}`,
            style: { "--project-color": project.color },
            "data-flow": true,
            "data-flow-direction": index % 2 === 0 ? "left" : "right",
            onPointerMove: (event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--local-x", `${event.clientX - bounds.left}px`);
              event.currentTarget.style.setProperty("--local-y", `${event.clientY - bounds.top}px`);
            },
            children: [
              /* @__PURE__ */ jsxs("button", { className: "project-trigger", onClick: () => setActiveProject(isActive ? null : index), "aria-expanded": isActive, children: [
                /* @__PURE__ */ jsx("span", { className: "project-number", children: project.number }),
                /* @__PURE__ */ jsx("span", { className: "project-name", children: project.name }),
                /* @__PURE__ */ jsx("span", { className: "project-type", children: project.type }),
                /* @__PURE__ */ jsx("span", { className: "project-toggle", "aria-hidden": "true", children: isActive ? "CLOSE ×" : "OPEN +" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "project-reveal", "aria-hidden": !isActive, children: [
                /* @__PURE__ */ jsxs("div", { className: "project-thesis", children: [
                  /* @__PURE__ */ jsx("p", { children: project.thesis }),
                  /* @__PURE__ */ jsx("span", { children: project.stack })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "project-metrics", children: project.metrics.map((metric) => /* @__PURE__ */ jsx("strong", { children: metric }, metric)) }),
                /* @__PURE__ */ jsx("ul", { children: project.bullets.map((bullet) => /* @__PURE__ */ jsx("li", { children: bullet }, bullet)) })
              ] })
            ]
          },
          project.name
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "archive-note", children: [
        /* @__PURE__ */ jsx("span", { children: "STILL IN THE LAB" }),
        /* @__PURE__ */ jsx("p", { children: "TinyVulnScanner, EDUAI, BillShield, AI Outfit Recommender, CTF write-ups, and the builds that taught me what not to do twice." }),
        /* @__PURE__ */ jsx("a", { href: "https://github.com/atharv109?tab=repositories", target: "_blank", rel: "noreferrer", children: "Enter the GitHub archive ↗" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "research", id: "research", children: [
      /* @__PURE__ */ jsxs("div", { className: "research-orbit", "aria-hidden": "true", "data-flow": true, "data-flow-direction": "left", children: [
        /* @__PURE__ */ jsx("span", {}),
        /* @__PURE__ */ jsx("span", {}),
        /* @__PURE__ */ jsx("span", {}),
        /* @__PURE__ */ jsx("b", { children: "?" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "research-copy", "data-flow": true, "data-flow-direction": "right", children: [
        /* @__PURE__ */ jsx("p", { className: "chapter-label", children: "03 — CURRENT RESEARCH / PROF. MAHANTH GOWDA" }),
        /* @__PURE__ */ jsxs("h2", { children: [
          "Can a machine read",
          /* @__PURE__ */ jsx("br", {}),
          "a schematic ",
          /* @__PURE__ */ jsx("em", { children: "without" }),
          /* @__PURE__ */ jsx("br", {}),
          "pretending it understood?"
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Developing a human-in-the-loop annotation assistant for PCB schematics. The system detects symbols, extracts text, traces wires, drafts structured JSON, and leaves the uncertain decisions exactly where they belong: with a human reviewer." }),
        /* @__PURE__ */ jsxs("div", { className: "research-steps", children: [
          /* @__PURE__ */ jsx("span", { children: "DETECT" }),
          /* @__PURE__ */ jsx("i", { children: "→" }),
          /* @__PURE__ */ jsx("span", { children: "STRUCTURE" }),
          /* @__PURE__ */ jsx("i", { children: "→" }),
          /* @__PURE__ */ jsx("span", { children: "CORRECT" }),
          /* @__PURE__ */ jsx("i", { children: "→" }),
          /* @__PURE__ */ jsx("span", { children: "VALIDATE" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "capabilities", id: "capabilities", children: [
      /* @__PURE__ */ jsxs("div", { className: "capability-heading", "data-flow": true, "data-flow-direction": "right", children: [
        /* @__PURE__ */ jsx("p", { className: "chapter-label", children: "04 — WHAT THE SYSTEM CAN DO" }),
        /* @__PURE__ */ jsxs("h2", { children: [
          "Depth in security.",
          /* @__PURE__ */ jsx("br", {}),
          "Range in building."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "capability-marquee", children: skillGroups.map((group, groupIndex) => /* @__PURE__ */ jsxs("div", { className: "capability-row", "data-flow": true, "data-flow-direction": groupIndex % 2 === 0 ? "left" : "right", children: [
        /* @__PURE__ */ jsx("span", { children: group[0] }),
        /* @__PURE__ */ jsx("div", { children: group.slice(1).map((skill) => /* @__PURE__ */ jsx("strong", { children: skill }, skill)) }),
        /* @__PURE__ */ jsxs("b", { children: [
          "0",
          groupIndex + 1
        ] })
      ] }, group[0])) }),
      /* @__PURE__ */ jsxs("div", { className: "credential-band", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "VALIDATED" }),
          /* @__PURE__ */ jsx("strong", { children: "CompTIA Security+" }),
          /* @__PURE__ */ jsx("small", { children: "January 2026" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "COMPETITION" }),
          /* @__PURE__ */ jsx("strong", { children: "LA CTF 2026" }),
          /* @__PURE__ */ jsx("small", { children: "Solo · Top 100" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "LOCATION" }),
          /* @__PURE__ */ jsx("strong", { children: "State College" }),
          /* @__PURE__ */ jsx("small", { children: "Pennsylvania, USA" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "contact", id: "contact", children: [
      /* @__PURE__ */ jsx("p", { className: "chapter-label", children: "05 — ESTABLISH A CONNECTION" }),
      /* @__PURE__ */ jsxs("h2", { "data-flow": true, "data-flow-direction": "left", children: [
        "Bring me a difficult",
        /* @__PURE__ */ jsx("br", {}),
        "system."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "contact-sub", "data-flow": true, "data-flow-direction": "right", children: "Cybersecurity internships, research collaborations, ambitious products—or a genuinely good reason to debate passwords." }),
      /* @__PURE__ */ jsxs("a", { className: "email-link", href: "mailto:atharvm2005@gmail.com", "data-flow": true, "data-flow-direction": "left", children: [
        /* @__PURE__ */ jsx("span", { children: "atharvm2005@gmail.com" }),
        /* @__PURE__ */ jsx("b", { children: "↗" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "contact-footer", children: [
        /* @__PURE__ */ jsx("a", { href: "https://www.linkedin.com/in/atharv-mittal/", target: "_blank", rel: "noreferrer", children: "LinkedIn ↗" }),
        /* @__PURE__ */ jsx("a", { href: "https://github.com/atharv109", target: "_blank", rel: "noreferrer", children: "GitHub ↗" }),
        /* @__PURE__ */ jsx("a", { href: "#top", children: "State College, PA ↑" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("footer", { children: [
      /* @__PURE__ */ jsx("p", { children: "© 2026 ATHARV MITTAL" }),
      /* @__PURE__ */ jsx("p", { children: "BUILT WITH CODE, AI ASSISTANCE, AND HUMAN JUDGMENT." }),
      /* @__PURE__ */ jsx("p", { children: "STILL FIGURING IT OUT. THAT'S THE POINT." })
    ] })
  ] });
}
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(Home, {}) })
);
