import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  MutableRefObject,
  PointerEvent,
} from "react";
import { GameState, Entity, Particle, FloatingText, Drop, EquipmentType } from "../types";
import {
  MAP_SIZE,
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  WEAPON_NAMES,
  RARITIES,
  EQUIPMENT_NAME_MAP,
} from "../constants";

interface Props {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  particlesRef: MutableRefObject<Particle[]>;
  textsRef: MutableRefObject<FloatingText[]>;
  entitiesRef: MutableRefObject<Entity[]>;
  dropsRef: MutableRefObject<Drop[]>;
  sceneryRef: MutableRefObject<
    { x: number; y: number; t: number; sz: number }[]
  >;
  shakeRef: MutableRefObject<number>;
  addNotification: (text: string, color: string) => void;
}

export default function GameCanvas({
  gameState,
  setGameState,
  particlesRef,
  textsRef,
  entitiesRef,
  dropsRef,
  sceneryRef,
  shakeRef,
  addNotification,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const cameraRef = useRef({ x: MAP_SIZE / 2, y: MAP_SIZE / 2 });
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const pointerDownRef = useRef(false);
  const startPointerRef = useRef<{ clientX: number, clientY: number } | null>(null);

  const setStateAsync = (updater: (prev: GameState | null) => GameState | null) => {
    setGameState((prev) => {
      const next = updater(prev);
      if (next) Object.assign(stateRef.current, next); // Eagerly update ref
      return next;
    });
  };

  const drawHuman = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    sz: number,
    c: string,
    facing: number,
    isBoss: boolean,
    moving: boolean,
    time: number,
    hasCloak: boolean = false,
  ) => {
    // Elegant Angelic Wings (Cloak equipment)
    if (hasCloak) {
      const wingFlap = Math.sin(time * 0.006) * sz * 0.5;
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(235, 95, 175, 0.9)"; // Magical purple/pink wings
      ctx.fillStyle = "rgba(235, 95, 175, 0.15)";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgb(235, 95, 175)";
      
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(x - sz * 0.2, y);
      ctx.bezierCurveTo(
        x - sz * 2.8, y - sz * 1.8 + wingFlap,
        x - sz * 3.4, y + sz * 0.8 + wingFlap,
        x - sz * 0.2, y + sz * 0.8
      );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(x + sz * 0.2, y);
      ctx.bezierCurveTo(
        x + sz * 2.8, y - sz * 1.8 + wingFlap,
        x + sz * 3.4, y + sz * 0.8 + wingFlap,
        x + sz * 0.2, y + sz * 0.8
      );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, y + sz, sz * 0.8, sz * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    let legPhase = 0;
    if (moving) legPhase = Math.sin(time * 0.015) * sz * 0.4;
    ctx.fillStyle = "#111";
    ctx.fillRect(x - sz * 0.4 + legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);
    ctx.fillRect(x + sz * 0.1 - legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);

    // Body (Robe)
    let bodyBounce = moving ? Math.abs(Math.sin(time * 0.015)) * sz * 0.1 : 0;
    let by = y - bodyBounce;

    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - sz * 0.8, by + sz * 0.8);
    ctx.lineTo(x + sz * 0.8, by + sz * 0.8);
    ctx.lineTo(x + sz * 0.6, by - sz * 0.2);
    ctx.lineTo(x - sz * 0.6, by - sz * 0.2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.arc(x, by - sz * 0.5, sz * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = isBoss ? "#8e44ad" : "#222";
    ctx.beginPath();
    ctx.arc(x, by - sz * 0.6, sz * 0.55, Math.PI, Math.PI * 2);
    ctx.fill();

    // Weapon (Arm animation)
    let armPhase = moving ? Math.sin(time * 0.015) * sz * 0.5 : 0;
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = isBoss ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(x + facing * sz * 0.5, by);
    ctx.lineTo(x + facing * sz * 2, by - sz + armPhase);
    ctx.stroke();
  };

  const getBossCount = (stage: number): number => {
    if (stage < 10) return 1;
    const exp = Math.floor(stage / 10);
    return Math.pow(2, exp);
  };

  const getMobsTotal = (stage: number): number => {
    const baseMobs = 10 + stage * 2;
    const bosses = getBossCount(stage);
    return baseMobs + bosses * 24;
  };

  const spawnWave = () => {
    const stage = stateRef.current.stage;
    // Scale strength multiplier only on stages 10 and above
    const strengthMult = stage >= 10 ? (1 + getBossCount(stage) * 0.15) : 1.0;
    const stage20Boost = stage > 20 ? (1.3 + (stage - 20) * 0.05) : 1.0;

    const hpBase = 18 * Math.pow(1.13, stage - 1) * strengthMult * stage20Boost;
    const atkBase = 2.5 * Math.pow(1.08, stage - 1) * strengthMult * (stage > 20 ? 1.25 : 1.0);
    const newEntities: Entity[] = [];

    // Số đợt quái tăng đột khởi dồn dập sau stage 20
    const spawnCount = stage > 20 ? Math.min(22, 6 + Math.floor((stage - 20) * 1.5)) : 6;

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 300;
      newEntities.push({
        id: Math.random(),
        isBoss: false,
        x: stateRef.current.player.x + Math.cos(angle) * dist,
        y: stateRef.current.player.y + Math.sin(angle) * dist,
        hp: hpBase,
        maxHp: hpBase,
        atk: atkBase,
        speed: (50 + Math.random() * 30) * (stage > 20 ? 1.3 : 1.0),
        size: 16,
        atkCd: 0,
        color: stage > 20 ? "#8e44ad" : "#7f8c8d",
      });
    }
    entitiesRef.current = [...entitiesRef.current, ...newEntities];
  };

  const spawnSubBosses = (count: number, stage: number) => {
    const actualSubBossCount = stage > 20 ? count + 1 : count;
    const scaleFactor = (1 + Math.floor((stage - 1) / 5) * 0.25) * (stage > 20 ? 1.5 : 1.0);
    const hpBase = 70 * Math.pow(1.16, stage - 1) * scaleFactor;
    const atkBase = 6 * Math.pow(1.12, stage - 1) * scaleFactor;
    const size = Math.min(45, Math.floor(20 * scaleFactor));

    const p = stateRef.current.player;
    const newBosses: Entity[] = [];
    for (let i = 0; i < actualSubBossCount; i++) {
      const angle = (Math.PI * 2 / actualSubBossCount) * i;
      newBosses.push({
        id: Math.random(),
        isBoss: false,
        isSubBoss: true,
        name: stage > 20 ? `🔴 Tam Ma Vương Hộ Pháp ${i + 1}` : `Tịnh Vương Hộ Pháp ${i + 1}`,
        x: p.x + Math.cos(angle) * 320,
        y: p.y + Math.sin(angle) * 320,
        hp: hpBase,
        maxHp: hpBase,
        atk: atkBase,
        speed: stage > 20 ? 100 : 75,
        size,
        atkCd: 0,
        color: stage > 20 ? "#d35400" : "#16a085",
      });
    }

    entitiesRef.current = [...entitiesRef.current, ...newBosses];
    addNotification(`⚔️ KHAI CHIẾN ${actualSubBossCount} HỘ PHÁP THỦ LĨNH!`, stage > 20 ? "#d35400" : "#16a085");
  };

  const spawnFinalBosses = (count: number, stage: number) => {
    const isLateGame = stage > 20;
    const scaleFactor = (1 + Math.floor((stage - 1) / 5) * 0.35) * (isLateGame ? 1.6 : 1.0);
    const hpBase = 120 * Math.pow(1.18, stage - 1) * scaleFactor;
    const atkBase = 10 * Math.pow(1.12, stage - 1) * scaleFactor;
    const size = Math.min(75, Math.floor(26 * scaleFactor));

    const p = stateRef.current.player;
    const newBosses: Entity[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      newBosses.push({
        id: Math.random(),
        isBoss: true,
        name: isLateGame ? `🔥 VÔ THỰNG DIÊM VƯƠNG TRÙM CUỐI` : `Trùm Cuối Đại Sứ (Boss ${i + 1})`,
        x: p.x + Math.cos(angle) * 350,
        y: p.y + Math.sin(angle) * 350,
        hp: hpBase,
        maxHp: hpBase,
        atk: atkBase,
        speed: isLateGame ? 95 : 68,
        size,
        atkCd: 0,
        color: isLateGame ? "#9b59b6" : "#c0392b",
      });
    }

    entitiesRef.current = [...entitiesRef.current, ...newBosses];
    addNotification(isLateGame ? "🔥 VÔ THỰNG CHI CHỦ DIÊM LA DIỆU THẾ XUẤT HIỆN!" : "👑 THẦN ĐIỆN CHIẾN BOSS CUỐI XUẤT HIỆN!", "#c0392b");
  };

  const update = (dt: number) => {
    if (gameState.state !== "PLAYING") return;

    setStateAsync((prev) => {
      if (!prev) return null;
      const p = { ...prev.player };
      const buffs = prev.buffs;

      // Banner aura passive damage effect
      if (p.equipment.banner && !p.dead) {
        if (!p.atkCd) p.atkCd = 0; // abuse unused field to tick down aura
        // Tick down a small custom count or manual count
        // Let's declare aura timer ref or track elapsed
      }

      // Regains
      if (!p.dead) {
        p.hp = Math.min(p.maxHp, p.hp + (p.currentStats.con * 1.5 + 4) * dt);
        p.mp = Math.min(p.maxMp, p.mp + (p.currentStats.nei * 3.0 + 8) * dt);
      }

      // Death wait
      if (p.dead) {
        p.atkCd -= dt;
        if (p.atkCd <= 0) {
          if (prev.lives > 0) {
            addNotification("Tái xuất giang hồ!", "#2ecc71");
            return {
              ...prev,
              lives: prev.lives - 1,
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
            return { ...prev, state: "GAMEOVER" };
          }
        }
        return { ...prev, player: p };
      }

      // Stage management
      const mobsNeeded = prev.mobsTotal;
      const mobsKilled = prev.mobsKilled;
      const entitiesCount = entitiesRef.current.length;
      let nextPhase = prev.stagePhase || 'CREEPS';
      let bossSpawned = prev.bossSpawned;

      if (nextPhase === 'CREEPS') {
        if (entitiesCount < 4 && mobsKilled + entitiesCount < mobsNeeded) {
          spawnWave();
        }
        if (mobsKilled >= mobsNeeded) {
          nextPhase = 'SUB_BOSSES';
          const totalBosses = getBossCount(prev.stage);
          // if there are 4+ bosses, spawn 2 as sub-bosses first. If 8, spawn 4, etc. Otherwise spawn 1.
          const subBossCount = totalBosses >= 4 ? Math.floor(totalBosses / 2) : 1;
          spawnSubBosses(subBossCount, prev.stage);
        }
      } else if (nextPhase === 'SUB_BOSSES') {
        if (entitiesCount === 0) {
          nextPhase = 'FINAL_BOSS';
          bossSpawned = true;
          const totalBosses = getBossCount(prev.stage);
          const finalBossCount = totalBosses >= 4 ? Math.ceil(totalBosses / 2) : totalBosses;
          spawnFinalBosses(finalBossCount, prev.stage);
        }
      } else if (nextPhase === 'FINAL_BOSS') {
        if (entitiesCount === 0 && bossSpawned) {
          return { ...prev, state: "CLEARED" };
        }
      }

      // Auto target
      if (prev.auto && !p.target) {
        let minDist = 400;
        let nearest: Entity | null = null;
        entitiesRef.current.forEach((e) => {
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        });
        p.target = nearest;
      }

      // Movement & Auto Attack
      if (p.target) {
        const t = entitiesRef.current.find((e) => e.id === p.target?.id);
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
            p.atkCd -= dt;
            if (p.atkCd <= 0) {
              p.atkCd = Math.max(0.3, 1.2 - p.currentStats.agi * 0.05);
              doDamage(t, p.atk, "#fff", p.x, p.y);
            }
          }
        }
      } else if (p.moving) {
        const d = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        p.facing = p.targetX > p.x ? 1 : -1; // Update facing direction based on click
        if (d > 10) {
          p.x += ((p.targetX - p.x) / d) * p.speed * dt;
          p.y += ((p.targetY - p.y) / d) * p.speed * dt;
        } else {
          p.moving = false;
        }
      }

      // Enemy AI
      entitiesRef.current.forEach((e) => {
        e.atkCd -= dt;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d > p.radius + e.size + 5) {
          e.x += ((p.x - e.x) / d) * e.speed * dt;
          e.y += ((p.y - e.y) / d) * e.speed * dt;
        } else if (e.atkCd <= 0) {
          e.atkCd = 1.5;
          const dmg = Math.max(1, e.atk - p.currentStats.con);
          p.hp -= dmg;
          textsRef.current.push({
            id: Math.random(),
            x: p.x,
            y: p.y - 30,
            text: `-${Math.floor(dmg)}`,
            color: "#e74c3c",
            life: 1,
          });
          if (p.hp <= 0) {
            p.dead = true;
            p.atkCd = 3;
          }
        }
      });

      // Skill Cooldowns & Auto-cast
      let firedSkillIdx = -1;
      const newSkills = prev.skills.map((sk, idx) => {
        let sc = { ...sk };
        if (sc.cooldownLeft > 0) {
          sc.cooldownLeft = Math.max(0, sc.cooldownLeft - dt);
        }
        
        // Priority auto cast from ultimate (idx 2) to normal (idx 0)
        // Handled outside this map? Wait, we can just find which to cast after mapping
        return sc;
      });

      // Auto-cast highest available skill
      if (prev.auto && p.target && !p.dead) {
        const targetEntity = entitiesRef.current.find(e => e.id === p.target?.id);
        if (targetEntity) {
          const distanceToTarget = Math.hypot(p.x - targetEntity.x, p.y - targetEntity.y);
          for (let idx = newSkills.length - 1; idx >= 0; idx--) {
            const sk = newSkills[idx];
            const actualRange = sk.range + (buffs.skillRangeBonus || 0);
            
            // Chí mạng: Chỉ xả tuyệt chiêu khi đối tượng đã nằm vào trong tầm sát thương
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

        const tx = p.target ? p.target.x : p.x + p.facing * 120;
        const ty = p.target ? p.target.y : p.y;
        
        shakeRef.current = (firedSkillIdx + 1) * 7;
        const actualRange = sk.range + (buffs.skillRangeBonus || 0);
        
        // Base shockwave and ring
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 0.5 + firedSkillIdx * 0.15, maxLife: 0.5 + firedSkillIdx * 0.15, color: sk.color, size: 10, type: 'ring'
        });
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#ffffff', size: 5, type: 'shockwave'
        });

        if (firedSkillIdx === 0) {
          // Tier 1: Fast basic hit, some sparks
          for (let i = 0; i < 15; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            particlesRef.current.push({
              x: tx, y: ty,
              vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
              life: 0.3 + Math.random() * 0.2,
              color: Math.random() > 0.3 ? sk.color : '#ffffff',
              size: 2 + Math.random() * 3,
              type: 'trail'
            });
          }
        } else if (firedSkillIdx === 1) {
          // Tier 2: Pillar and falling swords
          particlesRef.current.push({
            x: tx, y: ty, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: sk.color, size: actualRange / 3, type: 'pillar'
          });
          for (let i = 0; i < 8; i++) {
             particlesRef.current.push({
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
          // Tier 3: Ultimate explosion
          particlesRef.current.push({
            x: tx, y: ty, vx: 0, vy: 0, life: 1, maxLife: 1, color: sk.color, size: actualRange / 1.5, type: 'pillar'
          });
          particlesRef.current.push({
            x: tx, y: ty, vx: 0, vy: 0, life: 0.8, maxLife: 0.8, color: '#ffffff', size: 10, type: 'ring'
          });
          
          for (let i = 0; i < 40; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            particlesRef.current.push({
              x: tx, y: ty,
              vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
              life: 0.5 + Math.random() * 0.5,
              color: Math.random() > 0.4 ? sk.color : '#ffffff',
              size: 3 + Math.random() * 5,
              type: 'trail'
            });
          }
          for (let i = 0; i < 15; i++) {
             particlesRef.current.push({
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
          // Tier 4: Laser Beam Energy Sweep
          for (let sweep = -30; sweep <= 30; sweep += 15) {
             particlesRef.current.push({
               x: tx, y: ty + sweep, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: sk.color, size: 25, type: 'beam'
             });
          }
          for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2;
            particlesRef.current.push({
              x: tx + (Math.random() - 0.5) * actualRange, y: ty + (Math.random() - 0.5) * 40,
              vx: Math.cos(ang) * 150, vy: Math.sin(ang) * 150,
              life: 0.4, color: '#ffffff', size: 3, type: 'trail'
            });
          }
        } else if (firedSkillIdx === 4) {
          // Tier 5: Celestial Lightning Storm
          for (let i = 0; i < 5; i++) {
             const offsetAngle = Math.random() * Math.PI * 2;
             const offsetDist = Math.random() * actualRange * 0.8;
             const lx = tx + Math.cos(offsetAngle) * offsetDist;
             const ly = ty + Math.sin(offsetAngle) * offsetDist;
             particlesRef.current.push({
               x: lx, y: ly, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#3498db', size: 8, type: 'lightning'
             });
          }
        } else if (firedSkillIdx === 5) {
          // Tier 6: Supreme Gold Dragon Vortex
          particlesRef.current.push({
            x: tx, y: ty, vx: 0, vy: 0, life: 1.5, maxLife: 1.5, color: '#f1c40f', size: actualRange, type: 'ring'
          });
          particlesRef.current.push({
            x: tx, y: ty, vx: 0, vy: 0, life: 1.2, maxLife: 1.2, color: '#e67e22', size: actualRange * 0.7, type: 'ring'
          });
          for (let i = 0; i < 60; i++) {
            const spinA = Math.random() * Math.PI * 2;
            const radius = Math.random() * actualRange;
            const pxPos = tx + Math.cos(spinA) * radius;
            const pyPos = ty + Math.sin(spinA) * radius;
            // orbital velocity vector
            const vx = -Math.sin(spinA) * 200;
            const vy = Math.cos(spinA) * 200;
            particlesRef.current.push({
              x: pxPos, y: pyPos, vx, vy, life: 0.8 + Math.random() * 0.4, color: Math.random() > 0.5 ? '#f1c40f' : '#e74c3c', size: 4 + Math.random() * 4, type: 'trail'
            });
          }
        }
        
        const damage = (sk.baseDamage + sk.level * 25 + p.currentStats.int * 5) * buffs.dmgMult;
        
        entitiesRef.current.forEach(e => {
          const dist = Math.hypot(e.x - tx, e.y - ty);
          if (dist <= actualRange) {
            // High-tier Agi driven Crits ! (Base Chance: 10% + AGI stats * 0.5%)
            const isCrit = Math.random() < (0.10 + p.currentStats.agi * 0.005);
            let d = Math.floor(damage * (0.8 + Math.random() * 0.4));
            if (isCrit) {
              const critDb = buffs.critDmgMult || 1.5;
              d = Math.floor(d * critDb);
            }
            e.hp -= d;
            textsRef.current.push({
              id: Math.random(),
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y - 20 - Math.random() * 20,
              text: isCrit ? `💥 CHÍ MẠNG! -${d}` : `-${d}`,
              color: isCrit ? '#f1c40f' : sk.color,
              life: isCrit ? 1.8 : 1.5
            });
          }
        });
      }


      // Item Pickup
      let goldEarned = 0;
      for (let i = dropsRef.current.length - 1; i >= 0; i--) {
        const d = dropsRef.current[i];
        if (Math.hypot(p.x - d.x, p.y - d.y) < 50) {
          const goldVal = equipItem(d, p, buffs, prev.stage);
          goldEarned += goldVal;
          dropsRef.current.splice(i, 1);
        }
      }

      return { ...prev, player: p, skills: newSkills, gold: prev.gold + goldEarned, stagePhase: nextPhase, bossSpawned };
    });

    // Sub-updates for refs
    for (let index = particlesRef.current.length - 1; index >= 0; index--) {
      const p = particlesRef.current[index];
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
        particlesRef.current.splice(index, 1);
      }
    }

    textsRef.current.forEach((t, index) => {
      t.y -= 40 * dt;
      t.life -= dt;
      if (t.life <= 0) textsRef.current.splice(index, 1);
    });

    if (shakeRef.current > 0) shakeRef.current -= dt * 10;
  };

  const doDamage = (
    e: Entity,
    amt: number,
    col: string,
    srcX: number,
    srcY: number,
  ) => {
    const damage = Math.floor(amt * (0.8 + Math.random() * 0.4));
    e.hp -= damage;
    textsRef.current.push({
      id: Math.random(),
      x: e.x,
      y: e.y - 30,
      text: damage.toString(),
      color: col,
      life: 1,
    });

    // Particles
    if (particlesRef.current.length < 80) {
      for (let i = 0; i < 5; i++) {
        const angle =
          Math.atan2(e.y - srcY, e.x - srcX) + (Math.random() - 0.5);
        particlesRef.current.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * 150,
          vy: Math.sin(angle) * 150,
          life: 0.5,
          color: col,
          size: 2,
        });
      }
    }

    if (e.hp <= 0) {
      if (e.isBoss) shakeRef.current = 10;

      setStateAsync((prev) => {
        if (!prev) return null;
        // Thiết kế tinh tế: Giảm thiểu lạm phát vàng ở các stage sau bằng Gold Decay và nén cơ số tích luỹ
        const goldDecayFactor = prev.stage > 12 
          ? Math.max(0.12, 1 - (prev.stage - 12) * 0.04) 
          : 1.0;
          
        const goldGain = Math.floor(
          (e.isBoss ? 50 : 5) *
            Math.pow(1.11, prev.stage) * // Giảm nhẹ từ 1.2 xuống 1.11 tránh over-power
            prev.buffs.resMult *
            prev.buffs.rlGold *
            goldDecayFactor
        );
        const expGain =
          (e.isBoss ? 100 : 15) *
          Math.pow(1.1, prev.stage) *
          prev.buffs.resMult *
          prev.buffs.rlExp;

        let newExp = prev.exp + expGain;
        let newLevel = prev.player.level;
        let newStatPts = prev.player.statPoints;
        let newSkillPts = prev.player.skillPoints;

        const maxExp = Math.floor(100 * Math.pow(1.2, newLevel - 1));
        if (newExp >= maxExp) {
          newExp -= maxExp;
          newLevel++;
          newStatPts += 5;
          if (newLevel % 3 === 0) newSkillPts++;
          addNotification(`⚡ LÊN CẤP ${newLevel}!`, "#f1c40f");
        }

        if (e.isBoss || Math.random() < 0.15) {
          generateDrop(e.x, e.y, e.isBoss, prev.stage);
        }

        return {
          ...prev,
          gold: prev.gold + goldGain,
          exp: newExp,
          mobsKilled: prev.mobsKilled + 1,
          player: {
            ...prev.player,
            level: newLevel,
            statPoints: newStatPts,
            skillPoints: newSkillPts,
          },
        };
      });

      entitiesRef.current = entitiesRef.current.filter(
        (ent) => ent.id !== e.id,
      );
    }
  };

  const generateDrop = (
    x: number,
    y: number,
    isBoss: boolean,
    stage: number,
  ) => {
    let roll = Math.random();
    if (isBoss) roll *= 0.15; // Better drops for bosses!

    let rIdx = 0;
    if (roll < 0.01) rIdx = 7;      // pink (1%)
    else if (roll < 0.035) rIdx = 6; // crimson (2.5%)
    else if (roll < 0.08) rIdx = 5;  // gold_rarity (4.5%)
    else if (roll < 0.15) rIdx = 4;  // emerald (7%)
    else if (roll < 0.28) rIdx = 3;  // legendary (13%)
    else if (roll < 0.45) rIdx = 2;  // epic (17%)
    else if (roll < 0.70) rIdx = 1;  // rare (25%)
    else rIdx = 0;                  // common

    const types: EquipmentType[] = [
      "weapon",
      "armor",
      "accessory",
      "special",
      "horse",
      "cloak",
      "seal",
      "banner",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const rarity = RARITIES[rIdx];
    const power = stage * RARITY_MULTIPLIERS[rarity];
    const name = EQUIPMENT_NAME_MAP[type][rarity] || "Vô Danh Bảo Vật";

    dropsRef.current.push({
      id: Math.random(),
      x,
      y,
      type,
      rarity,
      power,
      name,
    });
  };

  const equipItem = (
    item: Drop,
    p: GameState["player"],
    buffs: GameState["buffs"],
    stage: number,
  ): number => {
    const current = p.equipment[item.type];
    if (!current || item.power > current.power) {
      p.equipment[item.type] = {
        type: item.type,
        rarity: item.rarity,
        power: item.power,
        name: item.name,
      };

      // Recalc stats buffs
      const eq = p.equipment;
      
      // Weapon (VJ) -> DMG
      buffs.dmgMult = 1 + (eq.weapon ? eq.weapon.power * 0.1 : 0);
      
      // Armor (GIÁP) -> HP
      buffs.hpMult = 1 + (eq.armor ? eq.armor.power * 0.05 : 0);
      
      // Accessory (💍) & Horse (🐴) -> CD reduction
      const cdBonus = (eq.accessory ? eq.accessory.power * 0.02 : 0) + (eq.horse ? eq.horse.power * 0.01 : 0);
      buffs.cdReduc = Math.min(0.75, cdBonus);
      
      // Special (🔮) -> Resistance (resMult)
      buffs.resMult = 1 + (eq.special ? eq.special.power * 0.1 : 0);
      
      // Movement speed -> Horse (🐴) adds direct speed
      const speedBonus = eq.horse ? eq.horse.power * 4 : 0;
      p.speed = 160 + p.currentStats.agi * 5 + speedBonus;
      
      // Cloak (🧥) -> Crit DMG Multiplier
      const critDmgBonus = eq.cloak ? eq.cloak.power * 0.03 : 0;
      buffs.critDmgMult = 1.5 + critDmgBonus;
      
      // Seal (🔏) -> Skill range bonus
      const rangeBonus = eq.seal ? eq.seal.power * 2.5 : 0;
      buffs.skillRangeBonus = rangeBonus;

      const newMaxHp = Math.floor(
        (100 + p.currentStats.con * 20) * buffs.hpMult,
      );
      p.maxHp = newMaxHp;
      p.atk = Math.floor((10 + p.currentStats.str * 3) * buffs.dmgMult);

      addNotification(`Nhặt được [${item.name}]`, RARITY_COLORS[item.rarity]);
      return 0;
    } else {
      // Recycles to gold based on rarity and stage
      const baseRecycles = {
        common: 10,
        rare: 30,
        epic: 80,
        legendary: 200,
        emerald: 500,
        gold_rarity: 1200,
        crimson: 3000,
        pink: 8000,
      };
      const recycleVal = Math.floor((baseRecycles[item.rarity] || 10) * (1 + stage * 0.12));
      addNotification(`Thu hồi [${item.name}] phế phẩm, nhận +${recycleVal} Vàng`, "#f1c40f");
      return recycleVal;
    }
  };

  const loop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    update(dt);
    render(time);
    requestRef.current = requestAnimationFrame(loop);
  };

  const render = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const p = stateRef.current.player;
    const zoom = canvas.width < 768 ? 0.72 : 0.84;
    const viewWidth = canvas.width / zoom;
    const viewHeight = canvas.height / zoom;

    cameraRef.current.x += (p.x - viewWidth / 2 - cameraRef.current.x) * 0.1;
    cameraRef.current.y +=
      (p.y - viewHeight / 2 - cameraRef.current.y) * 0.1;

    const cx = cameraRef.current.x + (Math.random() - 0.5) * (shakeRef.current / zoom);
    const cy = cameraRef.current.y + (Math.random() - 0.5) * (shakeRef.current / zoom);

    // Background: Grassy Field
    ctx.fillStyle = "#0c170e"; // Very dark green grass
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Zoom the entire world representation
    ctx.save();
    ctx.scale(zoom, zoom);

    // World coordinate grid / Grass details
    ctx.save();
    ctx.strokeStyle = "#16291a"; // Lighter dark green for grid lines (grass patterns)
    ctx.lineWidth = 2;
    const tileSize = 80;

    // Determine bounds in world space to draw only what's visible
    const startX = Math.floor(cx / tileSize) * tileSize - tileSize;
    const startY = Math.floor(cy / tileSize) * tileSize - tileSize;
    const endX = cx + viewWidth + tileSize;
    const endY = cy + viewHeight + tileSize;

    ctx.translate(-cx, -cy);

    // Pattern instead of solid grid
    ctx.beginPath();
    for (let x = startX; x <= endX; x += tileSize) {
      ctx.moveTo(x, cy - tileSize);
      ctx.lineTo(x, cy + viewHeight + tileSize);
    }
    for (let y = startY; y <= endY; y += tileSize) {
      ctx.moveTo(cx - tileSize, y);
      ctx.lineTo(cx + viewWidth + tileSize, y);
    }
    ctx.globalAlpha = 0.3; // Make grid subtle
    ctx.stroke();
    
    // Draw grass blades and textures inside tiles
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#203a25"; // Darker green for grass details
    ctx.lineWidth = 1;
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        // Randomly place some grass marks
        const gx = x + (x * 13 % tileSize);
        const gy = y + (y * 17 % tileSize);
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 4, gy - 8);
        ctx.moveTo(gx + 2, gy);
        ctx.lineTo(gx + 8, gy - 6);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Scenery (Battlefield)
    sceneryRef.current.forEach((s) => {
      const sx = s.x - cx;
      const sy = s.y - cy;
      if (
        sx < -100 ||
        sy < -100 ||
        sx > viewWidth + 100 ||
        sy > viewHeight + 100
      )
        return;

      if (s.t === 0) {
        // Stone Lantern
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.4, s.sz * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(sx - s.sz * 0.1, sy - s.sz * 0.6, s.sz * 0.2, s.sz * 0.6);
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(sx - s.sz * 0.3, sy - s.sz * 0.8, s.sz * 0.6, s.sz * 0.2);
        ctx.fillStyle = "#ffb300";
        ctx.fillRect(sx - s.sz * 0.2, sy - s.sz * 1.1, s.sz * 0.4, s.sz * 0.3);
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.moveTo(sx, sy - s.sz * 1.4);
        ctx.lineTo(sx - s.sz * 0.4, sy - s.sz * 1.1);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.1);
        ctx.fill();
      } else if (s.t === 1) {
        // Market Stall
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz, s.sz * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5c4033";
        ctx.fillRect(sx - s.sz * 0.8, sy - s.sz, s.sz * 1.6, s.sz);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(sx - s.sz * 0.9, sy - s.sz, s.sz * 1.8, s.sz * 0.2);
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.moveTo(sx - s.sz * 1.2, sy - s.sz * 2);
        ctx.lineTo(sx + s.sz * 1.2, sy - s.sz * 2);
        ctx.lineTo(sx + s.sz, sy - s.sz * 1.5);
        ctx.lineTo(sx - s.sz, sy - s.sz * 1.5);
        ctx.fill();
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(sx - s.sz * 0.9, sy - s.sz * 2, s.sz * 0.1, s.sz * 2);
        ctx.fillRect(sx + s.sz * 0.8, sy - s.sz * 2, s.sz * 0.1, s.sz * 2);
      } else if (s.t === 2) {
        // Green leafy tree
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.8, s.sz * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5d4037"; // Brown trunk
        ctx.beginPath();
        ctx.moveTo(sx - s.sz * 0.1, sy);
        ctx.lineTo(sx - s.sz * 0.2, sy - s.sz * 1.5);
        ctx.lineTo(sx + s.sz * 0.2, sy - s.sz * 1.5);
        ctx.lineTo(sx + s.sz * 0.1, sy);
        ctx.fill();

        ctx.fillStyle = "#2e7d32"; // Dark green leaves base
        ctx.beginPath();
        ctx.ellipse(sx, sy - s.sz * 1.8, s.sz * 1.5, s.sz * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#43a047"; // Lighter green leaves top
        ctx.beginPath();
        ctx.ellipse(
          sx - s.sz * 0.3,
          sy - s.sz * 2.2,
          s.sz * 1.1,
          s.sz * 0.8,
          Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (s.t === 3) {
        // Wall Flag / Banner
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.3, s.sz * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d35400";
        ctx.fillRect(sx - 2, sy - s.sz * 2.5, 4, s.sz * 2.5);

        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.moveTo(sx, sy - s.sz * 2.4);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 2.4);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.2);
        ctx.lineTo(sx, sy - s.sz);
        ctx.fill();

        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + s.sz * 0.2, sy - s.sz * 2.0);
        ctx.lineTo(sx + s.sz * 0.6, sy - s.sz * 2.0);
        ctx.moveTo(sx + s.sz * 0.4, sy - s.sz * 2.2);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.5);
        ctx.moveTo(sx + s.sz * 0.2, sy - s.sz * 1.7);
        ctx.lineTo(sx + s.sz * 0.6, sy - s.sz * 1.7);
        ctx.stroke();
      }
    });

    // Particles
    ctx.save();
    particlesRef.current.forEach((par) => {
      const px = par.x - cx;
      const py = par.y - cy;
      const progress = par.maxLife ? 1 - (par.life / par.maxLife) : 0;
      const alpha = Math.max(0, par.life * 2); // fade out at end
      
      ctx.globalAlpha = Math.min(1, alpha);
      
      if (par.type === 'ring' || par.isBlast) {
        // Ground magic circle or expanding ring
        ctx.strokeStyle = par.color;
        ctx.lineWidth = 2 + progress * 5;
        ctx.beginPath();
        ctx.ellipse(px, py, par.size, par.size * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = par.color;
        ctx.globalAlpha = Math.min(0.3, alpha * 0.5);
        ctx.fill();
        ctx.globalAlpha = Math.min(1, alpha);
      } else if (par.type === 'shockwave') {
        // Very fast thin ring
        ctx.strokeStyle = par.color;
        ctx.lineWidth = Math.max(1, 10 - progress * 10);
        ctx.beginPath();
        ctx.arc(px, py, par.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (par.type === 'pillar') {
        // Light pillar coming down or shooting up
        const height = par.size * 5;
        const width = par.size;
        
        const grad = ctx.createLinearGradient(px, py - height, px, py);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, par.color);
        grad.addColorStop(1, '#ffffff');
        
        ctx.fillStyle = grad;
        ctx.fillRect(px - width/2, py - height, width, height);
        
        // Ground glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(px, py, width * 1.5, width * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (par.type === 'sword') {
        // Raining swords
        ctx.translate(px, py);
        if (par.rotation) ctx.rotate(par.rotation);
        
        ctx.fillStyle = par.color;
        // Blade
        ctx.beginPath();
        ctx.moveTo(0, par.size * 2);
        ctx.lineTo(-par.size / 4, par.size);
        ctx.lineTo(-par.size / 4, -par.size * 2);
        ctx.lineTo(par.size / 4, -par.size * 2);
        ctx.lineTo(par.size / 4, par.size);
        ctx.fill();
        
        // Glow
        ctx.shadowColor = par.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-par.size/6, -par.size * 1.8, par.size/3, par.size * 3.5);
        ctx.shadowBlur = 0;
        
        if (par.rotation) ctx.rotate(-par.rotation);
        ctx.translate(-px, -py);
      } else if (par.type === 'trail') {
        ctx.fillStyle = par.color;
        ctx.shadowColor = par.color;
        ctx.shadowBlur = Math.max(1, par.size);
        ctx.beginPath();
        ctx.arc(px, py, par.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (par.type === 'beam') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, par.size * (par.life / 0.8) * 1.8);
        ctx.shadowColor = par.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(px - 1000, py);
        ctx.lineTo(px + 1000, py);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (par.type === 'lightning') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 + Math.random() * 3;
        ctx.shadowColor = par.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(px, py - 500);
        let cyy = py - 500;
        let cxx = px;
        while (cyy < py) {
          cyy += 30 + Math.random() * 40;
          cxx += (Math.random() - 0.5) * 50;
          ctx.lineTo(cxx, cyy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Default dot
        ctx.fillStyle = par.color;
        ctx.fillRect(px, py, Math.max(1, par.size), Math.max(1, par.size));
      }
    });
    ctx.restore();

    // Drops
    dropsRef.current.forEach((d) => {
      const dx = d.x - cx;
      const dy = d.y - cy;
      ctx.fillStyle = RARITY_COLORS[d.rarity];
      ctx.beginPath();
      ctx.arc(dx, dy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("📦", dx, dy + 5);
    });

    // Entities
    entitiesRef.current.forEach((e) => {
      const ex = e.x - cx;
      const ey = e.y - cy;
      if (
        ex < -50 ||
        ey < -50 ||
        ex > viewWidth + 50 ||
        ey > viewHeight + 50
      )
        return;

      const isMoving =
        Math.hypot(p.x - e.x, p.y - e.y) > p.radius + e.size + 5 && e.atkCd > 0;
      drawHuman(
        ctx,
        ex,
        ey,
        e.size,
        e.color,
        e.x > p.x ? -1 : 1,
        e.isBoss,
        isMoving,
        time,
      );

      // HP Bar
      ctx.fillStyle = "#000";
      ctx.fillRect(ex - 20, ey - e.size - 15, 40, 5);
      ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
      ctx.fillRect(ex - 20, ey - e.size - 15, 40 * Math.max(0, Math.min(1, e.hp / e.maxHp)), 5);

      // Target ring
      if (p.target?.id === e.id) {
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ex, ey + e.size, e.size, e.size * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Player
    if (!p.dead) {
      const px = p.x - cx;
      const py = p.y - cy;

      // Banner aura passive battlefield design
      if (p.equipment.banner !== null) {
        ctx.save();
        ctx.strokeStyle = "rgba(243, 156, 18, 0.5)"; // Golden standard flame aura
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#f39c12";
        ctx.beginPath();
        ctx.ellipse(px, py + p.radius, 160, 64, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.translate(px, py + p.radius);
        ctx.rotate((time * 0.002) % (Math.PI * 2));
        ctx.strokeStyle = "rgba(243, 156, 18, 0.15)";
        ctx.strokeRect(-160, -64, 323, 128);
        ctx.restore();

        // Banner text flag floating tag
        ctx.save();
        ctx.font = "bold 13px font-serif";
        ctx.fillStyle = "#f39c12";
        ctx.textAlign = "center";
        ctx.fillText("🚩 QUÂN KỲ", px, py - 38);
        ctx.restore();
      }

      ctx.strokeStyle = p.color + "88";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(px, py + p.radius, 25, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      drawHuman(ctx, px, py, 18, p.color, p.facing, false, p.moving, time, p.equipment.cloak !== null);
    }

    // Floating Texts
    ctx.font = "bold 16px font-serif";
    ctx.textAlign = "center";
    textsRef.current.forEach((t) => {
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life;
      ctx.fillText(t.text, t.x - cx, t.y - cy);
    });
    ctx.globalAlpha = 1;

    ctx.restore(); // Restore from game-world zoom transformation

    // Mini Map
    const isMobile = canvas.width < 768;
    const mmSize = isMobile ? 80 : 120;
    const mmX = isMobile ? 12 : 32;
    const mmY = isMobile ? 95 : 115;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mmX + mmSize / 2, mmY + mmSize / 2, mmSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(mmX + mmSize / 2, mmY + mmSize / 2, mmSize / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(mmX, mmY, mmSize, mmSize);

    const mapScale = mmSize / MAP_SIZE;
    entitiesRef.current.forEach((e) => {
      ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
      ctx.beginPath();
      ctx.arc(
        mmX + e.x * mapScale,
        mmY + e.y * mapScale,
        e.isBoss ? 4 : 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    if (!p.dead) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(mmX + p.x * mapScale, mmY + p.y * mapScale, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handlePointerDown = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current.player.dead || e.target !== canvas) return;
    pointerDownRef.current = true;
    startPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    updateMovementTarget(e);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!pointerDownRef.current || !startPointerRef.current) return;
    const distanceThreshold = Math.hypot(e.clientX - startPointerRef.current.clientX, e.clientY - startPointerRef.current.clientY);
    
    // Ngưỡng 18 pixels phân tách click đơn kiên định và drag rê rổ
    if (distanceThreshold > 18) {
      updateMovementTarget(e, true);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (pointerDownRef.current) {
      pointerDownRef.current = false;
      startPointerRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }
  };

  const updateMovementTarget = (e: PointerEvent, isMove = false) => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current.player.dead) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = canvas.width < 768 ? 0.72 : 0.84;
    const mx = (e.clientX - rect.left) / zoom + cameraRef.current.x;
    const my = (e.clientY - rect.top) / zoom + cameraRef.current.y;

    const hit = entitiesRef.current.find(
      (ent) => Math.hypot(mx - ent.x, my - ent.y) < ent.size + 15,
    );

    setStateAsync((prev) => {
      if (!prev) return null;

      // Visual feedback for click
      if (!isMove) {
        particlesRef.current.push({
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          life: 0.5,
          color: "rgba(212,175,55,0.8)",
          size: 10,
          isBlast: true,
        });
      }

      if (hit) {
        return {
          ...prev,
          auto: false,
          player: { ...prev.player, target: hit, moving: true },
        };
      } else {
        return {
          ...prev,
          auto: false,
          player: {
            ...prev.player,
            targetX: mx,
            targetY: my,
            target: null,
            moving: true,
          },
        };
      }
    });
  };

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="block cursor-crosshair"
    />
  );
}
