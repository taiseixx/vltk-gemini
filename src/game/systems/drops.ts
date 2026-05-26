import { GameState, Drop, MartialManual, EquipmentType } from "../../types";
import {
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  RARITIES,
  EQUIPMENT_NAME_MAP,
} from "../../constants";

export function generateDrop(
  x: number,
  y: number,
  isBoss: boolean,
  stage: number,
  drops: Drop[]
): void {
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

  drops.push({
    id: Math.random(),
    x,
    y,
    type,
    rarity,
    power,
    name,
    tier,
  });
}

export function equipItem(
  item: Drop,
  p: GameState["player"],
  buffs: GameState["buffs"],
  stage: number,
  manuals?: MartialManual[],
  addNotification?: (txt: string, col: string) => void
): number {
  const current = p.equipment[item.type];
  if (!current || item.power > current.power) {
    p.equipment[item.type] = {
      type: item.type,
      rarity: item.rarity,
      power: item.power,
      name: item.name,
      tier: item.tier,
    };

    // Extract Secret Bible (Bí Kíp) active passive buffs
    let bAtkChance = 0;
    let bAtkSpeed = 0;
    let bGoldMult = 1.0;
    let bResBonus = 1.0;
    let bHpBonus = 0;
    let bMpBonus = 0;

    if (manuals) {
      manuals.forEach(m => {
        if (m.equipped) {
          if (m.statBoost.atkChance) bAtkChance += m.statBoost.atkChance;
          if (m.statBoost.atkSpeed) bAtkSpeed += m.statBoost.atkSpeed;
          if (m.statBoost.goldMult) bGoldMult += m.statBoost.goldMult;
          if (m.statBoost.resBonus) bResBonus += m.statBoost.resBonus;
          if (m.statBoost.hpBonus) bHpBonus += m.statBoost.hpBonus;
          if (m.statBoost.mpBonus) bMpBonus += m.statBoost.mpBonus;
        }
      });
    }

    // Recalc stats buffs
    const eq = p.equipment;
    
    // Balanced Weapon (VJ) -> DMG: x0.02 instead of x0.1 (prevents hacker damage scaling)
    buffs.dmgMult = 1 + (eq.weapon ? eq.weapon.power * 0.02 : 0);
    
    // Balanced Armor (GIÁP) -> HP: x0.012 instead of x0.05
    buffs.hpMult = 1 + (eq.armor ? eq.armor.power * 0.012 : 0);
    
    // Cloak (🧥) -> Crit DMG Multiplier
    const critDmgBonus = eq.cloak ? eq.cloak.power * 0.008 : 0;
    buffs.critDmgMult = 1.5 + critDmgBonus;
    
    // Seal (🔏) -> Skill range bonus
    const rangeBonus = eq.seal ? eq.seal.power * 0.8 : 0;
    buffs.skillRangeBonus = rangeBonus;
    buffs.critChanceBonus = bAtkChance;

    // Banner (🚩) -> Lifesteal
    const lifeStealBonus = eq.banner ? eq.banner.power * 0.005 : 0;
    buffs.lifeSteal = lifeStealBonus;

    // Accessory (💍) & Horse (🐴) -> CD reduction (capped at 75% limit to retain skill tactical pacing)
    const cdBonus = (eq.accessory ? eq.accessory.power * 0.005 : 0) + (eq.horse ? eq.horse.power * 0.003 : 0) + bAtkSpeed;
    buffs.cdReduc = Math.min(0.75, cdBonus);
    
    // Special (🔮) -> Resistance (resMult)
    buffs.resMult = (1 + (eq.special ? eq.special.power * 0.025 : 0)) * bResBonus;
    
    // Movement speed -> Horse (🐴) adds direct speed
    const speedBonus = eq.horse ? eq.horse.power * 4 : 0;
    p.speed = 160 + p.currentStats.agi * 5 + speedBonus;

    // Integrate Bí Kíp flat bonuses into player totals
    const newMaxHp = Math.floor(
      (300 + p.currentStats.con * 20) * buffs.hpMult,
    ) + bHpBonus;
    p.maxHp = newMaxHp;
    
    const newMaxMp = Math.floor(
      (100 + p.currentStats.nei * 15) * 1.0,
    ) + bMpBonus;
    p.maxMp = newMaxMp;
    p.atk = Math.floor((25 + p.currentStats.str * 3) * buffs.dmgMult);

    if (addNotification) {
      addNotification(`Nhặt được [${item.name}]`, RARITY_COLORS[item.rarity]);
    }
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
    if (addNotification) {
      addNotification(`Thu hồi [${item.name}] phế phẩm, nhận +${recycleVal} Vàng`, "#f1c40f");
    }
    return recycleVal;
  }
}

export function tickDrops(
  state: GameState,
  drops: Drop[],
  actions: {
    addNotification: (txt: string, col: string) => void;
  }
): number {
  const p = state.player;
  const buffs = state.buffs;
  let goldEarned = 0;
  const pickupRange = state.companion ? 180 : 50;

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (Math.hypot(p.x - d.x, p.y - d.y) < pickupRange) {
      const goldVal = equipItem(d, p, buffs, state.stage, state.manuals, actions.addNotification);
      const boostedGold = state.companion ? Math.floor(goldVal * 1.15) : goldVal;
      goldEarned += boostedGold;
      drops.splice(i, 1);
    }
  }

  return goldEarned;
}
