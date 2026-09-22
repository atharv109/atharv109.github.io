# Portfolio Rebuild — Grilling Session State (saved 2026-09-22)

## Project

Rebuild the portfolio at this repo (atharv109.github.io) from scratch, using
the "ATHARV MITTAL — COMPLETE PROFILE, A TO Z" document as the master evidence
vault. Rules from that doc apply: no invented facts, no unverifiable claims,
no dead links.

## LOCKED DECISIONS (do not re-litigate)

1. **Primary job of the site:** Convert recruiters (A-primary), creative wow
   as secondary seasoning (B-secondary). Must survive a 30-60 second phone skim.
2. **Positioning:** Software engineer with security credentials and product
   experience. SWE-first, security as a differentiator.
3. **One fixed site.** No role-tailored views, no lens toggles, no multiple
   deployments. Order sections so the first screen works for everyone.
4. **Two-tier content:**
   - Featured tier (~6 full cards): VulnSwarm-VEX, Eleventh Round, Prompt
     Optimiser, Adversary Emulation & Detection Lab, Acctomatic, Crypton.
   - Archive tier (compact rows): TinyVulnScanner, EDUAI, Proto Paper, BillShield.
   - About section: degree, cert, current role, location, focus, experience.
   - Contact section: oversized CTA + email + socials.
5. **Single page.** One long scroll with section anchors + sticky nav.

## LOCKED — Visual Direction (v2 redesign)

- **Palette:** True black `#050505`, surface `#111111`, electric orange accent
  `#FF4D00`, cyan secondary `#00E5FF`, muted text `#888888`.
- **Fonts:** Space Grotesk display, JetBrains Mono for labels/metrics/tags.
- **Hero:** Full-viewport lazy-loaded Three.js particle/network field
  (mouse-reactive on desktop, static fallback on mobile) + oversized kinetic
  headline "ATHARV MITTAL".
- **Work:** Horizontal drag gallery of full-height panels + compact archive list.
- **About:** Bento grid with one accent cell.
- **Contact:** Oversized kinetic type CTA + magnetic email button.
- **Motion:** GSAP ScrollTrigger reveals, kinetic type, custom cursor, film grain,
  `prefers-reduced-motion` honored.

## LOCKED — Hero Headline

> "Full-stack engineer. Security-trained. Product-obsessed."

## BUILT (v2)

- React 19 + TypeScript + Vite + Tailwind CSS site, rebuilt from scratch in `src/`.
- Lazy-loaded Three.js hero particle field; GSAP ScrollTrigger reveals; kinetic
  type on hero and contact.
- Horizontal drag gallery for six featured projects.
- Bento About grid and oversized Contact CTA.
- Custom cursor + film grain overlay.
- Code-split bundles: Three.js and GSAP in separate chunks; main bundle ~255 kB.
- Verified links only: Eleventh Round live site, Prompt Optimiser GitHub,
  Acctomatic live site, Crypton GitHub, TinyVulnScanner GitHub, EDUAI GitHub,
  Proto Paper GitHub, BillShield GitHub + Vercel demo.

## STILL TO RESOLVE / NEXT STEPS

1. **Deploy:** commit and push to trigger GitHub Pages deploy; verify live URL.
2. **Polish:** project panel visuals feel plain — consider abstract generative
   SVGs or richer hover states.
3. **Nav bug:** nav appears on hero load in some screenshot states; verify
   scroll-triggered visibility on actual devices.
4. **Content:** add a resume download once a PDF is available.

## RESUME PROMPT

Paste this to resume:

  Resume the portfolio rebuild. The v2 site is built in `src/` with the
  Awwwards-inspired redesign implemented. Continue from the STILL TO
  RESOLVE list, starting with deploy verification and polish.
