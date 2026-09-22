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
   - Featured tier (~6 full cards): Eleventh Round, VulnSwarm-VEX, Prompt
     Optimiser, Adversary Emulation & Detection Lab, Acctomatic, Crypton.
   - Archive tier ("Earlier builds", compact year-grouped rows): TinyVulnScanner,
     EDUAI, Proto Paper, BillShield, AI Outfit Recommender, A Voice Made of
     Blinks, Buildora Agent Pipeline, Android App.
   - Experience section: Centrient, Buildora, Crypton, Gowda research.
   - CTF results as a compact strip, not project cards.
5. **Single page.** One long scroll with section anchors + sticky floating nav.
   Case-study detail pages deferred to post-v1.

## LOCKED — Visual Direction

- **Palette:** Near-black dark burgundy background `#0D0404`, burnt orange
  accent `#E85A2D`, deep burgundy secondary `#7A1F1F`.
- **Fonts:** Space Grotesk display, JetBrains Mono for labels/metrics/tags.
- **Hero:** Three.js generative particle/network field (mouse-reactive on
  desktop, static fallback on mobile) + oversized kinetic headline.
- **Cards:** Dark glassy panels, thin border accents, abstract SVG visuals per
  project.

## LOCKED — Hero Headline

> "Full-stack engineer. Security-trained. Product-obsessed."

## BUILT (v1)

- React 19 + TypeScript + Vite site, rebuilt from scratch in `src/`.
- Three.js hero particle field with GSAP ScrollTrigger reveals.
- Six featured project cards with subagent-generated abstract SVG visuals.
- Year-grouped archive section.
- Experience, skills/competitions, contact, footer.
- Verified links only: Eleventh Round live site, Prompt Optimiser GitHub,
  Adversary Lab (no public repo), Acctomatic live site, Crypton GitHub,
  TinyVulnScanner GitHub, EDUAI GitHub, Proto Paper GitHub, BillShield GitHub +
  Vercel demo. Vulnswarm repo omitted because it is not publicly accessible.
- Build passes; preview tested on desktop and mobile.

## STILL TO RESOLVE / NEXT STEPS

1. **Performance:** main bundle is ~868 kB because Three.js + GSAP are bundled
   together. Consider lazy-loading Three.js hero or splitting chunks.
2. **Polish:** hero particle field visibility, mobile nav behavior, animation
   timing, spacing refinements.
3. **Content:** add a resume download once a PDF is available.
4. **Unresolved vault items that may affect future edits:** Vulnswarm repo
   visibility, acctomatic.com live status (confirmed 200), live portfolio URL.
5. **Deploy:** commit and push to trigger GitHub Pages deploy.

## RESUME PROMPT

Paste this to resume:

  Resume the portfolio rebuild. The v1 site is built in `src/` with the
  workflow-generated visuals already integrated. Continue from the STILL TO
  RESOLVE list, starting with performance optimization and polish.
