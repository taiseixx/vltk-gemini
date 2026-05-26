import { GameState } from "../../types";

export function tickCombo(state: GameState, dt: number): void {
  const p = state.player;
  if (!p || p.dead) return;

  if (p.comboTimer !== undefined && p.comboTimer > 0) {
    p.comboTimer -= dt;
    if (p.comboTimer <= 0) {
      p.skillComboHistory = [];
    }
  }

  if (p.activeCombo) {
    p.activeCombo.timer -= dt;
    if (p.activeCombo.timer <= 0) {
      p.activeCombo = null;
    }
  }
}
