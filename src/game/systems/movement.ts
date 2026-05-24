/**
 * Enemy AI movement + melee attack system.
 *
 * Each tick: for every entity, decrement attack cooldown, then either
 * walk toward the player (if outside reach) or attack (if in range +
 * cooldown ready).
 *
 * The player object is mutated directly (hp/dead flags) and floating
 * damage texts are pushed into the passed-in array. The caller is
 * expected to have a reference to the player living inside its
 * setStateAsync callback — we operate on whatever player object is
 * passed in.
 *
 * Boundary: game layer. Must NOT import from React, render/, or touch
 * Canvas APIs.
 */

import type { Entity, FloatingText } from "../../types";

// Mutable player shape used by this system.
// We only require the fields actually read/written here.
export interface MovablePlayer {
  x: number;
  y: number;
  hp: number;
  radius: number;
  dead?: boolean;
  atkCd: number;
  currentStats: { con: number };
}

export function tickMobAI(
  player: MovablePlayer,
  dt: number,
  entities: Entity[],
  texts: FloatingText[],
): void {
  entities.forEach((e) => {
    e.atkCd -= dt;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d > player.radius + e.size + 5) {
      e.x += ((player.x - e.x) / d) * e.speed * dt;
      e.y += ((player.y - e.y) / d) * e.speed * dt;
    } else if (e.atkCd <= 0) {
      e.atkCd = 1.5;
      const dmg = Math.max(1, e.atk - player.currentStats.con);
      player.hp -= dmg;
      texts.push({
        id: Math.random(),
        x: player.x,
        y: player.y - 30,
        text: `-${Math.floor(dmg)}`,
        color: "#e74c3c",
        life: 1,
      });
      if (player.hp <= 0) {
        player.dead = true;
        player.atkCd = 3;
      }
    }
  });
}
