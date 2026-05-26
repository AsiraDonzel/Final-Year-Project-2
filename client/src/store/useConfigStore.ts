import { create } from 'zustand';
import type { LoadItem, CalculationResult } from '@shared/types';
import { findPredefinedDevice } from '../utils/devices';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a browser-safe UUID without the 'crypto' module alias issue */
function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyLoad(): LoadItem {
  return { id: newId(), name: '', wattage: 0, hours: 0, quantity: 1, deviceType: '' };
}

// ── Store shape ───────────────────────────────────────────────────────────────

export interface ValidationErrors {
  [loadId: string]: Partial<Record<keyof LoadItem, string>>;
}

interface ConfigStore {
  // ── State ──
  loads: LoadItem[];
  selectedIds: Set<string>;
  systemVoltage: 12 | 24 | 48;
  cellVoltage: number;
  cellCapacityAh: number;
  calculationResult: CalculationResult | null;
  isCalculating: boolean;
  calcError: string | null;
  validationErrors: ValidationErrors;

  // ── Load CRUD ──
  addLoad: () => void;
  updateLoad: (id: string, field: keyof LoadItem, rawValue: string | number) => void;
  removeSelectedLoads: () => void;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;

  // ── Config ──
  setSystemVoltage: (v: 12 | 24 | 48) => void;
  setCellVoltage: (v: number) => void;
  setCellCapacityAh: (v: number) => void;

  // ── Calculation ──
  calculate: () => Promise<void>;
  reset: () => void;
}

// ── Derived: total energy ──────────────────────────────────────────────────────

export function computeTotalEnergyWh(loads: LoadItem[]): number {
  return loads.reduce((sum, l) => {
    const wh = (l.wattage || 0) * (l.hours || 0) * (l.quantity || 0);
    return sum + (isFinite(wh) ? wh : 0);
  }, 0);
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateLoads(loads: LoadItem[]): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const load of loads) {
    const e: Partial<Record<keyof LoadItem, string>> = {};
    if (!load.deviceType) {
      e.deviceType = 'Select a device';
    }
    if (load.deviceType === 'custom' && !load.name.trim()) {
      e.name = 'Required';
    }
    if (load.deviceType) {
      if (load.wattage <= 0 || !isFinite(load.wattage)) {
        e.wattage = 'Must be > 0';
      }
    }
    if (load.hours <= 0 || load.hours > 24 || !isFinite(load.hours))
      e.hours = '0 < hours ≤ 24';
    if (!Number.isInteger(load.quantity) || load.quantity < 1)
      e.quantity = 'Integer ≥ 1';
    if (Object.keys(e).length) errors[load.id] = e;
  }
  return errors;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useConfigStore = create<ConfigStore>((set, get) => ({
  loads: [createEmptyLoad()],
  selectedIds: new Set(),
  systemVoltage: 12,
  cellVoltage: 3.7,
  cellCapacityAh: 3.0,
  calculationResult: null,
  isCalculating: false,
  calcError: null,
  validationErrors: {},

  // ── Load CRUD ────────────────────────────────────────────────────────────

  addLoad: () =>
    set(s => ({ loads: [...s.loads, createEmptyLoad()], calculationResult: null })),

  updateLoad: (id, field, rawValue) => {
    set(s => {
      const loads = s.loads.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l };
        if (field === 'deviceType') {
          const typeVal = String(rawValue);
          updated.deviceType = typeVal;
          if (typeVal === 'custom') {
            updated.name = '';
            updated.wattage = 0;
          } else if (typeVal === '') {
            updated.name = '';
            updated.wattage = 0;
          } else {
            const dev = findPredefinedDevice(typeVal);
            if (dev) {
              updated.name = dev.name;
              updated.wattage = dev.wattage;
            }
          }
        } else {
          const value =
            field === 'name'
              ? String(rawValue)
              : field === 'quantity'
              ? parseInt(String(rawValue), 10) || 0
              : parseFloat(String(rawValue)) || 0;
          (updated as any)[field] = value;
        }
        return updated;
      });
      const validationErrors = validateLoads(loads);
      return { loads, validationErrors, calculationResult: null };
    });
  },

  removeSelectedLoads: () =>
    set(s => {
      const loads = s.loads.filter(l => !s.selectedIds.has(l.id));
      // Always keep at least one row
      const next = loads.length ? loads : [createEmptyLoad()];
      const validationErrors = validateLoads(next);
      return { loads: next, selectedIds: new Set(), validationErrors, calculationResult: null };
    }),

  toggleSelection: (id) =>
    set(s => {
      const ids = new Set(s.selectedIds);
      ids.has(id) ? ids.delete(id) : ids.add(id);
      return { selectedIds: ids };
    }),

  toggleSelectAll: () =>
    set(s => {
      if (s.selectedIds.size === s.loads.length)
        return { selectedIds: new Set() };
      return { selectedIds: new Set(s.loads.map(l => l.id)) };
    }),

  // ── Config ───────────────────────────────────────────────────────────────

  setSystemVoltage: (v) => set({ systemVoltage: v, calculationResult: null }),
  setCellVoltage:   (v) => set({ cellVoltage: v,   calculationResult: null }),
  setCellCapacityAh:(v) => set({ cellCapacityAh: v, calculationResult: null }),

  // ── Calculation ──────────────────────────────────────────────────────────

  calculate: async () => {
    const { loads, systemVoltage, cellVoltage, cellCapacityAh } = get();
    const errors = validateLoads(loads);
    if (Object.keys(errors).length) {
      set({ validationErrors: errors, calcError: 'Fix validation errors before calculating.' });
      return;
    }

    const totalWh = computeTotalEnergyWh(loads);
    if (totalWh === 0) {
      set({ calcError: 'Add at least one load with positive wattage and hours.' });
      return;
    }

    set({ isCalculating: true, calcError: null });
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loads, systemVoltage, cellVoltage, cellCapacityAh }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Server error ${res.status}`);
      }
      const data: CalculationResult = await res.json();
      set({ calculationResult: data, isCalculating: false });
    } catch (e) {
      set({ calcError: (e as Error).message, isCalculating: false });
    }
  },

  reset: () =>
    set({
      loads: [createEmptyLoad()],
      selectedIds: new Set(),
      systemVoltage: 12,
      cellVoltage: 3.7,
      cellCapacityAh: 3.0,
      calculationResult: null,
      isCalculating: false,
      calcError: null,
      validationErrors: {},
    }),
}));
