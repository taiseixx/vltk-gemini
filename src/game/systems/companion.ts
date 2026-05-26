import { GameState, Entity, Particle, FloatingText } from "../../types";

export function tickCompanion(
  state: GameState,
  dt: number,
  entities: Entity[],
  particles: Particle[],
  texts: FloatingText[],
  timers: {
    atkTimer: { current: number };
    totalDmg: { current: number };
  }
): void {
  const comp = state.companion;
  if (!comp || state.state !== "PLAYING") return;

  timers.atkTimer.current -= dt;
  if (timers.atkTimer.current <= 0) {
    timers.atkTimer.current = Math.max(1.0, 4.5 - comp.level * 0.15);

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

    if (nearest) {
      const clawLvl = comp.equipment.weapon?.upgradeLvl || 0;
      const compDamage = Math.floor((15 + comp.level * 4 + clawLvl * 5) * (1 + comp.level * 0.05));
      
      nearest.hp -= compDamage;
      
      // Spawn beautiful trail effect from companion to nearest target
      const stepCount = 8;
      for (let i = 0; i <= stepCount; i++) {
        const ratio = i / stepCount;
        const px = p.x + (nearest.x - p.x) * ratio;
        const py = p.y + (nearest.y - p.y) * ratio;
        particles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          life: 0.35,
          color: "#f1c40f",
          size: 2.2
        });
      }

      // Combine companion damage if there's too much text
      if (texts.length < 35) {
        texts.push({
          id: Math.random(),
          x: nearest.x,
          y: nearest.y - 40,
          text: `☯️ [${comp.name}] HỒ TRỢ KÍCH SÁT -${compDamage}`,
          color: "#ffca28",
          life: 1.4
        });
      } else {
         timers.totalDmg.current += compDamage;
      }
    }
  }
}
