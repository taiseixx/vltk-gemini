import { GameState, Particle } from "../../types";
import { MAP_SIZE } from "../../constants";
import { getSectIdFromColor, getSectElement } from "../elements";

export function tickPlayerState(
  state: GameState,
  dt: number,
  particles: Particle[],
  actions: {
    addNotification: (txt: string, col: string) => void;
    shakeRef: { current: number };
  }
): GameState | null {
  const p = state.player;
  if (!p) return null;

  // Banner aura passive damage effect
  if (p.equipment.banner && !p.dead) {
    if (!p.atkCd) p.atkCd = 0; 
  }

  // Active state tick
  if (!p.dead) {
    if (p.rageActive) {
      p.rageTimer = Math.max(0, (p.rageTimer || 8.0) - dt);
      p.rage = Math.floor((p.rageTimer / 8.0) * (p.maxRage || 100));
      
      // Balanced continuous regeneration inside rage mode (0.6% Max HP + scaled stats)
      p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.006 + p.currentStats.con * 0.4 + 1.2) * dt);
      p.mp = Math.min(p.maxMp, p.mp + (p.currentStats.nei * 0.8 + 2.5) * dt);
      
      // Generate customized Elemental trail particles surrounding player!
      if (Math.random() < 0.4) {
        const sectId = getSectIdFromColor(p.color);
        const playerEl = getSectElement(sectId);
        const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
        const particleColor = elColor[playerEl] || '#fff';
        
        const radius = 25 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x: p.x + Math.cos(angle) * radius,
          y: p.y + Math.sin(angle) * radius,
          vx: -Math.sin(angle) * 70,
          vy: Math.cos(angle) * 70,
          life: 0.6,
          color: particleColor,
          size: 3 + Math.random() * 2,
        });
      }
      
      if (p.rageTimer <= 0) {
        p.rageActive = false;
        p.rage = 0;
        actions.addNotification("🛡️ Trạng thái bộc phát Ngũ Hành kết thúc!", "#95a5a6");
      }
    } else {
      // Balanced, challenging normal-state recovery
      p.hp = Math.min(p.maxHp, p.hp + (p.currentStats.con * 0.15 + 0.4) * dt);
      p.mp = Math.min(p.maxMp, p.mp + (p.currentStats.nei * 0.35 + 0.6) * dt);
      
      if (p.rage >= (p.maxRage || 100)) {
        p.rageActive = true;
        p.rageTimer = 8.0;
        p.rage = p.maxRage || 100;
        actions.shakeRef.current = 15;
        
        // Spawn spectacular shockwave ring upon burst!
        particles.push({
          x: p.x, y: p.y, vx: 0, vy: 0, life: 1.0, maxLife: 1.0, color: p.color, size: 25, type: 'ring'
        });
        particles.push({
          x: p.x, y: p.y, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: '#ffffff', size: 12, type: 'shockwave'
        });
      }
    }
  }

  // Death wait
  if (p.dead) {
    p.atkCd -= dt;
    if (p.atkCd <= 0) {
      if (state.lives > 0) {
        actions.addNotification("Tái xuất giang hồ!", "#2ecc71");
        return {
          ...state,
          lives: state.lives - 1,
          player: {
            ...p,
            dead: false,
            hp: p.maxHp * 0.8,
            mp: p.maxMp * 0.5,
            x: MAP_SIZE / 2,
            y: MAP_SIZE / 2,
            target: null,
          },
        };
      } else {
        return { ...state, state: "GAMEOVER" };
      }
    }
  }

  return null;
}
