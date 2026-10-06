---
title: Resume
tagline: Atharv Mittal — B.S. Cybersecurity, Penn State '28 · atharvm2005@gmail.com · 425-832-9409
stack:
  - Python
  - Rust
  - TypeScript
  - WebAuthn
metrics: []
links:
  - label: PDF
    url: /resume/Atharv_Mittal_Resume_Full.pdf
order: 3
---

## Education

**The Pennsylvania State University**, University Park, PA — *Expected May 2028*

B.S. in Cybersecurity | GPA 3.5 / 4.0 | CompTIA Security+ (SY0-701), January 2026

&nbsp;

## Software Experience

**Co-founder & CTO, Crypton** | cryptonid.tech — *April 2026 – Present*

- Co-founded an identity startup and lead its engineering: passkey login that ties each account to a trusted device, so a stolen password can't get in. Now in early access.
- Built passkey (WebAuthn) registration, login, device management and recovery in a **Rust (Axum)** backend with PostgreSQL and Redis, issuing JWT sessions.
- Blocked replayed and brute-force requests, locking accounts after **5 failed logins** and rejecting requests outside a **60-second** window, by writing a Rust gateway with Redis nonces, rate limiting, audit logs and a policy engine.
- Required a **fresh passkey signature for 4 sensitive actions** (rotating API keys, exporting data, adding admins, deleting resources), and blocked requests being added during account recovery.
- Designed the APIs and data model for **5 services** (identity backend, gateway, demo SaaS app, operator admin panel, marketing site) through an SDK-first architecture.
- Built the admin panel for operators to manage devices, sessions, audit logs, roles, recovery and policy, and designed the marketing site with a 3D visualization and an interactive attack simulator.

&nbsp;

**Founder, Buildora Developers** — *January 2026 – Present*

- Founded and grew a web agency from zero, building websites for local service businesses while studying full time.
- Won and kept **about 50 paying clients in 9+ months**, shipping and running their sites in React, Next.js, TypeScript, Supabase and Stripe.
- Automated lead sourcing, site generation, video pitches and cold outreach end to end with **12 AI agents across 6 external services**, by orchestrating Claude API tool calls in LangGraph streaming **every run** to a live dashboard.
- Integrated Stagehand and Browserbase for browser automation, Apify and Firecrawl for scraping, Hunter.io for contacts, ffmpeg for video, Resend for email and Supabase for storage.
- Earlier built an outreach system in n8n, Outscraper, Apollo, the Google PageSpeed API, Instantly.ai and Airtable, targeting HVAC, roofing and coffee-shop owners.
- Designed niche client sites (med spa, dental) with their own design systems, plus the Buildora products site.

&nbsp;

**Eleventh Round** | eleventh-rnd.com | Paid client build — *2026*

- Live career platform for combat sports where fighters, managers and promotions each get a dashboard.
- Built dashboards for **3 user types**, a podcast section and an apparel line in React, TypeScript, Vite and Tailwind.
- Designed to Awwwards-level standards with a scroll-driven cinematic hero, in GSAP and Three.js.

&nbsp;

## Research

**VulnSwarm-VEX** | First-author paper — *Under submission, IEEE ICTAI 2026*

- First-author research paper, now in peer review: a tool that answers whether a newly announced vulnerability actually affects your code or can be safely ignored.
- Produced **75 findings** from **412 vulnerability records** across **2,479 dependencies** in **5 real projects** by building a Python pipeline over the OSV vulnerability database.
- Sorted **77 advisories** into **19 affected**, **6 not affected** and **52 sent to manual review** with a deterministic decision process that emits VEX verdicts.
- Guaranteed AI could never override a decision, with **0 changed verdicts across 231 comparisons** and **3 AI providers** and a **14/14** benchmark score, by checking every verdict in Z3 and limiting AI to notes.
- Found and fixed bugs during the study, including an OSV batch endpoint that returned only stubs and a keyword match that misread "rce" inside other words.

&nbsp;

**Undergraduate Research** | Mahanth Gowda's Lab, Penn State — *May 2026 – Present*

