// moth.ts — the cursor companion (ref §10). Locked, an ASCII span caged in
// the trophy drawer's rare card flaps `/\` ⇄ `\/` in overlay2. On
// free-the-moth it is re-parented to a fixed .moth-host (z 150, never
// interactive) and seek-orbits the pointer on an ellipse (rx 44, one orbit ≈
// 2.9 s, wobble, re-randomised every ~2.5 s), wander mode when the pointer is
// idle > 4 s / absent / no hover device. Clicking the unlocked cage card
// toggles free ⇄ returning (flies to the card centre, re-cages within 14 px).
// px/s units (the moth is a DOM element — steering.ts is used directly);
// dt clamped to 0.05 s. State: sessionStorage am-moth-state every 250 ms +
// pagehide, restored next page; cage state in localStorage am-trophy-ui:moth.
// Reduced motion: never starts (ref §14) — the drawer's caged span stays a
// static sprite.

import { arrive } from './ascii/steering';
import type { Vec } from './ascii/steering';
import { getStr, setStr, getSessionJSON, setSessionJSON } from './persistent';
import { isUnlocked } from './trophies';

const SPRITES = [String.fromCharCode(47, 92), String.fromCharCode(92, 47)]; // "/\" and "\/"
const MAX_SPEED = 900;
const MAX_FORCE = 2600;
const ARRIVE_RADIUS = 90;
const ORBIT_RATE = 0.35 * 2 * Math.PI; // rad/s — one orbit ≈ 2.9 s
const ORBIT_RX = 44;
const WOBBLE_RATE = 1.7;
const WOBBLE_X = 26;
const WOBBLE_Y = 26 * 0.7;
const FLAP_RATE = 15; // × dt → ≈7–22 flaps/s with the speed term
const FOLLOW_MARGIN = 10;
const WANDER_MARGIN = 48;
const WANDER_REPICK = 40; // px — re-pick when within this of the wander target
const WANDER_SPEED_FACTOR = 0.45;
const RECAGE_RADIUS = 14;
const IDLE_MS = 4000;
const RESCHED_MIN = 2500; // × (0.5–1.5) re-randomise interval
const SAVE_EVERY = 250;
const STATE_LEN = 11;
const MOTH_UI_KEY = 'trophy-ui:moth';
const MOTH_STATE_KEY = 'moth-state';
const RARE = 'free-the-moth';

type Mode = 'caged' | 'free' | 'returning';

class Moth {
  private cage: HTMLElement;
  private span: HTMLElement;
  private host: HTMLElement | null = null;
  private mode: Mode = 'caged';
  private reduced: boolean;
  private hasHover = false;

  private pos: Vec = { x: 0, y: 0 };
  private vel: Vec = { x: 0, y: 0 };
  private out: Vec = { x: 0, y: 0 };
  private orbitAngle = Math.random() * Math.PI * 2;
  private orbitRadius = ORBIT_RX;
  private wobble = Math.random() * Math.PI * 2;
  private flapPhase = 0;
  private nextResched = 0;

  private pointerX = 0;
  private pointerY = 0;
  private pointerIn = false;
  private lastMove = 0;
  private wander: Vec | null = null;

  private raf = 0;
  private lastFrame = 0;
  private haveFrame = false;
  private lastSave = 0;

  constructor(cage: HTMLElement) {
    this.cage = cage;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hasHover = matchMedia('(hover: hover)').matches;
    this.span = cage.querySelector<HTMLElement>('.moth') ?? document.createElement('span');
    this.span.className = 'moth';
    this.span.setAttribute('aria-hidden', 'true');
    if (!this.span.textContent) this.span.textContent = SPRITES[0];

    const saved = getSessionJSON<unknown>(MOTH_STATE_KEY, null);
    const restorable = this.isStateArray(saved);
    if (restorable) this.restore(saved as number[]);

    if (this.isUnlockedMoth()) this.span.classList.add('is-free');
    if (getStr(MOTH_UI_KEY, 'caged') === 'free') {
      this.free(false); // restored mid-flight — keep the restored position
    } else {
      cage.appendChild(this.span);
      this.mode = 'caged';
    }

    cage.addEventListener('click', this.onCageClick);
    document.addEventListener('trophy:unlocked', this.onUnlocked);
    window.addEventListener('pointermove', this.onPointerMove);
    const flip = (inside: boolean): void => {
      this.pointerIn = inside;
    };
    document.documentElement.addEventListener('pointerenter', () => flip(true));
    document.documentElement.addEventListener('pointerleave', () => flip(false));
    window.addEventListener('pointerdown', this.onPointerMove);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.saveState);

