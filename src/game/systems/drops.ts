/**
 * Drop pickup system.
 *
 * Each tick: iterate drops within pickup range, call the provided
 * equipItem callback to consume the drop into the player (returns
 * gold value), accumulate gold, splice picked items off the drops
 * array. Pickup range and gold-boost depend on companion presence.
 *
 * equipItem is passed as a callback because its implementation lives
 * in the React component and depends on closures over current refs/state
 * that aren't worth threading through this module.
 *
 * Boundary: game layer. Must NOT import from React, render/, or touch
 * Canvas APIs.
 */

import type { Drop } from "../../types";

export interface PickupContext {
  playerX: number;
  playerY: number;
  hasCompanion: boolean;
}

export function tickPickupDrops(
  ctx: PickupContext,
  drops: Drop[],
  applyDrop: (drop: Drop) => number,
): number {
  let goldEarned = 0;
  const pickupRange = ctx.hasCompanion ? 180 : 50;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (Math.hypot(ctx.playerX - d.x, ctx.playerY - d.y) < pickupRange) {
      const goldVal = applyDrop(d);
      const boostedGold = ctx.hasCompanion ? Math.floor(goldVal * 1.15) : goldVal;
      goldEarned += boostedGold;
      drops.splice(i, 1);
    }
  }
  return goldEarned;
}
