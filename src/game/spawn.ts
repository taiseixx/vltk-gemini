/**
 * Spawn formulas: stage-scaled HP/ATK/count for mobs, sub-bosses, and final bosses.
 *
 * Pure functions: each spawner returns the new Entity[] array; the caller
 * appends it to its own entities list and fires any side-effect
 * notifications. This module does NOT mutate stateRef, does NOT call
 * addNotification, and does NOT touch React refs.
 *
 * Boundary: game layer. Must NOT import from React, render/, or
 * touch Canvas APIs.
 */

import type { Entity } from "../types";

type Element = 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth';

const ELEMENTS: Element[] = ["Metal", "Wood", "Water", "Fire", "Earth"];

const WUXIA_BOSS_NAMES = [
  "Kiều Phong", "Dương Quá", "Lệnh Hồ Xung", "Trương Vô Kỵ",
  "Đông Phương Bất Bại", "Hoàng Dược Sư", "Âu Dương Phong",
  "Hồng Thất Công", "Đoàn Trí Hưng", "Quách Tĩnh", "Cô Long",
  "Độc Cô Cầu Bại", "Nhậm Ngã Hành", "Vô Nhai Tử", "Thiên Sơn Đồng Lão",
];

const NAME_EL_PREFIXES: Record<Element, string> = {
  Metal: '[KIM]', Wood: '[MỘC]', Water: '[THỦY]', Fire: '[HỎA]', Earth: '[THỔ]',
};

export function getBossCount(stage: number): number {
  if (stage < 10) return 1;
  const exp = Math.floor(stage / 10);
  return Math.pow(2, exp);
}

export function getMobsTotal(stage: number): number {
  const baseMobs = 10 + stage * 2;
  const bosses = getBossCount(stage);
  return baseMobs + bosses * 24;
}

export function spawnWave(stage: number, playerX: number, playerY: number): Entity[] {
  // Scale strength multiplier only on stages 10 and above
  const strengthMult = stage >= 10 ? (1 + getBossCount(stage) * 0.15) : 1.0;
  const stage20Boost = stage > 20 ? (1.3 + (stage - 20) * 0.05) : 1.0;

  const hpBase = 24 * Math.pow(1.15, stage - 1) * strengthMult * stage20Boost;
  const atkBase = 3.2 * Math.pow(1.095, stage - 1) * strengthMult * (stage > 20 ? 1.25 : 1.0);
  const newEntities: Entity[] = [];

  // Số đợt quái tăng đột khởi dồn dập sau stage 20
  const spawnCount = stage > 20 ? Math.min(22, 6 + Math.floor((stage - 20) * 1.5)) : 6;

  for (let i = 0; i < spawnCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 300;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    newEntities.push({
      id: Math.random(),
      isBoss: false,
      x: playerX + Math.cos(angle) * dist,
      y: playerY + Math.sin(angle) * dist,
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
  return newEntities;
}

export interface SubBossSpawnResult {
  bosses: Entity[];
  notificationText: string;
  notificationColor: string;
  actualCount: number;
}

export function spawnSubBosses(count: number, stage: number, playerX: number, playerY: number): SubBossSpawnResult {
  const actualSubBossCount = stage > 20 ? count + 1 : count;
  const scaleFactor = (1 + Math.floor((stage - 1) / 5) * 0.25) * (stage > 20 ? 1.5 : 1.0);
  const hpBase = 110 * Math.pow(1.18, stage - 1) * scaleFactor;
  const atkBase = 11 * Math.pow(1.14, stage - 1) * scaleFactor;
  const size = Math.min(45, Math.floor(20 * scaleFactor));

  const newBosses: Entity[] = [];

  for (let i = 0; i < actualSubBossCount; i++) {
    const angle = (Math.PI * 2 / actualSubBossCount) * i;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const prefix = NAME_EL_PREFIXES[el];
    newBosses.push({
      id: Math.random(),
      isBoss: false,
      isSubBoss: true,
      name: stage > 20 ? `${prefix} 🔴 Tam Ma Vương Hộ Pháp ${i + 1}` : `${prefix} Tịnh Vương Hộ Pháp ${i + 1}`,
      x: playerX + Math.cos(angle) * 320,
      y: playerY + Math.sin(angle) * 320,
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

  return {
    bosses: newBosses,
    notificationText: `⚔️ KHAI CHIẾN ${actualSubBossCount} HỘ PHÁP THỦ LĨNH!`,
    notificationColor: stage > 20 ? "#d35400" : "#16a085",
    actualCount: actualSubBossCount,
  };
}

export interface FinalBossSpawnResult {
  bosses: Entity[];
  notificationText: string;
  notificationColor: string;
}

export function spawnFinalBosses(count: number, stage: number, playerX: number, playerY: number): FinalBossSpawnResult {
  const isLateGame = stage > 20;
  const scaleFactor = (1 + Math.floor((stage - 1) / 5) * 0.35) * (isLateGame ? 1.6 : 1.0);
  const hpBase = 220 * Math.pow(1.21, stage - 1) * scaleFactor;
  const atkBase = 18 * Math.pow(1.16, stage - 1) * scaleFactor;
  const size = Math.min(75, Math.floor(26 * scaleFactor));

  const newBosses: Entity[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const prefix = NAME_EL_PREFIXES[el];
    const randomWuxiaName = WUXIA_BOSS_NAMES[Math.floor(Math.random() * WUXIA_BOSS_NAMES.length)];

    newBosses.push({
      id: Math.random(),
      isBoss: true,
      name: isLateGame ? `${prefix} 🔥 TÔNG TƯ THẦN - ${randomWuxiaName}` : `${prefix} ${randomWuxiaName}`,
      x: playerX + Math.cos(angle) * 350,
      y: playerY + Math.sin(angle) * 350,
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

  return {
    bosses: newBosses,
    notificationText: isLateGame
      ? "🔥 VÔ THỰNG CHI CHỦ DIÊM LA DIỆU THẾ XUẤT HIỆN!"
      : "👑 THẦN ĐIỆN CHIẾN BOSS CUỐI XUẤT HIỆN!",
    notificationColor: "#c0392b",
  };
}
