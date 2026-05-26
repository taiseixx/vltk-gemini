import { GameState, Entity, Particle, FloatingText, MartialManual } from "../../types";
import { getSectIdFromColor, getSectElement, getElementalMultipliers } from "../elements";
import { SECT_LEVEL_MANUALS } from "../../utils/quest";
import { sfx } from "../../utils/audio";

export function doDamage(
  e: Entity,
  amt: number,
  col: string,
  srcX: number,
  srcY: number,
  state: GameState,
  entities: Entity[],
  particles: Particle[],
  texts: FloatingText[],
  actions: {
    addNotification: (txt: string, col: string) => void;
    generateDrop: (x: number, y: number, isBoss: boolean, stage: number) => void;
    shakeRef: { current: number };
    frameTotalDmgRef: { current: number };
  }
) {
  const pRef = state.player;
  const sectId = getSectIdFromColor(pRef.color);
  const playerEl = getSectElement(sectId);
  const elementInfo = getElementalMultipliers(playerEl, e.element);
  
  // Sát thương nhân sắc Sinh Khắc
  const elementalDamage = amt * elementInfo.mult;
  
  // Burst Mode (Rage active) confers 1.5x damage supercharge
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

  if (texts.length < 35) {
    texts.push({
      id: Math.random(),
      x: e.x,
      y: e.y - 30,
      text: dmgText,
      color: txtColor,
      life: pRef.rageActive ? 1.6 : 1.2,
    });
  } else {
    actions.frameTotalDmgRef.current += finalDamage;
  }

  // Particles themed by Element or default
  const particleColor = elColor[playerEl] || col;
  if (particles.length < 120) {
    for (let i = 0; i < (pRef.rageActive ? 8 : 5); i++) {
      const angle =
        Math.atan2(e.y - srcY, e.x - srcX) + (Math.random() - 0.5);
      const speed = (pRef.rageActive ? 220 : 150) + Math.random() * 80;
      particles.push({
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
    if (e.isBoss) actions.shakeRef.current = 10;

    // Mutate state directly
    const goldDecayFactor = state.stage > 12 
      ? Math.max(0.12, 1 - (state.stage - 12) * 0.04) 
      : 1.0;
      
    const goldGain = Math.floor(
      (e.isBoss ? 50 : 5) *
        Math.pow(1.11, state.stage) *
        state.buffs.resMult *
        state.buffs.rlGold *
        goldDecayFactor
    );
    const compExist = state.companion !== null && state.companion !== undefined;
    const expGain = Math.floor(
      (e.isBoss ? 100 : 15) *
      Math.pow(1.1, state.stage) *
      state.buffs.resMult *
      state.buffs.rlExp *
      (compExist ? 1.15 : 1.0)
    );

    let newExp = state.exp + expGain;
    let newLevel = pRef.level;
    let newStatPts = pRef.statPoints;
    let newSkillPts = pRef.skillPoints;

    let maxExp = Math.floor(100 * Math.pow(1.2, newLevel - 1));
    let leveledUp = false;
    while (newExp >= maxExp) {
      newExp -= maxExp;
      newLevel++;
      newStatPts += 5;
      if (newLevel % 3 === 0) newSkillPts++;
      leveledUp = true;
      maxExp = Math.floor(100 * Math.pow(1.2, newLevel - 1));
    }
    
    if (leveledUp) {
      sfx.playLevelUp();
      if (newLevel % 5 === 0) {
        actions.addNotification(`⚡ LÊN CẤP ${newLevel}!`, "#f1c40f");
      }
    }

    // 1. Award Sect-specific Martial manual (Bí kíp) level benchmarks (20, 40, 60)
    let manuals = [...(state.manuals || [])];
    if (newLevel > pRef.level && [20, 40, 60].includes(newLevel)) {
      const sectId = pRef.sectId || 'sl';
      const list = SECT_LEVEL_MANUALS[sectId];
      const manualTemplateIndex = Math.floor(newLevel / 20) - 1; // 0 for lvl 20, 1 for lvl 40, etc
      if (list && list[manualTemplateIndex]) {
        const template = list[manualTemplateIndex];
        const newManual: MartialManual = {
          id: `manual_lvl_${sectId}_${newLevel}`,
          name: `📚 ${template.name}`,
          sectId,
          rarity: template.rarity,
          effectName: `Trợ lực bản môn: ${template.effect}`,
          statBoost: template.statBoost,
          icon: '📚',
          equipped: false,
          level: 1,
          maxLevel: 5,
          levelRequirement: newLevel
        };
        manuals.push(newManual);
        actions.addNotification(`✨ TAM CẤP SƯ MÔN: DUYÊN TRUYỀN [${template.name}]!`, "#ff00ff");
      }
    }

    // 2. Low-chance random generic Secret Martial arts drop
    const manualRollChance = e.isBoss ? 0.08 : (e.isSubBoss ? 0.03 : 0.005);
    if (Math.random() < manualRollChance) {
      const genericTemplates = [
        { name: '📚 Tây Vực Càn Khôn Đại Na Di Quyết', rarity: 'rare' as const, effectName: 'Cơ duyên: +6% Kháng phòng thủ toàn diện', statBoost: { resBonus: 0.06 } },
        { name: '📚 Giang Hồ Độc Cô Cửu Kiếm Tàn Di bản', rarity: 'epic' as const, effectName: 'Cơ duyên: +5% Tỉ lệ Chí Mạng sát phạt', statBoost: { atkChance: 0.05 } },
        { name: '📚 Cổ Bản Thần Hành Bách Biến Pháp Kỳ', rarity: 'rare' as const, effectName: 'Cơ duyên: Rút ngắn 6% CD xuất pháp trận', statBoost: { atkSpeed: 0.06 } },
        { name: '📚 Cửu Dương Thần Kinh Sơ Giải Quyết', rarity: 'legendary' as const, effectName: 'Cơ duyên: +50 HP sinh khí & +25 MP nội nguyên', statBoost: { hpBonus: 50, mpBonus: 25 } },
      ];
      const template = genericTemplates[Math.floor(Math.random() * genericTemplates.length)];
      const randomManualAward: MartialManual = {
        id: `manual_drop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: template.name,
        sectId: 'generic',
        rarity: template.rarity,
        effectName: template.effectName,
        statBoost: template.statBoost,
        icon: '📚',
        equipped: false,
        level: 1,
        maxLevel: 5,
        levelRequirement: 1
      };
      manuals.push(randomManualAward);
      actions.addNotification(`🎁 CƠ DUYÊN NGẪU NHIÊN: LĨNH HỘI [${template.name}]!`, "#00ffff");
    }

    // 3. Track in-battle active quest progress details
    let quests = state.quests ? state.quests.map(q => {
      if (q.status !== 'active') return q;
      let currentCount = q.currentCount;
      
      if (q.type === 'escort' && !e.isBoss && !e.isSubBoss) {
        currentCount = Math.min(q.targetCount, currentCount + 1);
      } else if (q.type === 'jailbreak' && (e.isSubBoss || e.isBoss)) {
        currentCount = Math.min(q.targetCount, currentCount + 1);
      } else if (q.type === 'songjin' && e.isBoss) {
        currentCount = Math.min(q.targetCount, currentCount + 1);
      }
      
      const status: "available" | "active" | "completed" | "claimed" = currentCount >= q.targetCount ? 'completed' : q.status;
      if (status === 'completed' && q.status === 'active') {
        actions.addNotification(`✨ NHIỆM VỤ [${q.title}] HOÀN THÀNH!`, "#ffff00");
      }
      
      return { ...q, currentCount, status };
    }) : [];

    let companion = state.companion;
    if (companion) {
      companion = { ...companion };
      companion.exp += expGain * 0.5;
      let maxCompExp = Math.floor(100 * Math.pow(1.2, companion.level - 1));
      
      while (companion.exp >= maxCompExp) {
        companion.exp -= maxCompExp;
        companion.level += 1;
        maxCompExp = Math.floor(100 * Math.pow(1.2, companion.level - 1));
        
        const armorLvl = companion.equipment.armor?.upgradeLvl || 0;
        const clawLvl = companion.equipment.weapon?.upgradeLvl || 0;
        companion.maxHp = 150 + companion.level * 25 + armorLvl * 250;
        companion.hp = companion.maxHp;
        companion.atk = 15 + companion.level * 4 + clawLvl * 20;
        if (companion.level % 50 === 0 || companion.level <= 5) {
          actions.addNotification(`✨ ĐỒNG HÀNH LÊN CẤP ${companion.level}!`, "#ffca28");
        }
      }
    }

    if (e.isBoss || Math.random() < 0.15) {
      actions.generateDrop(e.x, e.y, e.isBoss, state.stage);
    }

    // Assign directly on the state reference
    state.gold += goldGain;
    state.exp = newExp;
    state.companion = companion;
    state.mobsKilled += 1;
    state.quests = quests;
    state.manuals = manuals;
    pRef.level = newLevel;
    pRef.statPoints = newStatPts;
    pRef.skillPoints = newSkillPts;
  }
}

export function tickCombat(
  state: GameState,
  dt: number,
  entities: Entity[],
  particles: Particle[],
  texts: FloatingText[],
  actions: {
    addNotification: (txt: string, col: string) => void;
    generateDrop: (x: number, y: number, isBoss: boolean, stage: number) => void;
    shakeRef: { current: number };
    frameTotalDmgRef: { current: number };
  }
): void {
  const p = state.player;
  if (p.dead) return;

  // 1. Player basic attack
  if (p.target) {
    const t = entities.find((e) => e.id === p.target?.id);
    if (t) {
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d <= p.radius + t.size + 20) {
        p.atkCd -= dt;
        if (p.atkCd <= 0) {
          p.atkCd = Math.max(0.3, 1.2 - p.currentStats.agi * 0.05);
          sfx.playStrike();
          doDamage(t, p.atk, "#fff", p.x, p.y, state, entities, particles, texts, actions);
        }
      }
    }
  }

  // 2. Enemy basic attack onto player
  entities.forEach((e) => {
    e.atkCd -= dt;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= p.radius + e.size + 5 && e.atkCd <= 0) {
      e.atkCd = 1.5;
      const dmg = Math.max(1, e.atk - p.currentStats.con);
      p.hp -= dmg;
      texts.push({
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
        sfx.playGameOver();
      }
    }
  });

  // 3. Dead entity removal
  const filtered = entities.filter((e) => e.hp > 0);
  if (filtered.length !== entities.length) {
    entities.length = 0;
    entities.push(...filtered);
  }
}
