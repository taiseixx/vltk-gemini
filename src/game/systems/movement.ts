import { GameState, Entity } from "../../types";

export function tickMovement(
  state: GameState,
  dt: number,
  entities: Entity[]
): void {
  const p = state.player;
  if (p.dead) return;

  // 1. Auto target
  if (state.auto && !p.target && !p.moving) {
    let minDist = 400;
    let nearest: Entity | null = null;
    entities.forEach((e) => {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });
    p.target = nearest;
  }

  // 2. Movement handling
  if (p.target) {
    const targetId = p.target.id;
    const t = entities.find((e) => e.id === targetId);
    if (!t) {
      p.target = null;
    } else {
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      p.facing = t.x > p.x ? 1 : -1;
      if (d > p.radius + t.size + 20) {
        const dx = t.x - p.x;
        const dy = t.y - p.y;
        p.x += (dx / d) * p.speed * dt;
        p.y += (dy / d) * p.speed * dt;
        p.moving = true;
      } else {
        p.moving = false;
      }
    }
  } else if (p.moving) {
    const d = Math.hypot(p.targetX - p.x, p.targetY - p.y);
    p.facing = p.targetX > p.x ? 1 : -1;
    if (d > 10) {
      p.x += ((p.targetX - p.x) / d) * p.speed * dt;
      p.y += ((p.targetY - p.y) / d) * p.speed * dt;
    } else {
      p.moving = false;
    }
  }

  // 3. Enemy movement AI toward player
  entities.forEach((e) => {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > p.radius + e.size + 5) {
      e.x += ((p.x - e.x) / d) * e.speed * dt;
      e.y += ((p.y - e.y) / d) * e.speed * dt;
    }
  });
}
