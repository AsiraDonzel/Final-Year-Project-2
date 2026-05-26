// ─────────────────────────────────────────────────────────────
// server/src/utils/calculator.ts
//
// Pure function that performs all battery sizing math.
// Lives here so it can be unit-tested independently of Express.
// ─────────────────────────────────────────────────────────────

export interface CalcInput {
  totalEnergyWh: number;
  systemVoltage: number;
  cellVoltage?: number;    // default 3.7 V
  cellCapacityAh?: number; // default 3.0 Ah
}

export interface CalcOutput {
  totalEnergyWh: number;
  totalEnergyKwh: number;
  /** Base Ah demand at system voltage (before safety factors) */
  requiredAh: number;
  /** After 80 % DoD correction: requiredAh / 0.8 */
  effectiveAh: number;
  /** After 20 % degradation margin: effectiveAh × 1.2 */
  finalAh: number;
  /** Cells wired in series per string: ceil(sysV / cellV) */
  seriesCells: number;
  /** Parallel strings required: ceil(finalAh / cellCapAh) */
  parallelStrings: number;
  /** S × P */
  totalCells: number;
  /** Compact notation, e.g. "4S5P" */
  packConfig: string;
}

/**
 * Calculates the Series / Parallel battery pack configuration.
 *
 * Step 1 — Energy demand to Ah at system level:
 *   requiredAh   = totalEnergyWh / systemVoltage
 *
 * Step 2 — Apply Depth-of-Discharge (DoD) correction:
 *   We only draw from 80 % of the pack's rated capacity, so
 *   to deliver requiredAh we actually need:
 *   effectiveAh  = requiredAh / 0.8
 *
 * Step 3 — Add degradation margin:
 *   Li-Ion cells lose capacity over their lifetime.
 *   We add 20 % headroom so the pack still meets demand when aged:
 *   finalAh      = effectiveAh × 1.2
 *
 * Step 4 — Series cells (S):
 *   Each cell is ~3.7 V nominal.
 *   We always round UP so the pack exceeds (not falls short of) sysV:
 *   S = ceil(systemVoltage / cellVoltage)
 *
 * Step 5 — Parallel strings (P):
 *   Each string supplies cellCapacityAh.
 *   Round UP to meet or exceed finalAh:
 *   P = ceil(finalAh / cellCapacityAh)
 *
 * Total cells = S × P
 */
export function calculateBatteryConfig(input: CalcInput): CalcOutput {
  const {
    totalEnergyWh,
    systemVoltage,
    cellVoltage    = 3.7,
    cellCapacityAh = 3.0,
  } = input;

  // ── Step 1: raw Ah demand ──────────────────────────────────
  const requiredAh = totalEnergyWh / systemVoltage;

  // ── Step 2: DoD correction (÷ 0.8) ──────────────────────────
  const effectiveAh = requiredAh / 0.8;

  // ── Step 3: degradation design margin (× 1.2) ────────────────
  const finalAh = effectiveAh * 1.2;

  // ── Step 4: series count (always round up) ──────────────────
  const seriesCells = Math.ceil(systemVoltage / cellVoltage);

  // ── Step 5: parallel count (always round up) ─────────────────
  const parallelStrings = Math.ceil(finalAh / cellCapacityAh);

  // ── Totals ──────────────────────────────────────────────────
  const totalCells = seriesCells * parallelStrings;
  const packConfig = `${seriesCells}S${parallelStrings}P`;

  return {
    totalEnergyWh,
    totalEnergyKwh: totalEnergyWh / 1000,
    requiredAh,
    effectiveAh,
    finalAh,
    seriesCells,
    parallelStrings,
    totalCells,
    packConfig,
  };
}
