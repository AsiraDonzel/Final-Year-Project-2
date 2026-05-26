import { PlusCircle, Trash2, Table2 } from 'lucide-react';
import { useConfigStore } from '../store/useConfigStore';
import type { LoadItem } from '@shared/types';
import { COMMON_DEVICES } from '../utils/devices';

interface CellInputProps {
  id: string;
  type: 'text' | 'number';
  value: string | number;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}

function CellInput({ id, type, value, placeholder, min, max, step, error, onChange, disabled }: CellInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value === 0 && type === 'number' ? '' : value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={`table-input${error ? ' error' : ''} ${
          disabled ? 'bg-slate-50 text-slate-400 border-slate-200/60 cursor-not-allowed select-none' : ''
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && (
        <p id={`${id}-err`} className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoadTable() {
  const loads            = useConfigStore(s => s.loads);
  const selectedIds      = useConfigStore(s => s.selectedIds);
  const validationErrors = useConfigStore(s => s.validationErrors);
  const addLoad          = useConfigStore(s => s.addLoad);
  const updateLoad       = useConfigStore(s => s.updateLoad);
  const removeSelected   = useConfigStore(s => s.removeSelectedLoads);
  const toggleSel        = useConfigStore(s => s.toggleSelection);
  const toggleAll        = useConfigStore(s => s.toggleSelectAll);

  const allSelected = loads.length > 0 && selectedIds.size === loads.length;
  const anySelected = selectedIds.size > 0;

  const energyWh = (l: LoadItem) => {
    const v = l.wattage * l.hours * l.quantity;
    return isFinite(v) ? v : 0;
  };

  return (
    <div className="card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
      <div className="card-header">
        <div className="section-icon bg-blue-50">
          <Table2 className="w-4 h-4 text-blue-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-800">Electrical Loads</h2>
          <p className="text-xs text-slate-500 mt-0.5">List every device and its daily usage.</p>
        </div>
        <div className="flex items-center gap-2">
          <button id="remove-selected-btn" onClick={removeSelected} disabled={!anySelected} className="btn-danger">
            <Trash2 className="w-3.5 h-3.5" />
            {anySelected ? `Remove (${selectedIds.size})` : 'Remove'}
          </button>
          <button id="add-load-btn" onClick={addLoad} className="btn-primary">
            <PlusCircle className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-4 py-3 text-left">
                <input type="checkbox" id="select-all-checkbox" checked={allSelected}
                  onChange={toggleAll} aria-label="Select all rows" />
              </th>
              {['Device Name', 'Wattage (W)', 'Hours / Day', 'Quantity', 'Energy (Wh)'].map((col, i) => (
                <th key={col}
                    className={`px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide
                                ${i === 4 ? 'text-right' : 'text-left'}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loads.map((load, idx) => {
              const err   = validationErrors[load.id] ?? {};
              const isSel = selectedIds.has(load.id);
              const wh    = energyWh(load);
              return (
                <tr key={load.id}
                    className={`border-b border-slate-100 transition-colors duration-100
                      ${isSel ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      hover:bg-blue-50/60`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" id={`row-check-${load.id}`}
                      checked={isSel} onChange={() => toggleSel(load.id)}
                      aria-label={`Select row ${idx + 1}`} />
                  </td>
                  <td className="px-3 py-3 w-64 min-w-[220px]">
                    <div className="flex flex-col gap-1.5 relative">
                      <select
                        id={`device-type-${load.id}`}
                        value={load.deviceType ?? ''}
                        onChange={e => updateLoad(load.id, 'deviceType', e.target.value)}
                        className={`table-input ${err.deviceType ? 'error' : ''}`}
                        aria-label={`Select device for row ${idx + 1}`}
                      >
                        <option value="">Select a device...</option>
                        {COMMON_DEVICES.map(cat => (
                          <optgroup key={cat.category} label={cat.category}>
                            {cat.devices.map(dev => (
                              <option key={dev.id} value={dev.id}>
                                {dev.name} ({dev.wattage}W)
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="custom">Other (Custom Device)...</option>
                      </select>
                      {err.deviceType && (
                        <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in">
                          {err.deviceType}
                        </p>
                      )}
                      
                      {load.deviceType === 'custom' && (
                        <div className="mt-2 relative">
                          <input
                            id={`name-${load.id}`}
                            type="text"
                            value={load.name}
                            placeholder="e.g. Ring Light"
                            onChange={e => updateLoad(load.id, 'name', e.target.value)}
                            className={`table-input ${err.name ? 'error' : ''}`}
                            aria-label={`Custom device name for row ${idx + 1}`}
                          />
                          {err.name && (
                            <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in">
                              {err.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-28">
                    <CellInput
                      id={`wattage-${load.id}`}
                      type="number"
                      value={load.wattage}
                      placeholder="e.g. 60"
                      min={0.01}
                      step={0.1}
                      error={err.wattage}
                      disabled={load.deviceType !== 'custom'}
                      onChange={v => updateLoad(load.id, 'wattage', v)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <CellInput id={`hours-${load.id}`} type="number" value={load.hours}
                      placeholder="e.g. 8" min={0.01} max={24} step={0.25} error={err.hours}
                      onChange={v => updateLoad(load.id, 'hours', v)} />
                  </td>
                  <td className="px-3 py-3">
                    <CellInput id={`qty-${load.id}`} type="number" value={load.quantity}
                      placeholder="1" min={1} step={1} error={err.quantity}
                      onChange={v => updateLoad(load.id, 'quantity', v)} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-mono font-semibold ${wh > 0 ? 'text-teal-700' : 'text-slate-300'}`}>
                      {wh.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">Wh</span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-slate-900">
              <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-right text-slate-400 uppercase tracking-wide">
                Total Daily Energy
              </td>
              <td className="px-3 py-3 text-right">
                <span className="font-mono font-bold text-sm text-teal-300">
                  {loads.reduce((s, l) => s + energyWh(l), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 1 })} Wh
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
