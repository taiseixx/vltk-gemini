import { GameState, Entity, Particle, FloatingText, Skill } from "../../types";
import { getSectIdFromColor, getSectElement, getElementalMultipliers } from "../elements";
import { checkAndTriggerCombo } from "../../utils/comboHelper";
import { sfx } from "../../utils/audio";

export function tickSkills(
  state: GameState,
  dt: number,
  entities: Entity[],
  particles: Particle[],
  texts: FloatingText[],
  actions: {
    addNotification: (txt: string, col: string) => void;
    shakeRef: { current: number };
    frameTotalDmgRef: { current: number };
  }
): Skill[] {
  const p = state.player;
  const buffs = state.buffs;
  if (p.dead) return state.skills;

  let firedSkillIdx = -1;
  const newSkills = state.skills.map((sk) => {
    const sc = { ...sk };
    if (sc.cooldownLeft > 0) {
      sc.cooldownLeft = Math.max(0, sc.cooldownLeft - dt);
    }
    return sc;
  });

  // Auto-cast highest available skill
  if (state.auto && p.target && !p.dead) {
    const targetEntity = entities.find((e) => e.id === p.target?.id);
    if (targetEntity) {
      const distanceToTarget = Math.hypot(p.x - targetEntity.x, p.y - targetEntity.y);
      for (let idx = newSkills.length - 1; idx >= 0; idx--) {
        const sk = newSkills[idx];
        const actualRange = sk.range + (buffs.skillRangeBonus || 0);
        
        // Chỉ xả tuyệt chiêu khi đối tượng đã nằm vào trong tầm sát thương
        if (sk.level > 0 && sk.cooldownLeft <= 0 && p.mp >= sk.manaCost && distanceToTarget <= actualRange + 30) {
          firedSkillIdx = idx;
          break;
        }
      }
    }
  }

  if (firedSkillIdx !== -1) {
    const sk = newSkills[firedSkillIdx];
    sk.cooldownLeft = sk.cooldown * (1 - buffs.cdReduc);
    p.mp -= sk.manaCost;
    sfx.playSkill(firedSkillIdx);

    const tx = p.target ? p.target.x : p.x + p.facing * 120;
    const ty = p.target ? p.target.y : p.y;
    
    actions.shakeRef.current = (firedSkillIdx + 1) * 7;
    const actualRange = sk.range + (buffs.skillRangeBonus || 0);
    
    // Base shockwave and ring
    particles.push({
      x: tx, y: ty, vx: 0, vy: 0, life: 0.5 + firedSkillIdx * 0.15, maxLife: 0.5 + firedSkillIdx * 0.15, color: sk.color, size: 10, type: 'ring'
    });
    particles.push({
      x: tx, y: ty, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#ffffff', size: 5, type: 'shockwave'
    });

    if (firedSkillIdx === 0) {
      // Fast basic hit, some sparks
      for (let i = 0; i < 15; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        particles.push({
          x: tx, y: ty,
          vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
          life: 0.3 + Math.random() * 0.2,
          color: Math.random() > 0.3 ? sk.color : '#ffffff',
          size: 2 + Math.random() * 3,
          type: 'trail'
        });
      }
    } else if (firedSkillIdx === 1) {
      // Pillar and falling swords
      particles.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: sk.color, size: actualRange / 3, type: 'pillar'
      });
      for (let i = 0; i < 8; i++) {
         particles.push({
            x: tx + (Math.random() - 0.5) * actualRange, 
            y: ty - 300 - Math.random() * 200, 
            vx: 0, vy: 800 + Math.random() * 400,
            life: 0.8,
            color: sk.color,
            size: 15 + Math.random() * 10,
            type: 'sword',
            rotation: Math.random() * 0.2 - 0.1
         });
      }
    } else if (firedSkillIdx === 2) {
      // Ultimate explosion
      particles.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 1, maxLife: 1, color: sk.color, size: actualRange / 1.5, type: 'pillar'
      });
      particles.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 0.8, maxLife: 0.8, color: '#ffffff', size: 10, type: 'ring'
      });
      
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 200 + Math.random() * 400;
        particles.push({
          x: tx, y: ty,
          vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
          life: 0.5 + Math.random() * 0.5,
          color: Math.random() > 0.4 ? sk.color : '#ffffff',
          size: 3 + Math.random() * 5,
          type: 'trail'
        });
      }
      for (let i = 0; i < 15; i++) {
         particles.push({
            x: tx + (Math.random() - 0.5) * actualRange * 1.5, 
            y: ty - 400 - Math.random() * 300, 
            vx: 0, vy: 1000 + Math.random() * 500,
            life: 1,
            color: '#ffffff',
            size: 20 + Math.random() * 15,
            type: 'sword',
            rotation: Math.random() * 0.4 - 0.2
         });
      }
    } else if (firedSkillIdx === 3) {
      // Laser Beam Energy Sweep
      for (let sweep = -30; sweep <= 30; sweep += 15) {
         particles.push({
           x: tx, y: ty + sweep, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: sk.color, size: 25, type: 'beam'
         });
      }
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          x: tx + (Math.random() - 0.5) * actualRange, y: ty + (Math.random() - 0.5) * 40,
          vx: Math.cos(ang) * 150, vy: Math.sin(ang) * 150,
          life: 0.4, color: '#ffffff', size: 3, type: 'trail'
        });
      }
    } else if (firedSkillIdx === 4) {
      // Celestial Lightning Storm
      for (let i = 0; i < 5; i++) {
         const offsetAngle = Math.random() * Math.PI * 2;
         const offsetDist = Math.random() * actualRange * 0.8;
         const lx = tx + Math.cos(offsetAngle) * offsetDist;
         const ly = ty + Math.sin(offsetAngle) * offsetDist;
         particles.push({
           x: lx, y: ly, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#3498db', size: 8, type: 'lightning'
         });
      }
    } else if (firedSkillIdx === 5) {
      // Supreme Gold Dragon Vortex
      particles.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 1.5, maxLife: 1.5, color: '#f1c40f', size: actualRange, type: 'ring'
      });
      particles.push({
        x: tx, y: ty, vx: 0, vy: 0, life: 1.2, maxLife: 1.2, color: '#e67e22', size: actualRange * 0.7, type: 'ring'
      });
      for (let i = 0; i < 60; i++) {
        const spinA = Math.random() * Math.PI * 2;
        const radius = Math.random() * actualRange;
        const pxPos = tx + Math.cos(spinA) * radius;
        const pyPos = ty + Math.sin(spinA) * radius;
        const vx = -Math.sin(spinA) * 200;
        const vy = Math.cos(spinA) * 200;
        particles.push({
          x: pxPos, y: pyPos, vx, vy, life: 0.8 + Math.random() * 0.4, color: Math.random() > 0.5 ? '#f1c40f' : '#e74c3c', size: 4 + Math.random() * 4, type: 'trail'
        });
      }
    }
    
    const combo = checkAndTriggerCombo(
      firedSkillIdx,
      p,
      tx,
      ty,
      actualRange,
      particles,
      texts,
      actions.shakeRef
    );
    const comboMult = combo ? combo.multiplier : 1.0;
    const damage = (sk.baseDamage + sk.level * 25 + p.currentStats.int * 5) * buffs.dmgMult * comboMult;
    const sectId = getSectIdFromColor(p.color);
    const playerEl = getSectElement(sectId);
    
    entities.forEach(e => {
      const dist = Math.hypot(e.x - tx, e.y - ty);
      if (dist <= actualRange) {
        const elementInfo = getElementalMultipliers(playerEl, e.element);
        const isCrit = Math.random() < (0.10 + p.currentStats.agi * 0.005 + (buffs.critChanceBonus || 0));
        
        let elementalDamage = damage * elementInfo.mult;
        if (p.rageActive) elementalDamage *= 1.5;
        
        let d = Math.max(1, Math.floor(elementalDamage * (0.8 + Math.random() * 0.4)));
        if (isCrit) {
          const critDb = buffs.critDmgMult || 1.5;
          d = Math.floor(d * critDb);
        }
        
        // Lifesteal
        if (buffs.lifeSteal) {
          const heal = Math.floor(d * buffs.lifeSteal);
          if (heal > 0 && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + heal);
            texts.push({
              id: Math.random(),
              x: p.x,
              y: p.y - 20,
              text: `+${heal}`,
              color: "#2ecc71",
              life: 1,
            });
          }
        }
        
        // Accumulate player rage on skill target hit
        if (!p.dead && !p.rageActive) {
          let accum = 1;
          if (isCrit) accum += 1; // Crit bonus
          if (e.hp - d <= 0) accum += 2; // Kill bonus
          p.rage = Math.min(p.maxRage, p.rage + accum);
        }

        e.hp -= d;
        
        const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
        const elName = { Metal: 'KIM', Wood: 'MỘC', Water: 'THỦY', Fire: 'HỎA', Earth: 'THỔ' };
        
        let skillText = isCrit ? `💥 CHÍ MẠNG! -${d}` : `-${d}`;
        let skillColor = isCrit ? '#f1c40f' : sk.color;
        
        if (combo) {
          skillText = isCrit ? `🔥 COMBO CRIT! -${d}` : `🔥 COMBO! -${d}`;
          skillColor = combo.color;
        } else if (elementInfo.mult > 1.0) {
          skillText = isCrit ? `💥 KHẮC CHẾ CRIT! -${d}` : `⚡ ${elName[playerEl]} KHẮC! -${d}`;
          skillColor = elColor[playerEl];
        } else if (p.rageActive) {
          skillText = isCrit ? `🔥 BỘC PHÁT CRIT! -${d}` : `🔥 BỘC PHÁT! -${d}`;
          skillColor = '#ff4d00';
        }
        
        if (texts.length < 35) {
          texts.push({
            id: Math.random(),
            x: e.x + (Math.random() - 0.5) * 20,
            y: e.y - 20 - Math.random() * 20,
            text: skillText,
            color: skillColor,
            life: isCrit ? 1.8 : 1.5
          });
        } else {
          actions.frameTotalDmgRef.current += d;
        }
      }
    });
  }

  return newSkills;
}
