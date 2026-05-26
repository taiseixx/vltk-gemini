import { GameState, Entity } from "../../types";
import { spawnWave, spawnSubBosses, spawnFinalBosses, getBossCount } from "../spawn";

export function tickStageState(
  state: GameState,
  entities: Entity[],
  actions: {
    addNotification: (txt: string, col: string) => void;
  }
): {
  stagePhase: GameState["stagePhase"];
  bossSpawned: GameState["bossSpawned"];
  nextState?: GameState["state"];
  newEntities?: Entity[];
} {
  const p = state.player;
  const mobsNeeded = state.mobsTotal;
  const mobsKilled = state.mobsKilled;
  const entitiesCount = entities.length;
  let nextPhase = state.stagePhase || 'CREEPS';
  let bossSpawned = state.bossSpawned;
  let nextState: GameState["state"] | undefined;
  let newEntities: Entity[] | undefined;

  if (nextPhase === 'CREEPS') {
    if (entitiesCount < 4 && mobsKilled + entitiesCount < mobsNeeded) {
      newEntities = spawnWave(p.x, p.y, state.stage);
    }
    if (mobsKilled >= mobsNeeded) {
      nextPhase = 'SUB_BOSSES';
      const totalBosses = getBossCount(state.stage);
      const subBossCount = totalBosses >= 4 ? Math.floor(totalBosses / 2) : 1;
      const spawned = spawnSubBosses(p.x, p.y, subBossCount, state.stage);
      newEntities = spawned;
      const actualSubBossCount = state.stage > 20 ? subBossCount + 1 : subBossCount;
      actions.addNotification(`⚔️ KHAI CHIẾN ${actualSubBossCount} HỘ PHÁP THỦ LĨNH!`, state.stage > 20 ? "#d35400" : "#16a085");
    }
  } else if (nextPhase === 'SUB_BOSSES') {
    if (entitiesCount === 0) {
      nextPhase = 'FINAL_BOSS';
      bossSpawned = true;
      const totalBosses = getBossCount(state.stage);
      const finalBossCount = totalBosses >= 4 ? Math.ceil(totalBosses / 2) : totalBosses;
      newEntities = spawnFinalBosses(p.x, p.y, finalBossCount, state.stage);
      actions.addNotification(state.stage > 20 ? "🔥 VÔ THỰNG CHI CHỦ DIÊM LA DIỆU THẾ XUẤT HIỆN!" : "👑 THẦN ĐIỆN CHIẾN BOSS CUỐI XUẤT HIỆN!", "#c0392b");
    }
  } else if (nextPhase === 'FINAL_BOSS') {
    if (entitiesCount === 0 && bossSpawned) {
      nextState = "CLEARED";
    }
  }

  return {
    stagePhase: nextPhase,
    bossSpawned,
    nextState,
    newEntities,
  };
}
