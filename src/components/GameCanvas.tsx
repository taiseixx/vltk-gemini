import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  MutableRefObject,
  PointerEvent,
} from "react";
import { GameState, Entity, Particle, FloatingText, Drop } from "../types";
import {
  MAP_SIZE,
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  WEAPON_NAMES,
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
  ) => {
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

  const spawnWave = () => {
    const hpBase = 30 * Math.pow(1.15, stateRef.current.stage - 1);
    const atkBase = 5 * Math.pow(1.1, stateRef.current.stage - 1);
    const newEntities: Entity[] = [];

    for (let i = 0; i < 6; i++) {
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
        speed: 50 + Math.random() * 30,
        size: 16,
        atkCd: 0,
        color: "#7f8c8d",
      });
    }
    entitiesRef.current = [...entitiesRef.current, ...newEntities];
  };

  const spawnBoss = () => {
    const hpBase = 200 * Math.pow(1.2, stateRef.current.stage - 1);
    const atkBase = 15 * Math.pow(1.15, stateRef.current.stage - 1);
    const boss: Entity = {
      id: Math.random(),
      isBoss: true,
      name: `Thủ Lĩnh Ải ${stateRef.current.stage}`,
      x: stateRef.current.player.x + 300,
      y: stateRef.current.player.y,
      hp: hpBase,
      maxHp: hpBase,
      atk: atkBase,
      speed: 70,
      size: 25,
      atkCd: 0,
      color: "#c0392b",
    };
    entitiesRef.current.push(boss);
    addNotification("👑 BOSS XUẤT HIỆN!", "#c0392b");
    setStateAsync((prev) => (prev ? { ...prev, bossSpawned: true } : null));
  };

  const update = (dt: number) => {
    if (gameState.state !== "PLAYING") return;

    setStateAsync((prev) => {
      if (!prev) return null;
      const p = { ...prev.player };
      const buffs = prev.buffs;

      // Regains
      if (!p.dead) {
        p.hp = Math.min(p.maxHp, p.hp + p.currentStats.con * 0.5 * dt);
        p.mp = Math.min(p.maxMp, p.mp + p.currentStats.nei * 1 * dt);
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

      if (
        entitiesCount < 4 &&
        mobsKilled + entitiesCount < mobsNeeded &&
        !prev.bossSpawned
      ) {
        spawnWave();
      }
      if (mobsKilled >= mobsNeeded && !prev.bossSpawned) {
        spawnBoss();
      }
      if (prev.bossSpawned && entitiesCount === 0) {
        return { ...prev, state: "CLEARED" };
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
        for (let idx = newSkills.length - 1; idx >= 0; idx--) {
          const sk = newSkills[idx];
          if (sk.level > 0 && sk.cooldownLeft <= 0 && p.mp >= sk.manaCost) {
            firedSkillIdx = idx;
            break;
          }
        }
      }

      if (firedSkillIdx !== -1) {
        const sk = newSkills[firedSkillIdx];
        sk.cooldownLeft = sk.cooldown * (1 - buffs.cdReduc);
        p.mp -= sk.manaCost;

        const tx = p.target ? p.target.x : p.x + p.facing * 100;
        const ty = p.target ? p.target.y : p.y;
        
        shakeRef.current = (firedSkillIdx + 1) * 6;
        
        // Base shockwave and ring
        particlesRef.current.push({
          x: tx, y: ty, vx: 0, vy: 0, life: 0.5 + firedSkillIdx * 0.2, maxLife: 0.5 + firedSkillIdx * 0.2, color: sk.color, size: 10, type: 'ring'
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
            x: tx, y: ty, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: sk.color, size: sk.range / 3, type: 'pillar'
          });
          for (let i = 0; i < 8; i++) {
             particlesRef.current.push({
                x: tx + (Math.random() - 0.5) * sk.range, 
                y: ty - 300 - Math.random() * 200, 
                vx: 0, vy: 800 + Math.random() * 400, // fall fast
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
            x: tx, y: ty, vx: 0, vy: 0, life: 1, maxLife: 1, color: sk.color, size: sk.range / 1.5, type: 'pillar'
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
                x: tx + (Math.random() - 0.5) * sk.range * 1.5, 
                y: ty - 400 - Math.random() * 300, 
                vx: 0, vy: 1000 + Math.random() * 500,
                life: 1,
                color: '#ffffff',
                size: 20 + Math.random() * 15,
                type: 'sword',
                rotation: Math.random() * 0.4 - 0.2
             });
          }
        }
        
        const damage = (sk.baseDamage + sk.level * 20 + p.currentStats.int * 5) * buffs.dmgMult;
        
        entitiesRef.current.forEach(e => {
          const dist = Math.hypot(e.x - tx, e.y - ty);
          if (dist <= sk.range) {
            const d = Math.floor(damage * (0.8 + Math.random() * 0.4));
            e.hp -= d;
            textsRef.current.push({
              id: Math.random(),
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y - 20 - Math.random() * 20,
              text: `-${d}`,
              color: sk.color,
              life: 1.5
            });
          }
        });
      }


      // Item Pickup
      for (let i = dropsRef.current.length - 1; i >= 0; i--) {
        const d = dropsRef.current[i];
        if (Math.hypot(p.x - d.x, p.y - d.y) < 50) {
          equipItem(d, p, buffs, prev.stage);
          dropsRef.current.splice(i, 1);
        }
      }

      return { ...prev, player: p, skills: newSkills };
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
        const goldGain = Math.floor(
          (e.isBoss ? 50 : 5) *
            Math.pow(1.2, prev.stage) *
            prev.buffs.resMult *
            prev.buffs.rlGold,
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
    if (isBoss) roll *= 0.3;

    let rIdx = 0;
    if (roll < 0.02) rIdx = 4;
    else if (roll < 0.1) rIdx = 3;
    else if (roll < 0.3) rIdx = 2;
    else if (roll < 0.6) rIdx = 1;

    const types: ("weapon" | "armor" | "accessory" | "special")[] = [
      "weapon",
      "armor",
      "accessory",
      "special",
    ];
    const type = types[Math.floor(Math.random() * 4)];
    const rarity = (
      ["common", "rare", "epic", "legendary", "mythical"] as const
    )[rIdx];
    const power = stage * RARITY_MULTIPLIERS[rarity];

    dropsRef.current.push({
      id: Math.random(),
      x,
      y,
      type,
      rarity,
      power,
      name: WEAPON_NAMES[rIdx],
    });
  };

  const equipItem = (
    item: Drop,
    p: GameState["player"],
    buffs: GameState["buffs"],
    stage: number,
  ) => {
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
      buffs.dmgMult = 1 + (eq.weapon ? eq.weapon.power * 0.1 : 0);
      buffs.hpMult = 1 + (eq.armor ? eq.armor.power * 0.05 : 0);
      buffs.cdReduc = eq.accessory
        ? Math.min(0.5, eq.accessory.power * 0.02)
        : 0;
      buffs.resMult = 1 + (eq.special ? eq.special.power * 0.1 : 0);

      const newMaxHp = Math.floor(
        (100 + p.currentStats.con * 20) * buffs.hpMult,
      );
      p.maxHp = newMaxHp;
      p.atk = Math.floor((10 + p.currentStats.str * 3) * buffs.dmgMult);

      addNotification(`Nhặt được [${item.name}]`, RARITY_COLORS[item.rarity]);
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
    cameraRef.current.x += (p.x - canvas.width / 2 - cameraRef.current.x) * 0.1;
    cameraRef.current.y +=
      (p.y - canvas.height / 2 - cameraRef.current.y) * 0.1;

    const cx = cameraRef.current.x + (Math.random() - 0.5) * shakeRef.current;
    const cy = cameraRef.current.y + (Math.random() - 0.5) * shakeRef.current;

    // Background: Grassy Field
    ctx.fillStyle = "#0c170e"; // Very dark green grass
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // World coordinate grid / Grass details
    ctx.save();
    ctx.strokeStyle = "#16291a"; // Lighter dark green for grid lines (grass patterns)
    ctx.lineWidth = 2;
    const tileSize = 80;

    // Determine bounds in world space to draw only what's visible
    const startX = Math.floor(cx / tileSize) * tileSize - tileSize;
    const startY = Math.floor(cy / tileSize) * tileSize - tileSize;
    const endX = cx + canvas.width + tileSize;
    const endY = cy + canvas.height + tileSize;

    ctx.translate(-cx, -cy);

    // Pattern instead of solid grid
    ctx.beginPath();
    for (let x = startX; x <= endX; x += tileSize) {
      ctx.moveTo(x, cy - tileSize);
      ctx.lineTo(x, cy + canvas.height + tileSize);
    }
    for (let y = startY; y <= endY; y += tileSize) {
      ctx.moveTo(cx - tileSize, y);
      ctx.lineTo(cx + canvas.width + tileSize, y);
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
        sx > canvas.width + 100 ||
        sy > canvas.height + 100
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
        ex > canvas.width + 50 ||
        ey > canvas.height + 50
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
      ctx.strokeStyle = p.color + "88";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(px, py + p.radius, 25, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      drawHuman(ctx, px, py, 18, p.color, p.facing, false, p.moving, time);
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

    // Mini Map
    const mmSize = 120;
    const mmX = canvas.width - mmSize - 20;
    const mmY = 120;

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
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left + cameraRef.current.x;
    const my = e.clientY - rect.top + cameraRef.current.y;

    const hit = entitiesRef.current.find(
      (ent) => Math.hypot(mx - ent.x, my - ent.y) < ent.size + 15,
    );

    setStateAsync((prev) => {
      if (!prev) return null;

      // Visual feedback for click
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
      className="block cursor-crosshair"
    />
  );
}
