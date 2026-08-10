import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ImmersiveScene from "./ImmersiveScene";

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
      "Keeps generative AI away from the final verdict. Helpful assistant, terrible judge.",
    ],
    stack: "Python · SBOM · VEX · Security automation",
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
      "Introduced a deliberate recovery delay and began testing the system with early-access users.",
    ],
    stack: "TypeScript · Cryptography · Identity · Cloud",
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
      "Built the workflow around speed, continuity, and staying out of the user’s way.",
    ],
    stack: "Llama 3.3 · Browser extension · JavaScript · UX",
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
      "Built across five routes during a two-day hackathon using Next.js, React, TypeScript, and Groq.",
    ],
    stack: "Next.js · React · TypeScript · Groq",
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
      "Translated observed behavior into more than ten portable Sigma detection rules.",
    ],
    stack: "MITRE ATT&CK · Wazuh · Elastic · Sigma",
  },
];

const courseClusters = [
  "Data structures & algorithms",
  "Object-oriented programming",
  "Frontend systems",
  "Database design & SQL",
  "Networking & computer systems",
  "Cyber defense & risk",
  "Discrete mathematics & logic",
];

const skillGroups = [
  ["SECURITY", "Detection engineering", "Vulnerability triage", "Incident response", "Zero-trust identity"],
  ["BUILD", "React / Next.js", "Python", "TypeScript / JavaScript", "API & database design"],
  ["OPERATE", "Microsoft Defender", "Wazuh / Elastic", "Active Directory", "Git / CI workflows"],
];

