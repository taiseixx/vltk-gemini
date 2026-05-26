import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  MutableRefObject,
  PointerEvent,
} from "react";
import { GameState, Entity, Particle, FloatingText, Drop, EquipmentType, MartialManual } from "../types";
import {
  MAP_SIZE,
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  WEAPON_NAMES,
  RARITIES,
  EQUIPMENT_NAME_MAP,
  SECTS,
} from "../constants";
import { checkAndTriggerCombo } from "../utils/comboHelper";
import { SECT_LEVEL_MANUALS } from "../utils/quest";
import { perfLogger } from "../utils/perfLogger";
import grassImg from "../assets/images/wuxia_grassland_environment_1779601113241.png";
import stoneImg from "../assets/images/wuxia_stone_floor_1779601135174.png";
import barricadeImg from "../assets/images/battlefield_barricade_1779384521972.png";
import treeImg from "../assets/images/battlefield_tree_1779552597802.png";
import catapultImg from "../assets/images/battlefield_catapult_1779552618735.png";
import flagImg from "../assets/images/battlefield_flag_1779552636708.png";
import lanternImg from "../assets/images/battlefield_lantern_1779552656984.png";
import fenceImg from "../assets/images/battlefield_fence_1779552677346.png";
import wuxiaPlayerImg from "../assets/images/wuxia_player_1779601606599.png";
import wuxiaMobImg from "../assets/images/wuxia_mob_1779601627426.png";
import wuxiaBossImg from "../assets/images/wuxia_boss_1779601644081.png";

// Importing 10 Sect Player images
import slPlayerImg from "../assets/images/wuxia_player_sl_1779612143780.png";
import vdPlayerImg from "../assets/images/wuxia_player_vd_1779612165092.png";
import cbPlayerImg from "../assets/images/wuxia_player_cb_1779612185985.png";
import nmPlayerImg from "../assets/images/wuxia_player_nm_1779612201622.png";
import clPlayerImg from "../assets/images/wuxia_player_cl_1779612221339.png";
import ndPlayerImg from "../assets/images/wuxia_player_nd_1779612238228.png";
import tmPlayerImg from "../assets/images/wuxia_player_tm_1779612257555.png";
import tyPlayerImg from "../assets/images/wuxia_player_ty_1779612276631.png";
import tvPlayerImg from "../assets/images/wuxia_player_tv_1779612297047.png";
import tnPlayerImg from "../assets/images/wuxia_player_tn_1779612313538.png";

// Importing 10 Sect Companion images
import slCompImg from "../assets/images/companion_sl_1779612357195.png";
import vdCompImg from "../assets/images/companion_vd_1779612374706.png";
import cbCompImg from "../assets/images/companion_cb_1779612392617.png";
import nmCompImg from "../assets/images/companion_nm_1779612410880.png";
import clCompImg from "../assets/images/companion_cl_1779612428563.png";
import ndCompImg from "../assets/images/companion_nd_1779612449346.png";
import tmCompImg from "../assets/images/companion_tm_1779612467084.png";
import tyCompImg from "../assets/images/companion_ty_1779612487644.png";
import tvCompImg from "../assets/images/companion_tv_1779612509432.png";
import tnCompImg from "../assets/images/companion_tn_1779612527728.png";

import { loadAllSprites, SpriteManifestItem } from "../render/spriteLoader";
import { drawHuman } from "../render/character";
import { drawBackground } from "../render/background";
import {
  drawLoadingScreen,
  drawScenery,
  drawParticles,
  drawDrops,
  drawFloatingTexts,
  drawEntities,
  drawPlayer,
  drawMinimap,
} from "../render/world";

