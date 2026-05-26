import { useState } from 'react';
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useConfigStore } from '../store/useConfigStore';

export default function AdvancedSettings() {
  const [open, setOpen] = useState(false);
  const cellVoltage       = useConfigStore(s => s.cellVoltage);
  const cellCapacityAh    = useConfigStore(s => s.cellCapacityAh);
  const setCellVoltage    = useConfigStore(s => s.setCellVoltage);
  const setCellCapacityAh = useConfigStore(s => s.setCellCapacityAh);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        id="advanced-settings-toggle"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50
                   hover:bg-slate-100 transition-colors duration-150 text-left"
        aria-expanded={open}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Advanced Cell Settings</span>
        <span className="ml-auto text-slate-400">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-white border-t border-slate-100">
          <div>
            <label htmlFor="cell-voltage-input"
              className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Cell Nominal Voltage (V)
            </label>
            <input id="cell-voltage-input" type="number" value={cellVoltage}
              min={0.1} step={0.1}
              onChange={e => setCellVoltage(parseFloat(e.target.value) || 3.7)}
              className="table-input" />
            <p className="text-[11px] text-slate-400 mt-1">Default: 3.7 V (standard Li-Ion)</p>
          </div>

          <div>
            <label htmlFor="cell-capacity-input"
              className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Cell Capacity (Ah)
            </label>
            <input id="cell-capacity-input" type="number" value={cellCapacityAh}
              min={0.1} step={0.1}
              onChange={e => setCellCapacityAh(parseFloat(e.target.value) || 3.0)}
              className="table-input" />
            <p className="text-[11px] text-slate-400 mt-1">Default: 3.0 Ah (typical 18650 cell)</p>
          </div>

          <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Fixed values:</strong> Depth of Discharge = 80% and degradation margin = 20%.
            These are not adjustable — they represent standard conservative practice for Li-Ion pack design.
          </div>
        </div>
      </div>
    </div>
  );
}
