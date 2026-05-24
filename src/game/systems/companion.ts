/**
 * Companion (linh thú) autonomous battle strike system.
 *
 * Ticks the companion's cooldown timer; when ready, finds the nearest
 * live enemy within range and applies damage + spawns trail particles +
 * floating damage text. If the floating-text buffer is full, accumulates
 * the damage into overflowDamageRef so the caller can show a single
 * aggregated text later.
 *
 * The timerRef and overflowDamageRef arguments are mutable boxes:
 * caller passes its React refs ({ current: number } shape). This module
 * mutates `.current` directly — no React knowledge required.
 *
 * Boundary: game layer. Must NOT import from React, render/, or touch
 * Canvas APIs.
 */

import type { GameState, Entity, Particle, FloatingText } from "../../types";

interface MutableNumberRef {
  current: number;
}

export function tickCompanion(
  state: GameState,
  dt: number,
  entities: Entity[],
  particles: Particle[],
  texts: FloatingText[],
  timerRef: MutableNumberRef,
  overflowDamageRef: MutableNumberRef,
): void {
  const comp = state.companion;
  if (!comp || state.state !== "PLAYING") return;

  timerRef.current -= dt;
  if (timerRef.current > 0) return;

  timerRef.current = Math.max(1.0, 4.5 - comp.level * 0.15);

  const p = state.player;
  let minDist = 350;
  let nearest: Entity | null = null;
  entities.forEach((e) => {
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d < minDist && e.hp > 0) {
      minDist = d;
      nearest = e;
    }
  });

  if (!nearest) return;

  // After the !nearest guard, TS still widens `nearest` to Entity | null
  // inside the forEach closure capture. Re-narrow with a local const.
  const target: Entity = nearest;

  const clawLvl = comp.equipment.weapon?.upgradeLvl || 0;
  const compDamage = Math.floor((15 + comp.level * 4 + clawLvl * 5) * (1 + comp.level * 0.05));

  target.hp -= compDamage;

  // Spawn beautiful trail effect from companion to nearest target
  const stepCount = 8;
  for (let i = 0; i <= stepCount; i++) {
    const ratio = i / stepCount;
    const px = p.x + (target.x - p.x) * ratio;
    const py = p.y + (target.y - p.y) * ratio;
    particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 0.35,
      color: "#f1c40f",
      size: 2.2,
    });
  }

  // Combine companion damage if there's too much text
  if (texts.length < 35) {
    texts.push({
      id: Math.random(),
      x: target.x,
      y: target.y - 40,
      text: `☯️ [${comp.name}] HỒ TRỢ KÍCH SÁT -${compDamage}`,
      color: "#ffca28",
      life: 1.4,
    });
  } else {
    overflowDamageRef.current += compDamage;
  }
}