function DraggableIdentity({
  className,
  number,
  title,
  detail,
}: {
  className: string;
  number: string;
  title: string;
  detail: string;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 });

  const moveNode = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !nodeRef.current) return;
    const x = drag.current.x + event.clientX - drag.current.startX;
    const y = drag.current.y + event.clientY - drag.current.startY;
    nodeRef.current.style.setProperty("--drag-x", `${x}px`);
    nodeRef.current.style.setProperty("--drag-y", `${y}px`);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !nodeRef.current) return;
    drag.current.x += event.clientX - drag.current.startX;
    drag.current.y += event.clientY - drag.current.startY;
    drag.current.active = false;
    nodeRef.current.classList.remove("is-dragging");
    if (nodeRef.current.hasPointerCapture(event.pointerId)) nodeRef.current.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`identity-node ${className}`}
      ref={nodeRef}
      data-draggable="true"
      onPointerDown={(event) => {
        if (!nodeRef.current) return;
        drag.current.active = true;
        drag.current.startX = event.clientX;
        drag.current.startY = event.clientY;
        nodeRef.current.classList.add("is-dragging");
        nodeRef.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={moveNode}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="img"
      aria-label={`${title}: ${detail}. Drag to move this identity node.`}
    >
      <span>{number}</span><strong>{title}</strong><small>{detail}</small><i>DRAG ME</i>
    </div>
  );
}
export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [activeProject, setActiveProject] = useState<number | null>(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem("atharv-intro-seen");
    if (seen) {
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
    const flowElements = Array.from(document.querySelectorAll<HTMLElement>("[data-flow]"));
    let measurements = flowElements.map((element) => ({ element, top: 0, height: 1 }));
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let frame = 0;

    const measure = () => {
      measurements = flowElements.map((element) => ({
        element,
        top: element.getBoundingClientRect().top + window.scrollY,
        height: Math.max(1, element.offsetHeight),
      }));
    };

    const moveLight = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--pointer-nx", `${event.clientX / window.innerWidth - 0.5}`);
      root.style.setProperty("--pointer-ny", `${event.clientY / window.innerHeight - 0.5}`);
    };
    const updateTarget = () => { targetScroll = window.scrollY; };
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

  return (
    <main>
      <a className="skip-link" href="#journey">Skip the theatrics</a>
      <ImmersiveScene />

      <div className={`intro-screen ${introVisible ? "is-visible" : "is-gone"}`} aria-hidden={!introVisible}>
        <button onClick={skipIntro}>Skip intro</button>
        <div className="intro-copy">
          <p>Connecting the dots...</p>
          <div className="intro-word-stack">
            <span>STUDENT</span>
            <span>SECURITY BUILDER</span>
            <span>FOUNDER</span>
          </div>
          <p className="intro-punchline">Turns out they were the same system.</p>
        </div>
        <div className="intro-loader"><span /></div>
      </div>

      <div className="cursor-light" aria-hidden="true" />
      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Atharv Mittal, home">ATHARV<sup>®</sup></a>
        <nav aria-label="Primary navigation">
          <a href="#journey">Journey</a>
          <a href="#work">Systems</a>
          <a href="#research">Research</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="header-status"><span /> Available for the right problem</p>
      </header>

      <section className="hero" id="top">
        <div className="hero-corner corner-left">STATE COLLEGE, PA<br />40.7934° N</div>
        <div className="hero-corner corner-right">SYSTEM STATUS<br />STILL LEARNING</div>

        <div className="hero-title-wrap" data-flow data-flow-direction="left">
          <p className="eyebrow">ATHARV MITTAL / PERSONAL SYSTEMS MAP / 2026</p>
          <h1>
            <span>I don&apos;t fit</span>
            <span>inside one</span>
            <span className="title-displaced">job title.</span>
          </h1>
          <p className="hero-aside">Good.</p>
        </div>

        <div className="identity-network" aria-label="Atharv's connected identities" data-flow data-flow-direction="right">
          <DraggableIdentity className="node-student" number="01" title="STUDENT" detail="Penn State · CAO · 2028" />
          <DraggableIdentity className="node-security" number="02" title="SECURITY" detail="Defend · Test · Detect" />
          <DraggableIdentity className="node-founder" number="03" title="FOUNDER" detail="Buildora · Crypton" />
          <div className="identity-core"><span>AM</span></div>
          <i className="connector line-a" /><i className="connector line-b" /><i className="connector line-c" />
        </div>

        <div className="hero-bottom">
          <p>I learn the foundations, test the assumptions, and ship the system. Usually in that order.</p>
          <a href="#journey">Follow the connections <span>↓</span></a>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div><span>CYBERSECURITY</span><i>✦</i><span>PRODUCT ENGINEERING</span><i>✦</i><span>RESEARCH</span><i>✦</i><span>ENTREPRENEURSHIP</span><i>✦</i><span>CYBERSECURITY</span><i>✦</i><span>PRODUCT ENGINEERING</span><i>✦</i></div>
      </div>

      <section className="journey" id="journey">
        <div className="journey-intro" data-flow data-flow-direction="right">
          <p className="chapter-label">01 — HOW THE NODES CONNECTED</p>
          <h2>It started with curiosity.<br /><em>Structure came later.</em></h2>
          <p className="journey-note">Here&apos;s the part where a normal portfolio would say “About Me.” This is not that part.</p>
        </div>

        <div className="path" aria-hidden="true"><span /></div>

        <article className="story-node story-education">
          <div className="story-index"><span>NODE 01</span><b>2024—2028</b></div>
          <div className="story-copy" data-flow data-flow-direction="left">
            <p className="overline">THE FOUNDATION / PENN STATE</p>
            <h3>Learning how systems work<br />before deciding how to break them.</h3>
            <p>B.S. Cybersecurity Analytics & Operations, expected 2028. The coursework connects programming, data, infrastructure, risk, and defense into one operating model.</p>
            <div className="story-metrics"><div><strong>3.5</strong><span>GPA / 4.0</span></div><div><strong>2028</strong><span>Expected graduation</span></div><div><strong>SEC+</strong><span>Certified Jan 2026</span></div></div>
            <div className="course-cloud">{courseClusters.map((course, index) => <span key={course} style={{ "--delay": `${index * -0.45}s` } as CSSProperties}>{course}</span>)}</div>
          </div>
        </article>

        <article className="story-node story-buildora">
          <div className="story-index"><span>NODE 02</span><b>OCT 2025—NOW</b></div>
          <div className="story-copy" data-flow data-flow-direction="right">
            <p className="overline">THE BUILDER / BUILDORA DEVELOPERS</p>
            <h3>Then theory met<br />a paying client.</h3>
            <p>Founded a development studio and learned the less glamorous parts of building: scope, QA, deployment, revisions, and making the thing work outside localhost.</p>
            <div className="oversized-proof"><strong>50+</strong><span>client builds shipped</span></div>
            <div className="oversized-proof proof-alt"><strong>~$5K</strong><span>monthly revenue</span></div>
          </div>
        </article>

        <article className="story-node story-security">
          <div className="story-index"><span>NODE 03</span><b>OCT—DEC 2025</b></div>
          <div className="story-copy" data-flow data-flow-direction="left">
            <p className="overline">THE DEFENDER / CENTRIENT</p>
            <h3>Real systems generate<br />real noise.</h3>
            <p>Supported enterprise monitoring across Microsoft Defender, Mimecast, Active Directory, and cloud telemetry. Two hundred alerts before lunch has a way of sharpening prioritization.</p>
            <div className="security-counter"><div><strong>5,000+</strong><span>endpoints monitored</span></div><div><strong>200+</strong><span>alerts triaged daily</span></div></div>
            <p className="small-proof">Correlated signals, documented repeatable investigation workflows, and made escalation decisions easier to audit.</p>
          </div>
        </article>

        <article className="story-node story-crypton">
          <div className="story-index"><span>NODE 04</span><b>2026—NOW</b></div>
          <div className="story-copy" data-flow data-flow-direction="right">
            <p className="overline">THE FOUNDER / CRYPTON</p>
            <h3>Passwords had<br />a good run.</h3>
            <p>Co-founding a device-bound identity platform where trusted hardware—not a reusable secret—becomes the security boundary.</p>
            <div className="crypton-system" aria-label="Crypton system metrics">
              <div><span>05</span><small>services</small></div><i>↔</i><div><span>04</span><small>public endpoints</small></div><i>↔</i><div><span>24H</span><small>recovery delay</small></div>
            </div>
            <p className="small-proof">Hardware-backed keys. Challenge-response authentication. Revocation. Recovery. Early-access users currently testing the edges.</p>
          </div>
        </article>
      </section>

      <section className="work" id="work">
        <div className="work-heading" data-flow data-flow-direction="left">
          <p className="chapter-label">02 — SELECTED SYSTEMS</p>
          <h2>Five things worth<br /><span>clicking.</span></h2>
          <p>Click anything that looks suspicious. That advice applies only on this portfolio.</p>
        </div>

        <div className="project-list">
          {projects.map((project, index) => {
            const isActive = activeProject === index;
            return (
              <article
                className={`project ${isActive ? "is-active" : ""}`}
                key={project.name}
                style={{ "--project-color": project.color } as CSSProperties}
                data-flow
                data-flow-direction={index % 2 === 0 ? "left" : "right"}
                onPointerMove={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  event.currentTarget.style.setProperty("--local-x", `${event.clientX - bounds.left}px`);
                  event.currentTarget.style.setProperty("--local-y", `${event.clientY - bounds.top}px`);
                }}
              >
                <button className="project-trigger" onClick={() => setActiveProject(isActive ? null : index)} aria-expanded={isActive}>
                  <span className="project-number">{project.number}</span>
                  <span className="project-name">{project.name}</span>
                  <span className="project-type">{project.type}</span>
                  <span className="project-toggle" aria-hidden="true">{isActive ? "CLOSE ×" : "OPEN +"}</span>
                </button>
                <div className="project-reveal" aria-hidden={!isActive}>
                  <div className="project-thesis"><p>{project.thesis}</p><span>{project.stack}</span></div>
                  <div className="project-metrics">{project.metrics.map((metric) => <strong key={metric}>{metric}</strong>)}</div>
                  <ul>{project.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                </div>
              </article>
            );
          })}
        </div>

        <div className="archive-note"><span>STILL IN THE LAB</span><p>TinyVulnScanner, EDUAI, BillShield, AI Outfit Recommender, CTF write-ups, and the builds that taught me what not to do twice.</p><a href="https://github.com/atharv109?tab=repositories" target="_blank" rel="noreferrer">Enter the GitHub archive ↗</a></div>
      </section>

      <section className="research" id="research">
        <div className="research-orbit" aria-hidden="true" data-flow data-flow-direction="left"><span /><span /><span /><b>?</b></div>
        <div className="research-copy" data-flow data-flow-direction="right">
          <p className="chapter-label">03 — CURRENT RESEARCH / PROF. MAHANTH GOWDA</p>
          <h2>Can a machine read<br />a schematic <em>without</em><br />pretending it understood?</h2>
          <p>Developing a human-in-the-loop annotation assistant for PCB schematics. The system detects symbols, extracts text, traces wires, drafts structured JSON, and leaves the uncertain decisions exactly where they belong: with a human reviewer.</p>
          <div className="research-steps"><span>DETECT</span><i>→</i><span>STRUCTURE</span><i>→</i><span>CORRECT</span><i>→</i><span>VALIDATE</span></div>
        </div>
      </section>

      <section className="capabilities" id="capabilities">
        <div className="capability-heading" data-flow data-flow-direction="right"><p className="chapter-label">04 — WHAT THE SYSTEM CAN DO</p><h2>Depth in security.<br />Range in building.</h2></div>
        <div className="capability-marquee">
          {skillGroups.map((group, groupIndex) => (
            <div className="capability-row" key={group[0]} data-flow data-flow-direction={groupIndex % 2 === 0 ? "left" : "right"}>
              <span>{group[0]}</span>
              <div>{group.slice(1).map((skill) => <strong key={skill}>{skill}</strong>)}</div>
              <b>0{groupIndex + 1}</b>
            </div>
          ))}
        </div>
        <div className="credential-band"><div><span>VALIDATED</span><strong>CompTIA Security+</strong><small>January 2026</small></div><div><span>COMPETITION</span><strong>LA CTF 2026</strong><small>Solo · Top 100</small></div><div><span>LOCATION</span><strong>State College</strong><small>Pennsylvania, USA</small></div></div>
      </section>

      <section className="contact" id="contact">
        <p className="chapter-label">05 — ESTABLISH A CONNECTION</p>
        <h2 data-flow data-flow-direction="left">Bring me a difficult<br />system.</h2>
        <p className="contact-sub" data-flow data-flow-direction="right">Cybersecurity internships, research collaborations, ambitious products—or a genuinely good reason to debate passwords.</p>
        <a className="email-link" href="mailto:atharvm2005@gmail.com" data-flow data-flow-direction="left"><span>atharvm2005@gmail.com</span><b>↗</b></a>
        <div className="contact-footer">
          <a href="https://www.linkedin.com/in/atharv-mittal/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          <a href="https://github.com/atharv109" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="#top">State College, PA ↑</a>
        </div>
      </section>

      <footer>
        <p>© 2026 ATHARV MITTAL</p>
        <p>BUILT WITH CODE, AI ASSISTANCE, AND HUMAN JUDGMENT.</p>
        <p>STILL FIGURING IT OUT. THAT&apos;S THE POINT.</p>
      </footer>
    </main>
  );
}
