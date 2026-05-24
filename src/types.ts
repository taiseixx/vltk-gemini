
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'emerald' | 'gold_rarity' | 'crimson' | 'pink';

export interface Sect {
  id: string;
  name: string;
  icon: string;
  color: string;
  motto: string;
  stats: {
    str: number;
    agi: number;
    con: number;
    int: number;
    nei: number;
  };
  skills: string[];
}

export interface Skill {
  name: string;
  level: number;
  maxLevel: number;
  cooldown: number;
  cooldownLeft: number;
  manaCost: number;
  baseDamage: number;
  range: number;
  color: string;
}

export type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'special' | 'horse' | 'cloak' | 'seal' | 'banner';

export interface Equipment {
  type: EquipmentType;
  rarity: Rarity;
  power: number;
  name: string;
  tier?: number;
  upgradeLvl?: number;
}

export interface Companion {
  name: string;
  type: string;
  emoji: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  unlocked: boolean;
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
  };
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  size: number;
  atkCd: number;
  color: string;
  isBoss: boolean;
  name?: string;
  isSubBoss?: boolean;
  element?: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife?: number;
  color: string;
  size: number;
  isBlast?: boolean;
  type?: 'dot' | 'blast' | 'ring' | 'pillar' | 'sword' | 'trail' | 'text' | 'shockwave' | 'beam' | 'lightning';
  rotation?: number;
  vr?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Drop {
  id: number;
  x: number;
  y: number;
  type: EquipmentType;
  rarity: Rarity;
  power: number;
  name: string;
  tier?: number;
}

export interface GameState {
  state: 'SELECTING' | 'PLAYING' | 'CLEARED' | 'GAMEOVER';
  stage: number;
  lives: number;
  livesBought: number;
  gold: number;
  exp: number;
  mobsTotal: number;
  mobsKilled: number;
  bossSpawned: boolean;
  stagePhase: 'CREEPS' | 'SUB_BOSSES' | 'FINAL_BOSS';
  auto: boolean;
  
  player: {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    radius: number;
    speed: number;
    facing: number;
    level: number;
    statPoints: number;
    skillPoints: number;
    baseStats: Sect['stats'];
    currentStats: Sect['stats'];
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    atk: number;
    rage: number;
    maxRage: number;
    rageActive?: boolean;
    rageTimer?: number;
    target: Entity | null;
    moving: boolean;
    atkCd: number;
    dead: boolean;
    color: string;
    icon: string;
    sectId?: string;
    skillComboHistory?: number[]; 
    comboTimer?: number;
    activeCombo?: { name: string; multiplier: number; timer: number; color: string } | null;
    equipment: {
      weapon: Equipment | null;
      armor: Equipment | null;
      accessory: Equipment | null;
      special: Equipment | null;
      horse: Equipment | null;
      cloak: Equipment | null;
      seal: Equipment | null;
      banner: Equipment | null;
    };
  };

  buffs: {
    dmgMult: number;
    hpMult: number;
    cdReduc: number;
    resMult: number;
    rlGold: number;
    rlExp: number;
    rlExec: number;
    critDmgMult?: number;
    skillRangeBonus?: number;
  };

  skills: Skill[];
  entities: Entity[];
  drops: Drop[];
  livesPurchased: number;
  companion?: Companion;
}