import { tickMovement } from "../game/systems/movement";
import { tickCombat } from "../game/systems/combat";
import { tickSkills } from "../game/systems/skills";
import { tickCombo } from "../game/systems/combo";
import { tickCompanion } from "../game/systems/companion";
import { generateDrop, tickDrops } from "../game/systems/drops";
import { tickPlayerState } from "../game/systems/player";
import { tickStageState } from "../game/systems/stage";

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
  cameraRef: MutableRefObject<{ x: number, y: number }>;
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
  cameraRef,
  addNotification,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const pointerDownRef = useRef(false);
  const startPointerRef = useRef<{ clientX: number, clientY: number } | null>(null);

  const frameTotalDmgRef = useRef(0);
  const companionTotalDmgRef = useRef(0);

  const grassImgRef = useRef<HTMLImageElement | null>(null);
  const stoneImgRef = useRef<HTMLImageElement | null>(null);
  const barricadeImgRef = useRef<CanvasImageSource | null>(null);
  const treeImgRef = useRef<CanvasImageSource | null>(null);
  const catapultImgRef = useRef<CanvasImageSource | null>(null);
  const flagImgRef = useRef<CanvasImageSource | null>(null);
  const lanternImgRef = useRef<CanvasImageSource | null>(null);
  const fenceImgRef = useRef<CanvasImageSource | null>(null);

  const playerSpriteRef = useRef<CanvasImageSource | null>(null);
  const mobSpriteRef = useRef<CanvasImageSource | null>(null);
  const bossSpriteRef = useRef<CanvasImageSource | null>(null);

  const playerSectSpritesRef = useRef<Record<string, CanvasImageSource | null>>({
    sl: null, vd: null, cb: null, nm: null, cl: null,
    nd: null, tm: null, ty: null, tv: null, tn: null
  });

  const companionSectSpritesRef = useRef<Record<string, CanvasImageSource | null>>({
    sl: null, vd: null, cb: null, nm: null, cl: null,
    nd: null, tm: null, ty: null, tv: null, tn: null
  });

  const companionAtkTimerRef = useRef(0);

  const TOTAL_RESOURCES = 31;
  const loadedResourcesRef = useRef(0);

  const incrementLoaded = () => {
    loadedResourcesRef.current++;
  };

  useEffect(() => {
    const manifest: SpriteManifestItem[] = [
      { key: "grass", src: grassImg, filterType: "raw" },
      { key: "stone", src: stoneImg, filterType: "raw" },
      { key: "barricade", src: barricadeImg, filterType: "black", tolerance: 55 },
      { key: "tree", src: treeImg, filterType: "black", tolerance: 55 },
      { key: "catapult", src: catapultImg, filterType: "black", tolerance: 55 },
      { key: "flag", src: flagImg, filterType: "black", tolerance: 55 },
      { key: "lantern", src: lanternImg, filterType: "black", tolerance: 55 },
      { key: "fence", src: fenceImg, filterType: "black", tolerance: 55 },
      { key: "player", src: wuxiaPlayerImg, filterType: "character", tolerance: 45 },
      { key: "mob", src: wuxiaMobImg, filterType: "character", tolerance: 45 },
      { key: "boss", src: wuxiaBossImg, filterType: "character", tolerance: 45 },
      // 10 sectors player
      { key: "p_sl", src: slPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_vd", src: vdPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_cb", src: cbPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_nm", src: nmPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_cl", src: clPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_nd", src: ndPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_tm", src: tmPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_ty", src: tyPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_tv", src: tvPlayerImg, filterType: "character", tolerance: 45 },
      { key: "p_tn", src: tnPlayerImg, filterType: "character", tolerance: 45 },
      // 10 sectors companion
      { key: "c_sl", src: slCompImg, filterType: "character", tolerance: 45 },
      { key: "c_vd", src: vdCompImg, filterType: "character", tolerance: 45 },
      { key: "c_cb", src: cbCompImg, filterType: "character", tolerance: 45 },
      { key: "c_nm", src: nmCompImg, filterType: "character", tolerance: 45 },
      { key: "c_cl", src: clCompImg, filterType: "character", tolerance: 45 },
      { key: "c_nd", src: ndCompImg, filterType: "character", tolerance: 45 },
      { key: "c_tm", src: tmCompImg, filterType: "character", tolerance: 45 },
      { key: "c_ty", src: tyCompImg, filterType: "character", tolerance: 45 },
      { key: "c_tv", src: tvCompImg, filterType: "character", tolerance: 45 },
      { key: "c_tn", src: tnCompImg, filterType: "character", tolerance: 45 },
    ];

    loadAllSprites(manifest, (loaded) => {
      loadedResourcesRef.current = loaded;
    }).then((res) => {
      grassImgRef.current = res.grass;
      stoneImgRef.current = res.stone;
      barricadeImgRef.current = res.barricade;
      treeImgRef.current = res.tree;
      catapultImgRef.current = res.catapult;
      flagImgRef.current = res.flag;
      lanternImgRef.current = res.lantern;
      fenceImgRef.current = res.fence;
      playerSpriteRef.current = res.player;
      mobSpriteRef.current = res.mob;
      bossSpriteRef.current = res.boss;

      const sectors = ["sl", "vd", "cb", "nm", "cl", "nd", "tm", "ty", "tv", "tn"];
      sectors.forEach((sect) => {
        playerSectSpritesRef.current[sect] = res[`p_${sect}`] || null;
        companionSectSpritesRef.current[sect] = res[`c_${sect}`] || null;
      });
    });
  }, []);

  const setStateAsync = (updater: (prev: GameState | null) => GameState | null) => {
    setGameState((prev) => {
      const next = updater(prev);
      if (next) Object.assign(stateRef.current, next); // Eagerly update ref
      return next;
    });
  };

  const update = (dt: number) => {
    if (gameState.state !== "PLAYING") return;

    setStateAsync((prev) => {
      if (!prev) return null;
      let current = { ...prev };

      // Tick Combo timers and history if player alive
      if (!current.player.dead) {
        tickCombo(current, dt);
      }

      // 1. Tick Player State (Regeneration, active rage burst, banner passive, death waits/revival)
      const playerResult = tickPlayerState(current, dt, particlesRef.current, {
        addNotification,
        shakeRef,
      });
      if (playerResult) {
        return playerResult; // Returns updated revived state, or game over state
      }

      // 2. Tick Stage State (Waves, sub bosses, final bosses, clearance)
      const stageResult = tickStageState(current, entitiesRef.current, {
        addNotification,
      });
      if (stageResult.nextState) {
        return { ...current, state: stageResult.nextState };
      }
      if (stageResult.newEntities) {
        entitiesRef.current = [...entitiesRef.current, ...stageResult.newEntities];
      }
      current.stagePhase = stageResult.stagePhase;
      current.bossSpawned = stageResult.bossSpawned;

      // 3. Tick Movement
      tickMovement(current, dt, entitiesRef.current);

      // 4. Tick Combat (Basic attacks, enemy AI, mob cleanup)
      tickCombat(current, dt, entitiesRef.current, particlesRef.current, textsRef.current, {
        addNotification,
        generateDrop: (x, y, isBoss, stage) => generateDrop(x, y, isBoss, stage, dropsRef.current),
        shakeRef,
        frameTotalDmgRef,
      });

      const finalGold = current.gold;
      const finalExp = current.exp;
      const finalCompanion = current.companion;
      const finalMobsKilled = current.mobsKilled;
      const finalQuests = current.quests;
      const finalManuals = current.manuals;

      // 5. Tick Skills (Cooldown, casting, skill damage)
      const newSkills = tickSkills(current, dt, entitiesRef.current, particlesRef.current, textsRef.current, {
        addNotification,
        shakeRef,
        frameTotalDmgRef,
      });

      // 6. Tick Item Pickups
      const goldEarned = tickDrops(current, dropsRef.current, {
        addNotification,
      });

      return {
        ...current,
        skills: newSkills,
        gold: finalGold + goldEarned,
        exp: finalExp,
        companion: finalCompanion,
        mobsKilled: finalMobsKilled,
        quests: finalQuests,
        manuals: finalManuals,
      };
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

    for (let index = textsRef.current.length - 1; index >= 0; index--) {
      const t = textsRef.current[index];
      t.y -= 40 * dt;
      t.life -= dt;
      if (t.life <= 0) {
        textsRef.current.splice(index, 1);
      }
    }

    if (shakeRef.current > 0) shakeRef.current -= dt * 10;
  };




  const fpsRef = useRef({ lastCountTime: 0, frames: 0, currentFps: 0, lastFrameMs: 0 });

  const drawPerfOverlay = (
    ctx: CanvasRenderingContext2D,
    metrics: { fps: number; frameMs: number; entityCount: number; particleCount: number },
    canvasWidth: number
  ) => {
    const padding = 8;
    const lineH = 16;
    const boxW = 110;
    const boxH = padding * 2 + lineH * 4 + 4;
    const x = canvasWidth - boxW - 8;
    const y = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const fpsColor = metrics.fps >= 50 ? '#4ade80' : metrics.fps >= 30 ? '#facc15' : '#f87171';
    ctx.fillStyle = fpsColor;
    ctx.fillText(`FPS: ${metrics.fps}`, x + padding, y + padding + lineH);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Frame: ${metrics.frameMs.toFixed(1)}ms`, x + padding, y + padding + lineH * 2);
    ctx.fillText(`Ent: ${metrics.entityCount}`, x + padding, y + padding + lineH * 3);
    ctx.fillText(`Prt: ${metrics.particleCount}`, x + padding, y + padding + lineH * 4);
  };

  const loop = (time: number) => {
    if (loadedResourcesRef.current < TOTAL_RESOURCES) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawLoadingScreen(ctx, {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            loaded: loadedResourcesRef.current,
            total: TOTAL_RESOURCES,
            color: stateRef.current.player.color || '#facc15',
            time,
          });
        }
      }
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    update(dt);

    // Companion Autonomous Battle Strike (Tốc đánh, kĩ năng theo đẳng cấp & trang bị!)
    tickCompanion(stateRef.current, dt, entitiesRef.current, particlesRef.current, textsRef.current, {
      atkTimer: companionAtkTimerRef,
      totalDmg: companionTotalDmgRef
    });

    // Push accumulated frame damage if any
    if (frameTotalDmgRef.current > 0) {
      textsRef.current.push({
        id: Math.random(),
        x: stateRef.current.player.x,
        y: stateRef.current.player.y - 50,
        text: `💥 TỔNG KÍCH: -${frameTotalDmgRef.current}`,
        color: "#ff3300",
        life: 2.0
      });
      frameTotalDmgRef.current = 0;
    }
    
    if (companionTotalDmgRef.current > 0 && stateRef.current.companion) {
      textsRef.current.push({
        id: Math.random(),
        x: stateRef.current.player.x,
        y: stateRef.current.player.y - 70,
        text: `☯️ HỘ THỂ BẠO ST: -${companionTotalDmgRef.current}`,
        color: "#ffca28",
        life: 2.0
      });
      companionTotalDmgRef.current = 0;
    }

    render(time);
    requestRef.current = requestAnimationFrame(loop);
  };

  const render = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0,0, canvas.width, canvas.height);

    const p = stateRef.current.player;
    const zoom = canvas.width < 768 ? 0.82 : 0.94;
    const viewWidth = canvas.width / zoom;
    const viewHeight = canvas.height / zoom;

    cameraRef.current.x += (p.x - viewWidth / 2 - cameraRef.current.x) * 0.1;
    cameraRef.current.y +=
      (p.y - viewHeight / 2 - cameraRef.current.y) * 0.1;

    const cx = cameraRef.current.x + (Math.random() - 0.5) * (shakeRef.current / zoom);
    const cy = cameraRef.current.y + (Math.random() - 0.5) * (shakeRef.current / zoom);

    // Dynamic stage biome base color
    const cycle = Math.floor((stateRef.current.stage - 1) / 10) % 4;
    let baseColor = "#1a3a22"; // Forest - richer dark green
    if (cycle === 1) baseColor = "#3c2e1f"; // Desert - dusty warm brown
    else if (cycle === 2) baseColor = "#1f2d3d"; // Mountain - cool dark blue gray
    else if (cycle === 3) baseColor = "#223528"; // Plains - soft sage green

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Zoom the entire world representation
    ctx.save();
    ctx.scale(zoom, zoom);

    drawBackground(ctx, {
      cx,
      cy,
      viewWidth,
      viewHeight,
      cycle,
      grassImg: grassImgRef.current,
      stoneImg: stoneImgRef.current,
    });

    // Scenery (Battlefield)
    drawScenery(ctx, {
      scenery: sceneryRef.current,
      cx,
      cy,
      viewWidth,
      viewHeight,
      lanternImg: lanternImgRef.current,
      barricadeImg: barricadeImgRef.current,
      treeImg: treeImgRef.current,
      flagImg: flagImgRef.current,
      catapultImg: catapultImgRef.current,
      fenceImg: fenceImgRef.current,
    });

    // Particles
    drawParticles(ctx, {
      particles: particlesRef.current,
      cx,
      cy,
      viewWidth,
      viewHeight,
    });

    // Drops with Majestic Luminous Light Auras (Hào Quang Ánh Sáng) and floating item badges
    drawDrops(ctx, {
      drops: dropsRef.current,
      cx,
      cy,
      viewWidth,
      viewHeight,
      time,
    });

    // Entities
    drawEntities(ctx, {
      entities: entitiesRef.current,
      cx,
      cy,
      viewWidth,
      viewHeight,
      player: p,
      time,
      images: {
        playerSprite: playerSpriteRef.current,
        bossSprite: bossSpriteRef.current,
        mobSprite: mobSpriteRef.current,
        playerSectSprites: playerSectSpritesRef.current,
      },
    });

    // Player (+ Banner & Companion)
    drawPlayer(ctx, {
      player: p,
      companion: stateRef.current.companion,
      cx,
      cy,
      time,
      images: {
        playerSprite: playerSpriteRef.current,
        bossSprite: bossSpriteRef.current,
        mobSprite: mobSpriteRef.current,
        playerSectSprites: playerSectSpritesRef.current,
      },
      companionSectSprites: companionSectSpritesRef.current,
    });

    // Floating Texts
    drawFloatingTexts(ctx, {
      texts: textsRef.current,
      cx,
      cy,
    });

    ctx.restore(); // Restore from game-world zoom transformation

    // Mini Map
    drawMinimap(ctx, {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      entities: entitiesRef.current,
      player: p,
    });

    // Perf metrics and rendering
    const now = performance.now();
    fpsRef.current.frames++;
    if (now - fpsRef.current.lastCountTime >= 1000) {
      fpsRef.current.currentFps = fpsRef.current.frames;
      fpsRef.current.frames = 0;
      fpsRef.current.lastCountTime = now;
    }
    
    const frameMs = time - (fpsRef.current.lastFrameMs || time);
    fpsRef.current.lastFrameMs = time;
    
    const drawCalls = entitiesRef.current.length * 3 + particlesRef.current.length + 15;
    
    perfLogger.record({
      fps: fpsRef.current.currentFps || 60,
      frameTime: frameMs,
      entityCount: entitiesRef.current.length,
      particleCount: particlesRef.current.length,
      drawCallEstimate: drawCalls,
      geminiPending: false
    });

    if (showPerfRef.current) {
      drawPerfOverlay(
        ctx,
        {
          fps: fpsRef.current.currentFps || 60,
          frameMs: frameMs,
          entityCount: entitiesRef.current.length,
          particleCount: particlesRef.current.length
        },
        canvas.width
      );
    }
  };

  const showPerfRef = useRef(localStorage.getItem('showPerfOverlay') !== 'false');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        showPerfRef.current = !showPerfRef.current;
        localStorage.setItem('showPerfOverlay', String(showPerfRef.current));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
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
    const zoom = canvas.width < 768 ? 0.82 : 0.94;
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
          player: { ...prev.player, target: hit, moving: true },
        };
      } else {
        return {
          ...prev,
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
      className="block cursor-crosshair w-full h-full"
    />
  );
}
