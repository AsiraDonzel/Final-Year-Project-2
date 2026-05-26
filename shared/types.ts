// ─────────────────────────────────────────────────────────────
// shared/types.ts
// Central TypeScript interfaces shared by client and server.
// ─────────────────────────────────────────────────────────────

/** A single electrical load entered by the user. */
export interface LoadItem {
  id: string;
  /** Optional label for the device */
  name: string;
  /** Power consumption in Watts (> 0) */
  wattage: number;
  /** Daily usage in hours (0 < hours ≤ 24) */
  hours: number;
  /** Number of identical devices (integer ≥ 1) */
  quantity: number;
}

/** Body of POST /api/calculate */
export interface CalculationRequest {
  loads: LoadItem[];
  /** System bus voltage: 12 | 24 | 48 */
  systemVoltage: 12 | 24 | 48;
  /** Single-cell nominal voltage (default 3.7 V) */
  cellVoltage?: number;
  /** Single-cell rated capacity in Ah (default 3.0 Ah) */
  cellCapacityAh?: number;
}

/** Response of POST /api/calculate */
export interface CalculationResult {
  totalEnergyWh: number;
  totalEnergyKwh: number;
  /** Raw Ah needed at system voltage before safety factors */
  requiredAh: number;
  /** After 80 % DoD correction */
  effectiveAh: number;
  /** After 20 % degradation design margin */
  finalAh: number;
  /** Cells in series per string */
  seriesCells: number;
  /** Number of parallel strings */
  parallelStrings: number;
  /** S × P */
  totalCells: number;
  /** E.g. "4S5P" */
  packConfig: string;
}

/** Body of POST /api/generate-report */
export interface ReportRequest {
  loads: LoadItem[];
  systemVoltage: 12 | 24 | 48;
  calculationResult: CalculationResult;
  cellVoltage: number;
  cellCapacityAh: number;
}
