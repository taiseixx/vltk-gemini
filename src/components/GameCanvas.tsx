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
  SECTS,
} from "../constants";
import { checkAndTriggerCombo } from "../utils/comboHelper";
import { cc } from "../lib/cocos";
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

function removeCharacterBackground(img: HTMLImageElement, tolerance = 35): CanvasImageSource {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    const corners = [
      { x: 2, y: 2 },
      { x: img.width - 3, y: 2 },
      { x: 2, y: img.height - 3 },
      { x: img.width - 3, y: img.height - 3 }
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    let sampledCount = 0;
    corners.forEach(p => {
      if (p.x >= 0 && p.x < img.width && p.y >= 0 && p.y < img.height) {
        const idx = (p.y * img.width + p.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        sampledCount++;
      }
    });

    if (sampledCount > 0) {
      bgR = Math.round(bgR / sampledCount);
      bgG = Math.round(bgG / sampledCount);
      bgB = Math.round(bgB / sampledCount);
    }

    // Flood fill from corners instead of global replace to keep inner whites/blacks
    const visited = new Uint8Array(img.width * img.height);
    const queue: number[] = []; // store index
    
    // Push corners initially
    corners.forEach(p => {
      queue.push(p.y * img.width + p.x);
    });

    while(queue.length > 0) {
      const pIdx = queue.shift()!;
      if (visited[pIdx]) continue;
      
      const px = pIdx % img.width;
      const py = Math.floor(pIdx / img.width);
      
      const i = pIdx * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      
      if (diff <= tolerance) {
        visited[pIdx] = 1;
        data[i + 3] = 0; // erase
        
        // Add neighbors
        if (px > 0 && !visited[pIdx - 1]) queue.push(pIdx - 1);
        if (px < img.width - 1 && !visited[pIdx + 1]) queue.push(pIdx + 1);
        if (py > 0 && !visited[pIdx - img.width]) queue.push(pIdx - img.width);
        if (py < img.height - 1 && !visited[pIdx + img.width]) queue.push(pIdx + img.width);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    return img;
  }
}

function removeBlackBackground(img: HTMLImageElement, tolerance = 45): CanvasImageSource {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    // Sample the corners to detect the natural background color
    const corners = [
      { x: 2, y: 2 },
      { x: img.width - 3, y: 2 },
      { x: 2, y: img.height - 3 },
      { x: img.width - 3, y: img.height - 3 }
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    let sampledCount = 0;
    corners.forEach(p => {
      if (p.x >= 0 && p.x < img.width && p.y >= 0 && p.y < img.height) {
        const idx = (p.y * img.width + p.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        sampledCount++;
      }
    });

    if (sampledCount > 0) {
      bgR = Math.round(bgR / sampledCount);
      bgG = Math.round(bgG / sampledCount);
      bgB = Math.round(bgB / sampledCount);
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      
      // Safety fallbacks: absolute black & bright whites
      const isExtremeBlack = r < 40 && g < 40 && b < 40;
      
      // Catapult background is off-white (around 220-255). This targets any near-white pixels cleanly:
      const isExtremeWhite = r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;

      if (diff < tolerance || isExtremeBlack || isExtremeWhite) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    console.error("Alpha mask processing error:", err);
    return img;
  }
}

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

  const grassImgRef = useRef<HTMLImageElement | null>(null);
  const stoneImgRef = useRef<HTMLImageElement | null>(null);
  const grassPatternRef = useRef<CanvasPattern | null>(null);
  const stonePatternRef = useRef<CanvasPattern | null>(null);
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
  const cocosSceneRef = useRef<cc.Node>(new cc.Node());
  const cocosParticlesRef = useRef<cc.ParticleSystem>(new cc.ParticleSystem());

  useEffect(() => {
    cc.director.registerScene("BattleScene", cocosSceneRef.current);
    cc.director.loadScene("BattleScene");
    cocosSceneRef.current.addChild(cocosParticlesRef.current);
  }, []);

  useEffect(() => {
    const grass = new Image();
    grass.onload = () => {
      grassImgRef.current = grass;
    };
    grass.src = grassImg;

    const stone = new Image();
    stone.onload = () => {
      stoneImgRef.current = stone;
    };
    stone.src = stoneImg;

    const barricade = new Image();
    barricade.onload = () => {
      barricadeImgRef.current = removeBlackBackground(barricade, 55);
    };
    barricade.src = barricadeImg;

    const tree = new Image();
    tree.onload = () => {
      treeImgRef.current = removeBlackBackground(tree, 55);
    };
    tree.src = treeImg;

    const catapult = new Image();
    catapult.onload = () => {
      catapultImgRef.current = removeBlackBackground(catapult, 55);
    };
    catapult.src = catapultImg;

    const flag = new Image();
    flag.onload = () => {
      flagImgRef.current = removeBlackBackground(flag, 55);
    };
    flag.src = flagImg;

    const lantern = new Image();
    lantern.onload = () => {
      lanternImgRef.current = removeBlackBackground(lantern, 55);
    };
    lantern.src = lanternImg;

    const fence = new Image();
    fence.onload = () => {
      fenceImgRef.current = removeBlackBackground(fence, 55);
    };
    fence.src = fenceImg;

    const pSprite = new Image();
    pSprite.onload = () => {
      playerSpriteRef.current = removeCharacterBackground(pSprite, 45);
    };
    pSprite.src = wuxiaPlayerImg;

    const mSprite = new Image();
    mSprite.onload = () => {
      mobSpriteRef.current = removeCharacterBackground(mSprite, 45);
    };
    mSprite.src = wuxiaMobImg;

    const bSprite = new Image();
    bSprite.onload = () => {
      bossSpriteRef.current = removeCharacterBackground(bSprite, 45);
    };
    bSprite.src = wuxiaBossImg;

    // Load 10 Sect Players
    const sectPlayerImgs: Record<string, string> = {
      sl: slPlayerImg, vd: vdPlayerImg, cb: cbPlayerImg, nm: nmPlayerImg, cl: clPlayerImg,
      nd: ndPlayerImg, tm: tmPlayerImg, ty: tyPlayerImg, tv: tvPlayerImg, tn: tnPlayerImg
    };

    Object.entries(sectPlayerImgs).forEach(([sect, src]) => {
      const img = new Image();
      img.onload = () => {
        playerSectSpritesRef.current[sect] = removeCharacterBackground(img, 45);
      };
      img.src = src;
    });

    // Load 10 Sect Companions
    const sectCompImgs: Record<string, string> = {
      sl: slCompImg, vd: vdCompImg, cb: cbCompImg, nm: nmCompImg, cl: clCompImg,
      nd: ndCompImg, tm: tmCompImg, ty: tyCompImg, tv: tvCompImg, tn: tnCompImg
    };

    Object.entries(sectCompImgs).forEach(([sect, src]) => {
      const img = new Image();
      img.onload = () => {
        companionSectSpritesRef.current[sect] = removeCharacterBackground(img, 45);
      };
      img.src = src;
    });
  }, []);

  const setStateAsync = (updater: (prev: GameState | null) => GameState | null) => {
    setGameState((prev) => {
      const next = updater(prev);
      if (next) Object.assign(stateRef.current, next); // Eagerly update ref
      return next;
    });
  };

  const getSectIdFromColor = (color: string): string => {
    if (color === '#e67e22') return 'sl'; // Thiếu Lâm
    if (color === '#3498db') return 'vd'; // Võ Đang
    if (color === '#27ae60') return 'cb'; // Cái Bang
    if (color === '#e91e63') return 'nm'; // Nga Mi
    if (color === '#f39c12') return 'cl'; // Côn Lôn
    if (color === '#9b59b6') return 'nd'; // Ngũ Độc
    if (color === '#8a2be2') return 'tm'; // Đường Môn
    if (color === '#00bcd4') return 'ty'; // Thủy Yên/Thúy Yên
    if (color === '#f44336') return 'tv'; // Thiên Vương
    if (color === '#d35400') return 'tn'; // Thiên Nhẫn
    return '';
  };

  const getSectElement = (sectId: string): 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth' => {
    const sectElementMap: Record<string, 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'> = {
      sl: 'Metal',
      tv: 'Metal',
      cb: 'Fire',
      tn: 'Fire',
      tm: 'Wood',
      nd: 'Wood',
      vd: 'Earth',
      cl: 'Earth',
      nm: 'Water',
      ty: 'Water'
    };
    return sectElementMap[sectId] || 'Metal';
  };

  const getElementalMultipliers = (
    attackerElement: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth',
    defenderElement?: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'
  ): { mult: number; text: string; color: string } => {
    if (!defenderElement) return { mult: 1.0, text: '', color: '' };
    
    const elementCounter: Record<'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth', 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'> = {
      Metal: 'Wood',
      Wood: 'Earth',
      Earth: 'Water',
      Water: 'Fire',
      Fire: 'Metal'
    };

    const nameMap = { Metal: 'Kim', Wood: 'Mộc', Water: 'Thủy', Fire: 'Hỏa', Earth: 'Thổ' };

    if (elementCounter[attackerElement] === defenderElement) {
      return { mult: 1.5, text: `Khắc chế (${nameMap[attackerElement]} ➔ ${nameMap[defenderElement]})`, color: '#f1c40f' };
    } else if (elementCounter[defenderElement] === attackerElement) {
      return { mult: 0.7, text: `Bị khắc (${nameMap[attackerElement]} ⇠ ${nameMap[defenderElement]})`, color: '#7f8c8d' };
    }
    return { mult: 1.0, text: '', color: '' };
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
    const sectId = getSectIdFromColor(c);

    // Elegant Angelic Wings (Cloak equipment) - Rendered behind player
    if (hasCloak) {
      const wingFlap = Math.sin(time * 0.008) * sz * 0.4;
      ctx.save();
      ctx.shadowBlur = 5;
      
      let mainWingColor = 'rgba(235, 95, 175, 0.95)';
      let fillWingColor = 'rgba(235, 95, 175, 0.18)';
      let shadowWingColor = 'rgb(235, 95, 175)';
      
      if (sectId === 'sl' || sectId === 'cl' || sectId === 'vd') {
        mainWingColor = 'rgba(241, 196, 15, 0.95)';
        fillWingColor = 'rgba(241, 196, 15, 0.2)';
        shadowWingColor = '#f1c40f';
      } else if (sectId === 'cb' || sectId === 'tn') {
        mainWingColor = 'rgba(231, 76, 60, 0.95)';
        fillWingColor = 'rgba(231, 76, 60, 0.2)';
        shadowWingColor = '#e74c3c';
      } else if (sectId === 'nd' || sectId === 'tm') {
        mainWingColor = 'rgba(155, 89, 182, 0.95)';
        fillWingColor = 'rgba(155, 89, 182, 0.2)';
        shadowWingColor = '#9b59b6';
      } else if (sectId === 'ty' || sectId === 'nm') {
        mainWingColor = 'rgba(52, 152, 219, 0.95)';
        fillWingColor = 'rgba(52, 152, 219, 0.2)';
        shadowWingColor = '#3498db';
      }
      
      ctx.strokeStyle = mainWingColor;
      ctx.fillStyle = fillWingColor;
      ctx.shadowColor = shadowWingColor;
      
      // Draw 3 layers of feathered curves for spectacular wing detailing
      for (let layer = 0; layer < 3; layer++) {
        const offset = layer * 4;
        const scale = 1 - layer * 0.2;
        ctx.lineWidth = 4 - layer * 1.2;
        
        ctx.beginPath();
        ctx.moveTo(x - sz * 0.1, y + offset);
        ctx.bezierCurveTo(
          x - sz * 3.2 * scale, y - sz * 2.2 * scale + wingFlap,
          x - sz * 3.8 * scale, y + sz * 1.2 * scale + wingFlap,
          x - sz * 0.1, y + sz * 0.8
        );
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + sz * 0.1, y + offset);
        ctx.bezierCurveTo(
          x + sz * 3.2 * scale, y - sz * 2.2 * scale + wingFlap,
          x + sz * 3.8 * scale, y + sz * 1.2 * scale + wingFlap,
          x + sz * 0.1, y + sz * 0.8
        );
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y + sz * 0.1, sz * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, y + sz, sz * 0.8, sz * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    let bodyBounce = moving ? Math.abs(Math.sin(time * 0.015)) * sz * 0.1 : 0;
    let by = y - bodyBounce;

    let spriteImg: CanvasImageSource | null = null;
    if (sectId) {
      spriteImg = playerSectSpritesRef.current[sectId] || playerSpriteRef.current;
    } else if (isBoss) {
      spriteImg = bossSpriteRef.current;
    } else {
      spriteImg = mobSpriteRef.current;
    }

    if (spriteImg) {
      ctx.save();
      const spriteW = sz * 2.8;
      const spriteH = sz * 2.8;
      
      ctx.translate(x, y + sz * 0.3 - bodyBounce);
      ctx.scale(facing, 1);
      
      ctx.drawImage(spriteImg, -spriteW / 2, -spriteH * 0.85, spriteW, spriteH);
      
      if (sectId) {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.25;
        ctx.drawImage(spriteImg, -spriteW / 2, -spriteH * 0.85, spriteW, spriteH);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
      }
      
      ctx.restore();
    } else {
      // Fallback Legs
      let legPhase = 0;
      if (moving) legPhase = Math.sin(time * 0.015) * sz * 0.4;
      ctx.fillStyle = "#111";
      ctx.fillRect(x - sz * 0.4 + legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);
      ctx.fillRect(x + sz * 0.1 - legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);

      // Fallback Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x - sz * 0.8, by + sz * 0.8);
      ctx.lineTo(x + sz * 0.8, by + sz * 0.8);
      ctx.lineTo(x + sz * 0.6, by - sz * 0.2);
      ctx.lineTo(x - sz * 0.6, by - sz * 0.2);
      ctx.fill();

      // Fallback Head
      if (sectId) {
        ctx.fillStyle = "#fce0cf";
        ctx.beginPath();
        ctx.arc(x, by - sz * 0.5, sz * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isBoss ? "#8e44ad" : "#1a1a1a";
        ctx.beginPath();
        ctx.arc(x, by - sz * 0.6, sz * 0.55, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
      } else {
        ctx.fillStyle = isBoss ? "#b71c1c" : c;
        ctx.beginPath();
        ctx.arc(x, by - sz * 0.5, sz * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Weapon Animation (Arm and Physical features)
    ctx.save();
    let armPhase = moving ? Math.sin(time * 0.015) * sz * 0.4 : 0;
    const hx = x + facing * sz * 0.6;
    const hy = by + sz * 0.15;
    const wx = x + facing * sz * 1.5;
    const wy = by - sz * 0.3 + armPhase;
    
    // Draw back hand
    ctx.fillStyle = sectId ? "#fce0cf" : (isBoss ? "#b71c1c" : c);
    ctx.beginPath();
    ctx.arc(hx, hy + sz * 0.2, sz * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    if (sectId) {
      // Draw arms / sleeves based on sect
      ctx.strokeStyle = c;
      ctx.lineWidth = sz * 0.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + facing * sz * 0.3, by + sz * 0.2);
      ctx.lineTo(hx, hy + sz * 0.2);
      ctx.stroke();

      if (sectId === 'sl') {
        const spinA = (time * 0.005) % (Math.PI * 2);
        ctx.translate(wx, wy);
        ctx.rotate(spinA);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-sz * 1.8, 0);
        ctx.lineTo(sz * 1.8, 0);
        ctx.stroke();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(-sz * 1.8, 0, sz * 0.3, 0, Math.PI * 2);
        ctx.arc(sz * 1.8, 0, sz * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(-spinA);
        ctx.translate(-wx, -wy);
      } 
      else if (sectId === 'vd' || sectId === 'cl' || sectId === 'nm' || sectId === 'ty') {
        // Swordsmen sects
        const swordColor = sectId === 'vd' ? '#3498db' : (sectId === 'nm' ? '#e91e63' : (sectId === 'cl' ? '#f1c40f' : '#00bcd4'));
        
        // Draw thicker outer glowing qi aura
        ctx.save();
        ctx.lineWidth = 5.5;
        ctx.strokeStyle = swordColor;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(hx, hy + sz * 0.2);
        ctx.lineTo(wx, wy - sz * 0.5);
        ctx.stroke();
        ctx.restore();
        
        // Draw solid high-intensity core
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(hx, hy + sz * 0.2);
        ctx.lineTo(wx, wy - sz * 0.5);
        ctx.stroke();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx + facing * 4, hy + sz * 0.2 - 4);
        ctx.lineTo(hx + facing * 8, hy + sz * 0.2 + 4);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - facing * sz * 0.5, hy + sz * 0.2);
        ctx.lineTo(x - facing * sz * 1.2, hy - sz * 0.8);
        ctx.stroke();
      } 
      else if (sectId === 'cb' || sectId === 'nd') {
        // Staff / Whip
        const wColor = sectId === 'cb' ? '#27ae60' : '#9b59b6';
        ctx.strokeStyle = wColor;
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(hx, hy + sz * 0.2);
        if (sectId === 'nd') {
           ctx.quadraticCurveTo(wx, wy + sz, wx + facing * sz * 0.8, wy - sz * 0.6);
        } else {
           ctx.lineTo(wx + facing * sz * 0.5, wy - sz * 0.4);
        }
        ctx.stroke();
        
        ctx.fillStyle = sectId === 'cb' ? '#2ecc71' : '#8e44ad';
        ctx.beginPath();
        ctx.arc(wx + (sectId === 'cb' ? 0 : facing * sz * 0.8), wy - (sectId === 'cb' ? 0 : sz * 0.6), 4, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (sectId === 'tm') {
        // Hidden weapons / Bow
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(hx, hy + sz * 0.2 - 3, sz * 1.2 * facing, 6);
        ctx.fillStyle = '#8a2be2';
        ctx.fillRect(hx + sz * 0.8 * facing, hy + sz * 0.2 - sz * 0.6, 4 * facing, sz * 1.2);
      } 
      else if (sectId === 'tv' || sectId === 'tn') {
        // Spear / Heavy Halberd
        const wColor = sectId === 'tv' ? '#f44336' : '#d35400';
        ctx.strokeStyle = wColor;
        ctx.lineWidth = 4;
        const sLength = sz * 3.2;
        const txPointX = hx + facing * sLength;
        const txPointY = hy + sz * 0.2 - sz * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(hx - facing * sz, hy + sz * 0.2 + sz * 0.4);
        ctx.lineTo(txPointX, txPointY);
        ctx.stroke();
        
        ctx.fillStyle = wColor;
        ctx.beginPath();
        ctx.arc(txPointX - facing * sz * 0.3, txPointY + sz * 0.1, sz * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(txPointX, txPointY);
        ctx.lineTo(txPointX - facing * sz * 0.6, txPointY - sz * 0.2);
        ctx.lineTo(txPointX - facing * sz * 0.6, txPointY + sz * 0.2);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Monster claws / weapons
      ctx.strokeStyle = "#444";
      ctx.lineWidth = isBoss ? 6 : 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + facing * sz * 0.4, by + sz * 0.2);
      ctx.lineTo(wx, wy);
      ctx.stroke();
      
      // Giant spiked club for bosses
      if (isBoss) {
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(wx, wy - sz * 0.4, sz * 0.6, sz * 1.0, facing > 0 ? 0.2 : -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        for(let i=0; i<3; i++) {
           ctx.beginPath();
           ctx.arc(wx + (Math.random()-0.5)*sz*0.6, wy - sz*0.4 + (Math.random()-0.5)*sz*0.8, sz*0.15, 0, Math.PI*2);
           ctx.fill();
        }
      }
    }
    
    // Front hand over weapon
    ctx.fillStyle = sectId ? "#fce0cf" : (isBoss ? "#b71c1c" : c);
    ctx.beginPath();
    ctx.arc(hx + facing * sz * 0.2, hy + sz * 0.2, sz * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
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
    const ELEMENTS: ("Metal" | "Wood" | "Water" | "Fire" | "Earth")[] = ["Metal", "Wood", "Water", "Fire", "Earth"];

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 300;
      const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
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
        element: el,
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
    const ELEMENTS: ("Metal" | "Wood" | "Water" | "Fire" | "Earth")[] = ["Metal", "Wood", "Water", "Fire", "Earth"];
    const nameElPrefixes = { Metal: '[KIM]', Wood: '[MỘC]', Water: '[THỦY]', Fire: '[HỎA]', Earth: '[THỔ]' };

    for (let i = 0; i < actualSubBossCount; i++) {
      const angle = (Math.PI * 2 / actualSubBossCount) * i;
      const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const prefix = nameElPrefixes[el];
      newBosses.push({
        id: Math.random(),
        isBoss: false,
        isSubBoss: true,
        name: stage > 20 ? `${prefix} 🔴 Tam Ma Vương Hộ Pháp ${i + 1}` : `${prefix} Tịnh Vương Hộ Pháp ${i + 1}`,
        x: p.x + Math.cos(angle) * 320,
        y: p.y + Math.sin(angle) * 320,
        hp: hpBase,
        maxHp: hpBase,
        atk: atkBase,
        speed: stage > 20 ? 100 : 75,
        size,
        atkCd: 0,
        color: stage > 20 ? "#d35400" : "#16a085",
        element: el,
      });
    }

    entitiesRef.current = [...entitiesRef.current, ...newBosses];
    addNotification(`⚔️ KHAI CHIẾN ${actualSubBossCount} HỘ PHÁP THỦ LĨNH!`, stage > 20 ? "#d35400" : "#16a085");
  };

  const WUXIA_BOSS_NAMES = [
    "Kiều Phong", "Dương Quá", "Lệnh Hồ Xung", "Trương Vô Kỵ", 
    "Đông Phương Bất Bại", "Hoàng Dược Sư", "Âu Dương Phong", 
    "Hồng Thất Công", "Đoàn Trí Hưng", "Quách Tĩnh", "Cô Long", 
    "Độc Cô Cầu Bại", "Nhậm Ngã Hành", "Vô Nhai Tử", "Thiên Sơn Đồng Lão"
  ];

  const spawnFinalBosses = (count: number, stage: number) => {
    const isLateGame = stage > 20;
    const scaleFactor = (1 + Math.floor((stage - 1) / 5) * 0.35) * (isLateGame ? 1.6 : 1.0);
    const hpBase = 120 * Math.pow(1.18, stage - 1) * scaleFactor;
    const atkBase = 10 * Math.pow(1.12, stage - 1) * scaleFactor;
    const size = Math.min(75, Math.floor(26 * scaleFactor));

    const p = stateRef.current.player;
    const newBosses: Entity[] = [];
    const ELEMENTS: ("Metal" | "Wood" | "Water" | "Fire" | "Earth")[] = ["Metal", "Wood", "Water", "Fire", "Earth"];
    const nameElPrefixes = { Metal: '[KIM]', Wood: '[MỘC]', Water: '[THỦY]', Fire: '[HỎA]', Earth: '[THỔ]' };

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const prefix = nameElPrefixes[el];
      const randomWuxiaName = WUXIA_BOSS_NAMES[Math.floor(Math.random() * WUXIA_BOSS_NAMES.length)];
      
      newBosses.push({
        id: Math.random(),
        isBoss: true,
        name: isLateGame ? `${prefix} 🔥 TÔNG TƯ THẦN - ${randomWuxiaName}` : `${prefix} ${randomWuxiaName}`,
        x: p.x + Math.cos(angle) * 350,
        y: p.y + Math.sin(angle) * 350,
        hp: hpBase,
        maxHp: hpBase,
        atk: atkBase,
        speed: isLateGame ? 95 : 68,
        size,
        atkCd: 0,
        color: isLateGame ? "#9b59b6" : "#c0392b",
        element: el,
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

      // Regains & Five Elements Burst Mode Tick
      if (!p.dead) {
        if (p.comboTimer && p.comboTimer > 0) {
          p.comboTimer -= dt;
          if (p.comboTimer <= 0) {
            p.skillComboHistory = [];
          }
        }
        if (p.activeCombo && p.activeCombo.timer > 0) {
          p.activeCombo.timer -= dt;
          if (p.activeCombo.timer <= 0) {
            p.activeCombo = null;
          }
        }

        if (p.rageActive) {
          p.rageTimer = Math.max(0, (p.rageTimer || 8.0) - dt);
          p.rage = Math.floor((p.rageTimer / 8.0) * (p.maxRage || 100));
          
          // Regenerate HP continuously: +2% Max HP per second in burst mode!
          p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.02 + p.currentStats.con * 1.5 + 4) * dt);
          p.mp = Math.min(p.maxMp, p.mp + (p.currentStats.nei * 3.0 + 8) * dt);
          
          // Generate customized Elemental trail particles surrounding player!
          if (Math.random() < 0.4) {
            const sectId = getSectIdFromColor(p.color);
            const playerEl = getSectElement(sectId);
            const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
            const particleColor = elColor[playerEl] || '#fff';
            
            const radius = 25 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            particlesRef.current.push({
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
            addNotification("🛡️ Trạng thái bộc phát Ngũ Hành kết thúc!", "#95a5a6");
          }
        } else {
          p.hp = Math.min(p.maxHp, p.hp + (p.currentStats.con * 1.5 + 4) * dt);
          p.mp = Math.min(p.maxMp, p.mp + (p.currentStats.nei * 3.0 + 8) * dt);
          
          if (p.rage >= (p.maxRage || 100)) {
            p.rageActive = true;
            p.rageTimer = 8.0;
            p.rage = p.maxRage || 100;
            shakeRef.current = 15;
            addNotification("🔥 BỘC PHÁT THẾ NGŨ HÀNH 🔥", p.color);
            
            // Spawn spectacular shockwave ring upon burst!
            particlesRef.current.push({
              x: p.x, y: p.y, vx: 0, vy: 0, life: 1.0, maxLife: 1.0, color: p.color, size: 25, type: 'ring'
            });
            particlesRef.current.push({
              x: p.x, y: p.y, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: '#ffffff', size: 12, type: 'shockwave'
            });
          }
        }

        // Decay Combo active state
        if (p.activeCombo) {
          p.comboTimer = Math.max(0, (p.comboTimer || 0) - dt);
          if (p.comboTimer <= 0) {
            p.activeCombo = null;
          }
        }
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
      if (prev.auto && !p.target && !p.moving) {
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
        
        const combo = checkAndTriggerCombo(
          firedSkillIdx,
          p,
          tx,
          ty,
          actualRange,
          particlesRef.current,
          textsRef.current,
          shakeRef
        );
        const comboMult = combo ? combo.multiplier : 1.0;
        const damage = (sk.baseDamage + sk.level * 25 + p.currentStats.int * 5) * buffs.dmgMult * comboMult;
        const sectId = getSectIdFromColor(p.color);
        const playerEl = getSectElement(sectId);
        
        entitiesRef.current.forEach(e => {
          const dist = Math.hypot(e.x - tx, e.y - ty);
          if (dist <= actualRange) {
            const elementInfo = getElementalMultipliers(playerEl, e.element);
            const isCrit = Math.random() < (0.10 + p.currentStats.agi * 0.005);
            
            let elementalDamage = damage * elementInfo.mult;
            if (p.rageActive) elementalDamage *= 1.5; // active burst 1.5x damage!
            
            let d = Math.max(1, Math.floor(elementalDamage * (0.8 + Math.random() * 0.4)));
            if (isCrit) {
              const Math_floor = Math.floor;
              const critDb = buffs.critDmgMult || 1.5;
              d = Math_floor(d * critDb);
            }
            
            // Accumulate player rage on skill target hit
            if (!p.dead && !p.rageActive) {
              let accum = 1;
              if (isCrit) accum += 1; // Crit bonus
              if (e.hp - d <= 0) accum += 2; // Kill bonus
              p.rage = Math.min(p.maxRage, p.rage + accum);
            }

            e.hp -= d;
            
            // Build element-themed notification text
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
            
            textsRef.current.push({
              id: Math.random(),
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y - 20 - Math.random() * 20,
              text: skillText,
              color: skillColor,
              life: isCrit ? 1.8 : 1.5
            });
          }
        });
      }


      // Item Pickup (Wide auto-loot range 180px & +15% gold boost if companion is active)
      let goldEarned = 0;
      const pickupRange = prev.companion ? 180 : 50;
      for (let i = dropsRef.current.length - 1; i >= 0; i--) {
        const d = dropsRef.current[i];
        if (Math.hypot(p.x - d.x, p.y - d.y) < pickupRange) {
          const goldVal = equipItem(d, p, buffs, prev.stage);
          const boostedGold = prev.companion ? Math.floor(goldVal * 1.15) : goldVal;
          goldEarned += boostedGold;
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

  const doDamage = (
    e: Entity,
    amt: number,
    col: string,
    srcX: number,
    srcY: number,
  ) => {
    const pRef = stateRef.current.player;
    const sectId = getSectIdFromColor(pRef.color);
    const playerEl = getSectElement(sectId);
    const elementInfo = getElementalMultipliers(playerEl, e.element);
    
    // Sát thương nhân sắc Sinh Khắc (Omega)
    const elementalDamage = amt * elementInfo.mult;
    
    // Burst Mode (Rage active) confers 1.5x damage supercharge!
    const burstMult = pRef.rageActive ? 1.5 : 1.0;
    const finalDamage = Math.max(1, Math.floor(elementalDamage * burstMult * (0.8 + Math.random() * 0.4)));

    // Accumulate player Rage point
    if (!pRef.dead && !pRef.rageActive) {
      let accum = 1; // Base hit
      if (e.hp - finalDamage <= 0) accum += 2; // Kill bonus
      pRef.rage = Math.min(pRef.maxRage, pRef.rage + accum);
    }

    e.hp -= finalDamage;

    // Build themed damage outputs
    const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
    const elName = { Metal: 'KIM', Wood: 'MỘC', Water: 'THỦY', Fire: 'HỎA', Earth: 'THỔ' };
    
    let dmgText = finalDamage.toString();
    let txtColor = col;
    
    if (elementInfo.mult > 1.0) {
      dmgText = `⚡ ${elName[playerEl]} KHẮC! -${finalDamage}`;
      txtColor = elColor[playerEl];
    } else if (elementInfo.mult < 1.0) {
      dmgText = `🛡️ BỊ KHẮC -${finalDamage}`;
      txtColor = '#7f8c8d';
    } else {
      txtColor = elColor[playerEl] || col;
    }

    if (pRef.rageActive) {
      dmgText = `🔥 BỘC PHÁT! -${finalDamage}`;
      txtColor = '#ff3300';
    }

    textsRef.current.push({
      id: Math.random(),
      x: e.x,
      y: e.y - 30,
      text: dmgText,
      color: txtColor,
      life: pRef.rageActive ? 1.6 : 1.2,
    });

    // Spawn extremely smooth, animated Cocos-Engine Custom Label
    const cocosLabel = new cc.Label(dmgText, pRef.rageActive ? 17 : 13, txtColor);
    cocosLabel.x = e.x;
    cocosLabel.y = e.y - 30;
    cocosLabel.strokeColor = "#0a0a0a";
    cocosLabel.strokeWidth = 3.5;
    cocosLabel.fontFamily = "system-ui, -apple-system, sans-serif";
    
    const distanceUp = -50 - Math.random() * 30;
    const animDuration = pRef.rageActive ? 1.3 : 0.95;
    cocosLabel.runAction(
      cc.sequence(
        cc.moveTo(animDuration, e.x, e.y - 30 + distanceUp),
        cc.callFunc(() => {
          cocosSceneRef.current.removeChild(cocosLabel);
        })
      )
    );
    cocosLabel.runAction(cc.fadeTo(animDuration, 0));
    cocosSceneRef.current.addChild(cocosLabel);

    // Particles themed by Element or default
    const particleColor = elColor[playerEl] || col;
    
    // Trigger Cocos-based Particle System for premium rendering spark impacts
    cocosParticlesRef.current.spawn(e.x, e.y, particleColor, pRef.rageActive ? 3.5 : 2.5, pRef.rageActive ? 14 : 7);
    if (particlesRef.current.length < 120) {
      for (let i = 0; i < (pRef.rageActive ? 8 : 5); i++) {
        const angle =
          Math.atan2(e.y - srcY, e.x - srcX) + (Math.random() - 0.5);
        const speed = (pRef.rageActive ? 220 : 150) + Math.random() * 80;
        particlesRef.current.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5,
          color: particleColor,
          size: pRef.rageActive ? 3.5 : 2,
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
        const compExist = prev.companion !== null && prev.companion !== undefined;
        const expGain = Math.floor(
          (e.isBoss ? 100 : 15) *
          Math.pow(1.1, prev.stage) *
          prev.buffs.resMult *
          prev.buffs.rlExp *
          (compExist ? 1.15 : 1.0)
        );

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

        let companion = prev.companion;
        if (companion) {
          companion = { ...companion };
          companion.exp += expGain * 0.5;
          const maxCompExp = 120 * companion.level;
          if (companion.exp >= maxCompExp) {
            companion.exp -= maxCompExp;
            companion.level += 1;
            const armorLvl = companion.equipment.armor?.upgradeLvl || 0;
            const clawLvl = companion.equipment.weapon?.upgradeLvl || 0;
            companion.maxHp = 150 + companion.level * 25 + armorLvl * 50;
            companion.hp = companion.maxHp;
            companion.atk = 15 + companion.level * 4 + clawLvl * 5;
            addNotification(`✨ ĐỒNG HÀNH ${companion.name.toUpperCase()} LÊN CẤP ${companion.level}!`, "#ffca28");
          }
        }

        if (e.isBoss || Math.random() < 0.15) {
          generateDrop(e.x, e.y, e.isBoss, prev.stage);
        }

        return {
          ...prev,
          gold: prev.gold + goldGain,
          exp: newExp,
          companion,
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
    // Bosses give much better loot, but still keeps gold/red/pink rare
    if (isBoss) roll *= 0.12; 

    let rIdx = 0;
    if (roll < 0.001) rIdx = 7;      // pink - Vô Thượng Thánh Thể (0.1% base)
    else if (roll < 0.004) rIdx = 6; // crimson - Huyết Ảnh (0.3% base)
    else if (roll < 0.014) rIdx = 5; // gold_rarity - Hoàng Kim (1.0% base)
    else if (roll < 0.045) rIdx = 4; // emerald (3.1% base)
    else if (roll < 0.115) rIdx = 3; // legendary (7.0% base)
    else if (roll < 0.30) rIdx = 2;  // epic (18.5% base)
    else if (roll < 0.65) rIdx = 1;  // rare (35% base)
    else rIdx = 0;                  // common (35% base)

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

    // Unlocks larger range of tiers early-game, cap at 9 (Cửu Đẳng)
    const maxPossibleTier = Math.min(9, Math.max(3, stage + 1));
    
    // Balanced, exciting, progression-tuned tier distribution!
    const randRoll = Math.random();
    let tier = 1;
    if (randRoll < 0.35) {
      // 35% chance to roll current max tier
      tier = maxPossibleTier;
    } else if (randRoll < 0.60) {
      // 25% chance to roll max - 1
      tier = Math.max(1, maxPossibleTier - 1);
    } else if (randRoll < 0.80) {
      // 20% chance to roll max - 2
      tier = Math.max(1, maxPossibleTier - 2);
    } else {
      // 20% chance to roll a fully random tier up to max
      tier = Math.max(1, Math.floor(1 + Math.random() * maxPossibleTier));
    }

    // Apply high tier multiplier (+35% more base power per higher tier representing deep VLTK upgrade levels!)
    const tierBonus = 1 + (tier - 1) * 0.35;
    const power = stage * RARITY_MULTIPLIERS[rarity] * tierBonus;
    const name = EQUIPMENT_NAME_MAP[type][rarity] || "Vô Danh Bảo Vật";

    dropsRef.current.push({
      id: Math.random(),
      x,
      y,
      type,
      rarity,
      power,
      name,
      tier,
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
        tier: item.tier,
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
      
      const newMaxMp = Math.floor(
        (100 + p.currentStats.nei * 15) * 1.0,
      );
      p.maxMp = newMaxMp;
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
    cc.director.update(dt);

    // Companion Autonomous Battle Strike (Tốc đánh, kĩ năng theo đẳng cấp & trang bị!)
    const comp = stateRef.current.companion;
    if (comp && stateRef.current.state === "PLAYING") {
      companionAtkTimerRef.current -= dt;
      if (companionAtkTimerRef.current <= 0) {
        companionAtkTimerRef.current = Math.max(1.0, 4.5 - comp.level * 0.15);

        const p = stateRef.current.player;
        let minDist = 350;
        let nearest: any = null;
        entitiesRef.current.forEach((e) => {
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
            particlesRef.current.push({
              x: px,
              y: py,
              vx: (Math.random() - 0.5) * 30,
              vy: (Math.random() - 0.5) * 30,
              life: 0.35,
              color: "#f1c40f",
              size: 2.2
            });
          }

          // Styled yellow floating damage text
          textsRef.current.push({
            id: Math.random(),
            x: nearest.x,
            y: nearest.y - 40,
            text: `☯️ [${comp.name}] HỒ TRỢ KÍCH SÁT -${compDamage}`,
            color: "#ffca28",
            life: 1.4
          });
        }
      }
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

    // Draw realistic repeatable grass texture as a master underlay
    ctx.save();
    ctx.translate(-cx, -cy);
    
    // Fill the battlefield MAP_SIZE with a healthy base solid color (so it's not totally black even without the image!)
    let biomeMapFill = "#22472b"; // default forest - rich warm green
    if (cycle === 1) biomeMapFill = "#6e5235"; // Desert - golden warm sands 
    else if (cycle === 2) biomeMapFill = "#32455c"; // Mountain/Ice - solid ice-blue mountain terrain
    else if (cycle === 3) biomeMapFill = "#344e3a"; // Plains - prairie green
    
    ctx.fillStyle = biomeMapFill;
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    const isStone = (cycle === 1 || cycle === 2);
    let pattern: CanvasPattern | null = null;
    if (isStone) {
      if (stonePatternRef.current) {
        pattern = stonePatternRef.current;
      } else if (stoneImgRef.current) {
        try {
          const pat = ctx.createPattern(stoneImgRef.current, "repeat");
          if (pat) {
            try {
              const matrix = new DOMMatrix();
              matrix.scaleSelf(0.22, 0.22);
              pat.setTransform(matrix);
            } catch (e) {}
            stonePatternRef.current = pat;
            pattern = pat;
          }
        } catch (err) {}
      }
    } else {
      if (grassPatternRef.current) {
        pattern = grassPatternRef.current;
      } else if (grassImgRef.current) {
        try {
          const pat = ctx.createPattern(grassImgRef.current, "repeat");
          if (pat) {
            try {
              const matrix = new DOMMatrix();
              matrix.scaleSelf(0.22, 0.22);
              pat.setTransform(matrix);
            } catch (e) {}
            grassPatternRef.current = pat;
            pattern = pat;
          }
        } catch (err) {}
      }
    }

    if (pattern) {
      try {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

        // Apply beautiful watercolor aesthetic composite tint based on biome cycle (using soft overlays)
        if (cycle === 0) {
          // Forest - Lush Deep Jade Green
          ctx.fillStyle = "rgba(10, 40, 15, 0.25)";
        } else if (cycle === 1) {
          // Desert - Golden Dun
          ctx.fillStyle = "rgba(200, 120, 20, 0.22)";
        } else if (cycle === 2) {
          // Mountain - Ice Frost Blue
          ctx.fillStyle = "rgba(140, 180, 220, 0.22)";
        } else {
          // Plains - Soft Olive Ink
          ctx.fillStyle = "rgba(40, 60, 40, 0.18)";
        }
        ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
      } catch (err) {}
    }
    ctx.restore();

    // World coordinate grid / Grass details
    ctx.save();
    let gridColor = "rgba(32, 58, 37, 0.4)";
    if (cycle === 1) gridColor = "rgba(110, 80, 40, 0.35)";
    else if (cycle === 2) gridColor = "rgba(80, 110, 150, 0.35)";
    else if (cycle === 3) gridColor = "rgba(40, 70, 50, 0.35)";
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1.5;
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
    
    // Draw grass blades and textures inside tiles (sparsely for massive performance boost)
    ctx.globalAlpha = 0.8;
    let detailColor = "#203a25"; // Forest
    if (cycle === 1) detailColor = "#523f2b"; // Desert
    else if (cycle === 2) detailColor = "#2b3b4f"; // Mountain
    else if (cycle === 3) detailColor = "#293e2f"; // Plains
    
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    for (let x = startX; x < endX; x += tileSize * 3) {
      for (let y = startY; y < endY; y += tileSize * 3) {
        // Randomly place some grass marks
        const gx = x + (Math.abs(x * 13) % tileSize);
        const gy = y + (Math.abs(y * 17) % tileSize);
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
        if (lanternImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.32)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 0.45, s.sz * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 1.45;
          const imgH = s.sz * 2.15;
          ctx.drawImage(
            lanternImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.85,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
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
        }
      } else if (s.t === 1) {
        // Wooden Barricade
        if (barricadeImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.15, s.sz * 1.25, s.sz * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 2.3;
          const imgH = s.sz * 1.7;
          ctx.drawImage(
            barricadeImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.72,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, s.sz, s.sz * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#5c4033";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(sx - s.sz * 0.8, sy - s.sz * 0.4);
          ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 0.4);
          ctx.stroke();

          ctx.strokeStyle = "#7f8c8d";
          ctx.lineWidth = 3;
          for (let sp = -s.sz * 0.6; sp <= s.sz * 0.6; sp += 15) {
             ctx.beginPath();
             ctx.moveTo(sx + sp, sy - s.sz * 0.4);
             ctx.lineTo(sx + sp + 5, sy - s.sz * 1.2);
             ctx.stroke();
          }
        }
      } else if (s.t === 2) {
        // Green leafy tree
        if (treeImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 1.0, s.sz * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 2.5;
          const imgH = s.sz * 2.8;
          ctx.drawImage(
            treeImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.85,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, s.sz * 0.8, s.sz * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#5d4037";
          ctx.beginPath();
          ctx.moveTo(sx - s.sz * 0.1, sy);
          ctx.lineTo(sx - s.sz * 0.2, sy - s.sz * 1.5);
          ctx.lineTo(sx + s.sz * 0.2, sy - s.sz * 1.5);
          ctx.lineTo(sx + s.sz * 0.1, sy);
          ctx.fill();

          ctx.fillStyle = "#2e7d32";
          ctx.beginPath();
          ctx.ellipse(sx, sy - s.sz * 1.8, s.sz * 1.5, s.sz * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = "#43a047";
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
        }
      } else if (s.t === 3) {
        // Battle Flag / Banner
        if (flagImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 0.5, s.sz * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 1.8;
          const imgH = s.sz * 2.9;
          ctx.drawImage(
            flagImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.88,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
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
      } else if (s.t === 4) {
        // Catapult (Máy bắn đá kiểu Tống Kim)
        if (catapultImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.15, s.sz * 1.25, s.sz * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 2.2;
          const imgH = s.sz * 2.0;
          ctx.drawImage(
            catapultImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.76,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, s.sz * 1.1, s.sz * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#8d6e63";
          ctx.fillRect(sx - s.sz * 0.8, sy - s.sz * 0.2, s.sz * 1.6, s.sz * 0.3);
          ctx.fillRect(sx - s.sz * 0.1, sy - s.sz * 1.0, s.sz * 0.2, s.sz * 0.9);

          ctx.fillStyle = "#3e2723";
          ctx.beginPath();
          ctx.arc(sx - s.sz * 0.6, sy + s.sz * 0.1, s.sz * 0.25, 0, Math.PI * 2);
          ctx.arc(sx + s.sz * 0.6, sy + s.sz * 0.1, s.sz * 0.25, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = "#d7ccc8";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.strokeStyle = "#5d4037";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(sx + s.sz * 0.3, sy - s.sz * 0.1);
          ctx.lineTo(sx - s.sz * 0.9, sy - s.sz * 1.2);
          ctx.stroke();

          ctx.fillStyle = "#9e9e9e";
          ctx.beginPath();
          ctx.arc(sx - s.sz * 0.9, sy - s.sz * 1.2, s.sz * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (s.t === 5) {
        // Bamboo/wooden fence
        if (fenceImgRef.current) {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.beginPath();
          ctx.ellipse(sx, sy + s.sz * 0.12, s.sz * 1.15, s.sz * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          const imgW = s.sz * 2.2;
          const imgH = s.sz * 1.6;
          ctx.drawImage(
            fenceImgRef.current,
            sx - imgW / 2,
            sy - imgH * 0.72,
            imgW,
            imgH
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, s.sz * 1.0, s.sz * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#a1887f";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(sx - s.sz * 0.7, sy + s.sz * 0.1);
          ctx.lineTo(sx + s.sz * 0.5, sy - s.sz * 1.1);
          ctx.moveTo(sx + s.sz * 0.7, sy + s.sz * 0.1);
          ctx.lineTo(sx - s.sz * 0.5, sy - s.sz * 1.1);
          ctx.moveTo(sx - s.sz * 0.8, sy - s.sz * 0.45);
          ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 0.45);
          ctx.stroke();
        }
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
        
          } else if (par.type === 'sword') {
        // Raining swords (optimized fast vector glow)
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
        
        // Fast dual-blend neon glow replacing shadowBlur
        ctx.fillStyle = par.color;
        ctx.globalAlpha = 0.25 * alpha;
        ctx.fillRect(-par.size / 3, -par.size * 1.9, par.size * 0.66, par.size * 3.8);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-par.size / 6, -par.size * 1.8, par.size / 3, par.size * 3.5);
        
        if (par.rotation) ctx.rotate(-par.rotation);
        ctx.translate(-px, -py);
      } else if (par.type === 'trail') {
        // Double-circle aura simulation (100x faster than shadowBlur)
        ctx.fillStyle = par.color;
        ctx.globalAlpha = 0.3 * alpha;
        ctx.beginPath();
        ctx.arc(px, py, par.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, par.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (par.type === 'beam') {
        // Clean double-layered glowing beam
        ctx.strokeStyle = par.color;
        ctx.lineWidth = Math.max(3, par.size * (par.life / 0.8) * 3.5);
        ctx.globalAlpha = 0.25 * alpha;
        ctx.beginPath();
        ctx.moveTo(px - 1000, py);
        ctx.lineTo(px + 1000, py);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, par.size * (par.life / 0.8) * 1.1);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(px - 1000, py);
        ctx.lineTo(px + 1000, py);
        ctx.stroke();
      } else if (par.type === 'lightning') {
        // Collect coordinates once for double-pass consistent coordinates without random shifts
        const pts: { x: number; y: number }[] = [{ x: px, y: py - 500 }];
        let cyy = py - 500;
        let cxx = px;
        while (cyy < py) {
          cyy += 30 + Math.random() * 40;
          cxx += (Math.random() - 0.5) * 50;
          pts.push({ x: cxx, y: cyy });
        }

        // Draw outer thick color aura
        ctx.strokeStyle = par.color;
        ctx.lineWidth = 5 + Math.random() * 3;
        ctx.globalAlpha = 0.35 * alpha;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Draw inner intense hot-white center core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 + Math.random() * 1.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      } else {
        // Default dot
        ctx.fillStyle = par.color;
        ctx.fillRect(px, py, Math.max(1, par.size), Math.max(1, par.size));
      }
    });
    ctx.restore();

    // Drops with Majestic Luminous Light Auras (Hào Quang Ánh Sáng) and floating item badges
    dropsRef.current.forEach((d) => {
      const dx = d.x - cx;
      const dy = d.y - cy;
      const rColor = RARITY_COLORS[d.rarity] || "#ffffff";
      
      // Highlight high-tier treasures with grander visual auras
      const isSuperRare = d.rarity === 'pink' || d.rarity === 'crimson' || d.rarity === 'gold_rarity';
      const baseRadius = isSuperRare ? 38 : 26;
      
      // Gentle breathing scale factor
      const pulse = 1 + Math.sin(time * 0.003) * 0.08;
      const auraRadius = baseRadius * pulse;
      
      // 1. Majestic Luminous Light Aura (Hào quang linh diệu) using high-performance Radial Gradients
      ctx.save();
      const grad = ctx.createRadialGradient(dx, dy, d.rarity === 'pink' || d.rarity === 'crimson' ? 4 : 2, dx, dy, auraRadius);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.2, `${rColor}cc`);
      grad.addColorStop(0.6, `${rColor}33`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dx, dy, auraRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // 2. Slow, majestic rotating light rays / divine flares (similar to VLTK divine weapon glows)
      // Matches serene skill effect timings, entirely separate from battle skill ring circles
      ctx.save();
      const slowAngle = (time * 0.0005) % (Math.PI * 2); // Majestic steady speed (approx 12s per full circle)
      ctx.translate(dx, dy);
      ctx.rotate(slowAngle);
      
      // Draw 4-point/8-point holy light star rays for premium items
      ctx.fillStyle = rColor;
      ctx.globalAlpha = 0.35 + Math.sin(time * 0.004) * 0.1; // Smooth breathing transparency
      
      // Primary horizontal/vertical slender diamonds representing beautiful light flares
      const rayLength = auraRadius * 1.35;
      const rayWidth = isSuperRare ? 4 : 2.5;
      
      ctx.beginPath();
      // Upward Ray
      ctx.moveTo(0, -rayLength);
      ctx.lineTo(rayWidth, 0);
      ctx.lineTo(-rayWidth, 0);
      // Downward Ray
      ctx.moveTo(0, rayLength);
      ctx.lineTo(rayWidth, 0);
      ctx.lineTo(-rayWidth, 0);
      // Rightward Ray
      ctx.moveTo(rayLength, 0);
      ctx.lineTo(0, rayWidth);
      ctx.lineTo(0, -rayWidth);
      // Leftward Ray
      ctx.moveTo(-rayLength, 0);
      ctx.lineTo(0, rayWidth);
      ctx.lineTo(0, -rayWidth);
      ctx.fill();
      
      // Secondary diagonal cross for super rare treasures (Gold, Red, Pink)
      if (isSuperRare) {
        ctx.rotate(Math.PI / 4);
        const subLength = rayLength * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -subLength);
        ctx.lineTo(rayWidth * 0.7, 0);
        ctx.lineTo(-rayWidth * 0.7, 0);
        ctx.moveTo(0, subLength);
        ctx.lineTo(rayWidth * 0.7, 0);
        ctx.lineTo(-rayWidth * 0.7, 0);
        ctx.moveTo(subLength, 0);
        ctx.lineTo(0, rayWidth * 0.7);
        ctx.lineTo(0, -rayWidth * 0.7);
        ctx.moveTo(-subLength, 0);
        ctx.lineTo(0, rayWidth * 0.7);
        ctx.lineTo(0, -rayWidth * 0.7);
        ctx.fill();
      }
      
      ctx.restore();
      
      // 4. Center item chest shadow
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(dx, dy + 10, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // 5. Draw the item box itself
      ctx.save();
      ctx.fillStyle = rColor;
      ctx.beginPath();
      ctx.arc(dx, dy, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#000";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("📦", dx, dy + 4);
      ctx.restore();
      
      // 6. Draw floating item name metadata panel above the box
      ctx.save();
      ctx.font = "bold 9px Arial";
      
      const hanBadges = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      const curBadge = hanBadges[d.tier || 1] || '一';
      const badgeText = `${d.name} (Đảng ${curBadge})`;
      const textWidth = ctx.measureText(badgeText).width;
      
      ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
      ctx.strokeStyle = rColor;
      ctx.lineWidth = 1;
      
      // Crisp retro board label
      const bx = dx - textWidth / 2 - 6;
      const by = dy - 28;
      const bw = textWidth + 12;
      const bh = 14;
      
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.fill();
      ctx.stroke();
      
      // Write formatted title text
      ctx.fillStyle = rColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, dx, dy - 20);
      ctx.restore();
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

      // Entity Name if Boss
      if (e.isBoss && e.name) {
        ctx.fillStyle = e.isSubBoss ? "#e67e22" : "#9b59b6";
        ctx.font = "bold 13px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2;
        ctx.strokeText(e.name, ex, ey - e.size - 25);
        ctx.shadowBlur = 0;
        ctx.fillText(e.name, ex, ey - e.size - 25);
      }

      // HP Bar
      ctx.fillStyle = "#000";
      ctx.fillRect(ex - 20, ey - e.size - 15, 40, 5);
      ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
      ctx.fillRect(ex - 20, ey - e.size - 15, 40 * Math.max(0, Math.min(1, e.hp / e.maxHp)), 5);

      // Draw element indicator next to HP Bar
      if (e.element) {
        const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
        const elEmoji = { Metal: '⚡', Wood: '🍃', Water: '💧', Fire: '🔥', Earth: '⛰️' };
        ctx.fillStyle = elColor[e.element] || '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(elEmoji[e.element], ex - 24, ey - e.size - 10);
      }

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

      // Banner aura passive battlefield design (Highly optimized with nested strokes)
      if (p.equipment.banner !== null) {
        ctx.save();
        // Thick low-opacity outer glow ring
        ctx.strokeStyle = "rgba(243, 156, 18, 0.22)"; 
        ctx.lineWidth = 12.0;
        ctx.beginPath();
        ctx.ellipse(px, py + p.radius, 160, 64, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Solid golden inner ring
        ctx.strokeStyle = "rgba(243, 156, 18, 0.85)";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.ellipse(px, py + p.radius, 160, 64, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.translate(px, py + p.radius);
        ctx.strokeStyle = "rgba(243, 156, 18, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 160, 64, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw multiple rotating glowing fire dots/particles around the concentric ellipse track
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (time * 0.0018 + (i * Math.PI * 2) / particleCount) % (Math.PI * 2);
          const rx = Math.cos(angle) * 160;
          const ry = Math.sin(angle) * 64;
          
          ctx.fillStyle = i % 2 === 0 ? "#ff8c00" : "#ffed4a";
          ctx.beginPath();
          ctx.arc(rx, ry, 5 + Math.sin(time * 0.006 + i) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
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

      // Render Flying/Orbiting Companion Animal Mascot (Beast Companion)
      const comp = stateRef.current.companion;
      if (comp) {
        const orbitRadius = 45;
        const speedMult = 0.003;
        const angle = time * speedMult;
        const petX = px + Math.cos(angle) * orbitRadius;
        const petY = py + Math.sin(angle) * orbitRadius - 10;
        
        // Draw a tiny shadow under the mascot
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(petX, petY + 14, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw mascot emoji or custom sect-specific sprite!
        ctx.save();
        const compSectId = getSectIdFromColor(p.color);
        const compSprite = compSectId ? companionSectSpritesRef.current[compSectId] : null;
        if (compSprite) {
          const compW = 28;
          const compH = 28;
          ctx.drawImage(compSprite, petX - compW / 2, petY - compH / 2, compW, compH);
        } else {
          ctx.font = "18px Arial";
          ctx.textAlign = "center";
          ctx.fillText(comp.emoji || "🐯", petX, petY);
        }
        
        // Render companion level above
        ctx.font = "bold 9px font-sans";
        ctx.fillStyle = "#f39c12";
        ctx.textAlign = "center";
        ctx.fillText(`Lg. ${comp.level || 1}`, petX, petY - 16);
        ctx.restore();
      }
    }

    // Cocos Engine Render Pass
    ctx.save();
    ctx.translate(-cx, -cy);
    cocosSceneRef.current.render(ctx);
    ctx.restore();

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
      className="block cursor-crosshair"
    />
  );
}
