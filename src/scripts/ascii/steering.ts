// steering.ts — ref §17.3 "seek+arrive steering used by moth and boids".
// Units: velocity cells/s (isotropic — callers aspect-correct x beforehand),
// force cells/s². DOM-free and node-tested. The boids (Task 10) compose these
// per-contribution and clamp the total themselves via `limit`.

export interface Vec {
  x: number;
  y: number;
}

export interface SteerOpts {
  maxSpeed: number;
  maxForce: number;
  arriveRadius: number;
}

/** Scale v down to length `max` when it exceeds it; else untouched. */
export function limit(v: Vec, max: number): void {
  const d = Math.hypot(v.x, v.y);
  if (d > max) {
    const k = max / d;
    v.x *= k;
    v.y *= k;
  }
}

/** Force = desired velocity (full speed at the target) − current velocity,
    clamped to maxForce. */
export function seek(out: Vec, pos: Vec, vel: Vec, target: Vec, o: SteerOpts): void {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const d = Math.hypot(dx, dy) || 1e-6; // zero distance never NaNs
  out.x = (dx / d) * o.maxSpeed - vel.x;
  out.y = (dy / d) * o.maxSpeed - vel.y;
  limit(out, o.maxForce);
}

/** Seek with arrive: inside arriveRadius the desired speed scales down
    linearly so the agent settles instead of orbiting (ref §17.3). */
export function arrive(out: Vec, pos: Vec, vel: Vec, target: Vec, o: SteerOpts): void {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const d = Math.hypot(dx, dy) || 1e-6; // zero distance never NaNs
  const speed = d < o.arriveRadius ? o.maxSpeed * (d / o.arriveRadius) : o.maxSpeed;
  out.x = (dx / d) * speed - vel.x;
  out.y = (dy / d) * speed - vel.y;
  limit(out, o.maxForce);
}