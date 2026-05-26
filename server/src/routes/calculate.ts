import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calculateBatteryConfig } from '../utils/calculator';

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────

const LoadItemSchema = z.object({
  id:       z.string(),
  name:     z.string().default(''),
  wattage:  z.number().positive('Wattage must be > 0'),
  hours:    z.number().positive('Hours must be > 0').max(24, 'Hours ≤ 24'),
  quantity: z.number().int().min(1, 'Quantity ≥ 1'),
});

const CalculationRequestSchema = z.object({
  loads:         z.array(LoadItemSchema).min(1, 'At least one load required'),
  systemVoltage: z.number().refine(
    v => [12, 24, 48].includes(v),
    'systemVoltage must be 12, 24, or 48',
  ),
  cellVoltage:    z.number().positive().optional().default(3.7),
  cellCapacityAh: z.number().positive().optional().default(3.0),
});

// ── POST /api/calculate ────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  const parsed = CalculationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { loads, systemVoltage, cellVoltage, cellCapacityAh } = parsed.data;

  // Sum energy over all valid loads (Wh)
  const totalEnergyWh = loads.reduce(
    (sum, l) => sum + l.wattage * l.hours * l.quantity,
    0,
  );

  if (totalEnergyWh === 0) {
    return res.status(422).json({ error: 'Total energy demand is 0 Wh. Add loads with wattage > 0.' });
  }

  const result = calculateBatteryConfig({
    totalEnergyWh,
    systemVoltage,
    cellVoltage,
    cellCapacityAh,
  });

  return res.json(result);
});

export { router as calculateRoute };
