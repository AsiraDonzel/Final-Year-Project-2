/**
 * Vercel Serverless Function — POST /api/calculate
 *
 * Self-contained: all logic is inlined so no Express or path-alias
 * resolution is required in the Vercel build environment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// ── Validation schemas ────────────────────────────────────────────────────────

const LoadSchema = z.object({
  id:       z.string(),
  name:     z.string(),
  wattage:  z.number().positive('Wattage must be > 0'),
  hours:    z.number().positive().max(24, 'Hours must be ≤ 24'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

const RequestSchema = z.object({
  loads:         z.array(LoadSchema).min(1, 'At least one load is required'),
  systemVoltage: z.union([z.literal(12), z.literal(24), z.literal(48)]),
  cellVoltage:   z.number().positive().optional().default(3.7),
  cellCapacityAh:z.number().positive().optional().default(3.0),
});

// ── Battery sizing math ───────────────────────────────────────────────────────

function calculateBatteryConfig(
  loads: z.infer<typeof LoadSchema>[],
  systemVoltage: 12 | 24 | 48,
  cellVoltage: number,
  cellCapacityAh: number
) {
  const totalEnergyWh = loads.reduce(
    (sum, l) => sum + l.wattage * l.hours * l.quantity,
    0
  );

  const requiredAh     = totalEnergyWh / systemVoltage;   // Step 1
  const effectiveAh    = requiredAh / 0.8;                // Step 2 — 80 % DoD
  const finalAh        = effectiveAh * 1.2;               // Step 3 — 20 % margin
  let seriesCells = Math.ceil(systemVoltage / cellVoltage);
  if (cellVoltage === 3.7) {
    if (systemVoltage === 12) seriesCells = 3;
    else if (systemVoltage === 24) seriesCells = 7;
    else if (systemVoltage === 48) seriesCells = 14;
  }
  const parallelStrings = Math.ceil(finalAh / cellCapacityAh);
  const totalCells     = seriesCells * parallelStrings;

  return {
    totalEnergyWh,
    totalEnergyKwh: totalEnergyWh / 1000,
    requiredAh,
    effectiveAh,
    finalAh,
    seriesCells,
    parallelStrings,
    totalCells,
    packConfig: `${seriesCells}S${parallelStrings}P`,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { loads, systemVoltage, cellVoltage, cellCapacityAh } = parsed.data;

  try {
    const result = calculateBatteryConfig(loads, systemVoltage, cellVoltage, cellCapacityAh);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[calculate]', err);
    return res.status(500).json({ error: 'Calculation failed. Please try again.' });
  }
}
