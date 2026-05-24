/**
 * Per-frame particle & floating-text physics ticks.
 *
 * Pure mutations on the passed-in arrays: advance position, decrement
 * life, expand certain particle types, splice dead entries.
 *
 * Boundary: game layer. Must NOT import from React, render/, or touch
 * Canvas APIs.
 */

import type { Particle, FloatingText } from "../../types";

export function tickParticles(particles: Particle[], dt: number): void {
  for (let index = particles.length - 1; index >= 0; index--) {
    const p = particles[index];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.rotation !== undefined && p.vr !== undefined) {
      p.rotation += p.vr * dt;
    }
    if (p.isBlast || p.type === 'ring' || p.type === 'shockwave') {
      p.size += dt * (p.type === 'shockwave' ? 200 : 100);
    }
    if (p.life <= 0) {
      particles.splice(index, 1);
    }
  }
}

export function tickFloatingTexts(texts: FloatingText[], dt: number): void {
  for (let index = texts.length - 1; index >= 0; index--) {
    const t = texts[index];
    t.y -= 40 * dt;
    t.life -= dt;
    if (t.life <= 0) {
      texts.splice(index, 1);
    }
  }
}