    this.lastMove = performance.now();
    this.resume();
  }

  private isUnlockedMoth(): boolean {
    return isUnlocked(RARE);
  }

  private isStateArray(v: unknown): v is number[] {
    return Array.isArray(v) && v.length === STATE_LEN && v.every((n) => Number.isFinite(n));
  }

  private restore(s: number[]): void {
    [
      this.pos.x,
      this.pos.y,
      this.vel.x,
      this.vel.y,
      this.orbitAngle,
      this.orbitRadius,
      this.wobble,
      this.flapPhase,
      this.pointerX,
      this.pointerY,
    ] = s;
    this.lastMove = performance.now() - s[10];
    // A stale restore across a viewport change lands inside the frame again.
    this.pos.x = Math.min(Math.max(this.pos.x, FOLLOW_MARGIN), window.innerWidth - FOLLOW_MARGIN);
    this.pos.y = Math.min(Math.max(this.pos.y, FOLLOW_MARGIN), window.innerHeight - FOLLOW_MARGIN);
  }

  private onPointerMove = (e: PointerEvent | MouseEvent): void => {
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
    this.pointerIn = true;
    this.lastMove = performance.now();
  };

  private onCageClick = (): void => {
    if (this.reduced) return; // reduced motion: the moth never frees
    if (!this.isUnlockedMoth()) return; // locked cage is inert
    if (this.mode === 'caged') this.free(true);
    else if (this.mode === 'free') this.mode = 'returning';
    else if (this.mode === 'returning') this.mode = 'free';
  };

  private onUnlocked = (e: Event): void => {
    const detail = (e as CustomEvent<{ id: string }>).detail;
    if (detail.id !== RARE) return;
    this.span.classList.add('is-free');
    if (this.mode === 'caged') this.free(true);
  };

  private onVisibility = (): void => {
    if (document.hidden) {
      this.saveState();
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.haveFrame = false; // next frame's dt restarts
    } else {
      this.resume();
    }
  };

  private resume(): void {
    if (this.raf || this.reduced) return;
    this.lastFrame = performance.now();
    this.haveFrame = false;
    this.raf = requestAnimationFrame(this.tick);
  }

  private free(reposition: boolean): void {
    const wasCaged = this.mode === 'caged';
    this.mode = 'free';
    setStr(MOTH_UI_KEY, 'free');
    this.span.classList.add('is-free');
    if (!this.host) {
      this.host = document.createElement('div');
      this.host.className = 'moth-host';
      document.body.appendChild(this.host);
    }
    if (this.span.parentElement !== this.host) {
      if (wasCaged && reposition) {
        // Launch from the current on-screen cage position.
        const r = this.cage.getBoundingClientRect();
        this.pos.x = r.right - 20;
        this.pos.y = r.top + r.height / 2;
      }
      this.host.appendChild(this.span);
    }
    this.wander = null;
  }

  private tick = (now: number): void => {
    this.raf = 0;
    let dt = this.haveFrame ? (now - this.lastFrame) / 1000 : 0;
    this.haveFrame = true;
    this.lastFrame = now;
    dt = Math.min(dt, 0.05);

    if (this.mode === 'caged') {
      // Right edge, vertically centred in the cage card (ref §10).
      this.flapStep(0, dt);
      const cs = this.cageDimensions();
      this.setTransform(cs.cageX, cs.cageY);
      this.saveMaybe(now);
      this.raf = requestAnimationFrame(this.tick);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const target = { x: 0, y: 0 };
    const following =
      this.mode === 'free' && this.hasHover && this.pointerIn && now - this.lastMove <= IDLE_MS;

    if (this.mode === 'returning') {
      const r = this.cage.getBoundingClientRect();
      target.x = r.left + r.width / 2;
      target.y = r.top + r.height / 2;
      if (Math.hypot(target.x - this.pos.x, target.y - this.pos.y) < RECAGE_RADIUS) {
        this.reCage(now);
        return;
      }
    } else if (following) {
      if (now >= this.nextResched) this.resched(now);
      this.orbitAngle += ORBIT_RATE * dt;
      this.wobble += WOBBLE_RATE * dt;
      target.x = this.pointerX + Math.cos(this.orbitAngle) * this.orbitRadius;
      target.y = this.pointerY + Math.sin(this.orbitAngle) * this.orbitRadius * 0.8;
      target.x += Math.sin(1.3 * this.wobble) * WOBBLE_X;
      target.y += Math.cos(this.wobble) * WOBBLE_Y;
    } else {
      const margin = Math.min(WANDER_MARGIN, w / 4, h / 4);
      if (!this.wander || Math.hypot(this.wander.x - this.pos.x, this.wander.y - this.pos.y) < WANDER_REPICK) {
        this.wander = {
          x: margin + Math.random() * (w - margin * 2),
          y: margin + Math.random() * (h - margin * 2),
        };
      }
      target.x = this.wander.x;
      target.y = this.wander.y;
    }

    arrive(this.out, this.pos, this.vel, target, {
      maxSpeed: following ? MAX_SPEED : WANDER_SPEED_FACTOR * MAX_SPEED,
      maxForce: MAX_FORCE,
      arriveRadius: ARRIVE_RADIUS,
    });
    this.vel.x += this.out.x * dt;
    this.vel.y += this.out.y * dt;

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    // Screen margin (10 px while following/wandering).
    if (this.pos.x < FOLLOW_MARGIN || this.pos.x > w - FOLLOW_MARGIN) {
      this.pos.x = Math.min(Math.max(this.pos.x, FOLLOW_MARGIN), w - FOLLOW_MARGIN);
      this.vel.x = 0;
    }
    if (this.pos.y < FOLLOW_MARGIN || this.pos.y > h - FOLLOW_MARGIN) {
      this.pos.y = Math.min(Math.max(this.pos.y, FOLLOW_MARGIN), h - FOLLOW_MARGIN);
      this.vel.y = 0;
    }

    this.flapStep(Math.hypot(this.vel.x, this.vel.y), dt);
    this.setTransform(this.pos.x, this.pos.y);
    this.saveMaybe(now);
    this.raf = requestAnimationFrame(this.tick);
  };

  private reCage(now: number): void {
    this.mode = 'caged';
    setStr(MOTH_UI_KEY, 'caged');
    this.vel.x = 0;
    this.vel.y = 0;
    this.span.classList.remove('is-free');
    this.cage.appendChild(this.span);
    const cs = this.cageDimensions();
    this.flapStep(0, 0);
    this.setTransform(cs.cageX, cs.cageY);
    this.raf = requestAnimationFrame(this.tick);
    void now;
  }

  /** flap phase advance + sprite swap: `/\` ⇄ `\/`. */
  private flapStep(speed: number, dt: number): void {
    this.flapPhase += FLAP_RATE * (0.5 + speed / MAX_SPEED) * dt;
    this.span.textContent = SPRITES[Math.floor(this.flapPhase) % 2];
  }

  private cageDimensions(): { cageX: number; cageY: number } {
    const r = this.cage.getBoundingClientRect();
    return { cageX: r.width - 20, cageY: r.height / 2 };
  }

  private setTransform(x: number, y: number): void {
    this.span.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  private resched(now: number): void {
    this.nextResched = now + RESCHED_MIN * (0.5 + Math.random());
    this.orbitRadius = ORBIT_RX * (0.7 + Math.random() * 0.9);
    this.orbitAngle = Math.random() * Math.PI * 2;
  }

  private saveMaybe(now: number): void {
    if (now - this.lastSave < SAVE_EVERY) return;
    this.lastSave = now;
    this.saveState();
  }

  private saveState = (): void => {
    const idle = performance.now() - this.lastMove;
    setSessionJSON(MOTH_STATE_KEY, [
      this.pos.x,
      this.pos.y,
      this.vel.x,
      this.vel.y,
      this.orbitAngle,
      this.orbitRadius,
      this.wobble,
      this.flapPhase,
      this.pointerX,
      this.pointerY,
      Math.max(0, idle),
    ]);
  };
}

let started = false;

/** Start the moth if its cage exists and motion is allowed. Idempotent. */
export function initMoth(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // ref §10: never starts
  const cage = document.querySelector<HTMLElement>('.trophy-cage');
  if (!cage) return;
  new Moth(cage);
}