- Building a pipeline that reads circuit diagrams available only as images and maps which components are wired together, so they no longer need to be labeled entirely by hand.
- Designed **8 stages**: detector, OCR, wire tracer, graph builder, verifier, confidence engine, review queue, export.
- Raised pin detection recall to **0.94** by tracing misses to **1–3 px** pins falling below YOLOv8's stride-8 limit, then tiling the images to recover them.
- Cut wire-tracing noise by masking detected components before tracing connections with OpenCV.

&nbsp;

**Research proposal** | Malware detection in encrypted traffic — *2026*

- Surveyed prior work and presented a proposal for using explainable machine learning to catch malware early in encrypted network flows.

&nbsp;

## Projects

**TinyVulnScanner** | Python — *Sep – Nov 2025*

- Tool that checks a computer's network ports and web pages for common security holes.
- Made scanning about **70% faster** across **500+ ports** with multithreading; flags reflected XSS and SQL injection and writes HTML and JSON reports.

&nbsp;

**A Voice Made of Blinks** | Built with Claude: Life Sciences hackathon — *July 2026*

- Built **in 1 week**: a tool that lets ICU patients who can't speak or move tell nurses their needs by blinking.
- Added per-patient calibration of scan speed and reordered the needs list so common requests come first.

&nbsp;

**ProtoPaper** | Hackathon project — *January 2026*

- Tool that turns a research paper into experiment materials and Python simulation guidance in **under 2 minutes**; led the frontend and contributed to the backend.

&nbsp;

**Prompt Optimiser** | Browser extension — *2026*

- Chrome and Edge extension that rewrites prompts through a **6-stage** pipeline on Llama 3.3 70B (Groq API), working inside ChatGPT, Claude and Gemini.

&nbsp;

**Acctomatic** | Invoice extraction for accounting firms — *2026*

- Planned a tool that pulls fixed fields from invoices into Excel, with confidence scores, duplicate-invoice detection and billing reminders.
- Researched the market first and found competitors Botkeeper and Bench shut down over their business models, not accuracy; choose a deployment-and-services model.

&nbsp;

## Experience & Leadership

**Cybersecurity Intern**, Centrient Pharmaceuticals, Gurugram, India — *Oct – Dec 2025*

- Defended a global drug manufacturer as a security operations intern, watching for signs of attack.
- Triaged **200+ alerts a day** across **5,000+ computers** in Microsoft Defender and Mimecast with the IT team, escalating real incidents.

&nbsp;

**Student Caller**, Lion State, Penn State Alumni Telefund — *Summer 2026*

- Called Penn State alumni on behalf of the university, and helped new callers learn faster by writing per-major cheat sheets (courses, buildings, campus news) the team **still uses**.

&nbsp;

**Teaching & Leadership**

- Taught an OWASP Top 10 security session for CYBER 100.1.
- Led my school's Cybersecurity Club (2022 – 2023).

&nbsp;

## Competitions

Capture the Flag: LACTF 2026, solo, **Top 100**; 0xFun CTF 2026, solo, **Top 110+**; BSides CTF 2026: Hack The Box.

&nbsp;

## Skills

**Languages:** Python, Java (OOP), JavaScript/TypeScript, Rust, SQL, Bash, PowerShell

**Backend:** Axum, Node.js, REST API design, data modeling, PostgreSQL, Redis, Supabase, Stripe, JWT, Git

**Frontend:** React, Next.js, Vite, Tailwind, GSAP, Framer Motion, Three.js

**AI & ML:** LangGraph, Claude API tool calling, Groq, PyTorch/YOLOv8, OpenCV, OCR

**Security:** WebAuthn/passkeys, Z3/SMT, OSV/VEX, Wireshark, Nmap, Metasploit, Wazuh, Elastic, Defender

**Automation:** n8n, Stagehand, Browserbase, Apify, Firecrawl, Airtable

**Coursework:** CYBER 100.1, SRA 111 (Security and Risk Analysis)

**Certifications & languages:** CompTIA Security+ (SY0-701), English, Hindi, Punjabi