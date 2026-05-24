/**
 * Economy utility formulas for gold pricing scaling and dynamic inflation.
 * Increases the gold requirements dynamically as the player progresses in stages.
 */

/**
 * Calculates a dynamic multiplier for item prices and actions based on the current stage.
 * 
 * Rules:
 * - First 15 stages: Increases every 5 stages (Stage 1-5: x1.0, Stage 6-10: x1.5, Stage 11-15: x2.2)
 * - Stage 16 onwards: Increases with every single stage, compounding aggressively.
 * - Scaled carefully to balance the large amounts of gold earned in late-game without locking the player out entirely.
 */
export function getItemCostMultiplier(stage: number): number {
  if (stage <= 5) {
    return 1.0;
  } else if (stage <= 10) {
    return 1.5;
  } else if (stage <= 15) {
    return 2.2;
  } else {
    const extraStages = stage - 15;
    // Compounding growth of 15% per stage after stage 15
    return parseFloat((2.2 * Math.pow(1.15, extraStages)).toFixed(2));
  }
}

/**
 * Formats gold values elegantly with localized strings and thousands separators,
 * or optional short abbreviations for extreme values.
 */
export function formatGoldValue(gold: number): string {
  if (gold >= 1_000_000) {
    return `${(gold / 1_000_000).toFixed(2)}M`;
  }
  return gold.toLocaleString();
}
