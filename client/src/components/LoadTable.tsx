import { useState } from 'react';
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

  const [rowCategoryFilter, setRowCategoryFilter] = useState<Record<string, string>>({});

  const allSelected = loads.length > 0 && selectedIds.size === loads.length;
  const anySelected = selectedIds.size > 0;

  const energyWh = (l: LoadItem) => {
    const v = l.wattage * l.hours * l.quantity;
    return isFinite(v) ? v : 0;
  };

  const getRowCategoryFilter = (load: LoadItem) => {
    if (rowCategoryFilter[load.id] !== undefined) {
      return rowCategoryFilter[load.id];
    }
    if (load.deviceType === 'custom') return 'Custom';
    if (load.deviceType) {
      const devId = load.deviceType;
      for (const cat of COMMON_DEVICES) {
        if (cat.devices.some(d => d.id === devId)) {
          if (cat.category.includes('Household')) return 'Household';
          if (cat.category.includes('Office')) return 'Office';
          if (cat.category.includes('Hospital')) return 'Hospital';
        }
      }
    }
    return 'All';
  };

  const handleTabClick = (loadId: string, filter: string) => {
    setRowCategoryFilter(prev => ({ ...prev, [loadId]: filter }));
    if (filter === 'Custom') {
      updateLoad(loadId, 'deviceType', 'custom');
    } else {
      const load = loads.find(l => l.id === loadId);
      if (load && load.deviceType) {
        if (load.deviceType === 'custom') {
          updateLoad(loadId, 'deviceType', '');
        } else {
          const devId = load.deviceType;
          const currentCategory = COMMON_DEVICES.find(cat => cat.devices.some(d => d.id === devId));
          if (currentCategory) {
            const catName = currentCategory.category;
            const matches =
              (filter === 'Household' && catName.includes('Household')) ||
              (filter === 'Office' && catName.includes('Office')) ||
              (filter === 'Hospital' && catName.includes('Hospital')) ||
              (filter === 'All');
            if (!matches) {
              updateLoad(loadId, 'deviceType', '');
            }
          }
        }
      }
    }
  };

  return (
    <div className="card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
      <div className="card-header flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="section-icon bg-blue-50">
            <Table2 className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Electrical Loads</h2>
            <p className="text-xs text-slate-500 mt-0.5">List every device and its daily usage.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button id="remove-selected-btn" onClick={removeSelected} disabled={!anySelected} className="btn-danger flex-1 sm:flex-none justify-center py-2 text-xs">
            <Trash2 className="w-3.5 h-3.5" />
            {anySelected ? `Remove (${selectedIds.size})` : 'Remove'}
          </button>
          <button id="add-load-btn" onClick={addLoad} className="btn-primary flex-1 sm:flex-none justify-center py-2 text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-2 py-2.5 sm:px-4 sm:py-3 text-left">
                <input type="checkbox" id="select-all-checkbox" checked={allSelected}
                  onChange={toggleAll} aria-label="Select all rows" />
              </th>
              {['Device Name', 'Wattage (W)', 'Hours / Day', 'Quantity', 'Energy (Wh)'].map((col, i) => (
                <th key={col}
                    className={`px-2 py-2.5 sm:px-3 sm:py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide
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
              const filter = getRowCategoryFilter(load);
              return (
                <tr key={load.id}
                    className={`border-b border-slate-100 transition-colors duration-100
                      ${isSel ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      hover:bg-blue-50/60`}>
                  <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                    <input type="checkbox" id={`row-check-${load.id}`}
                      checked={isSel} onChange={() => toggleSel(load.id)}
                      aria-label={`Select row ${idx + 1}`} />
                  </td>
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3 w-64 min-w-[220px]">
                    <div className="flex flex-col gap-1.5 relative">
                      {/* Tabs */}
                      <div className="flex gap-1 mb-1.5 flex-wrap">
                        {['All', 'Household', 'Office', 'Hospital', 'Custom'].map(f => {
                          const active = getRowCategoryFilter(load) === f;
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => handleTabClick(load.id, f)}
                              className={`px-2 py-0.5 text-[9px] rounded font-medium border transition-colors ${
                                active
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                              }`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>

                      {filter !== 'Custom' ? (
                        <div className="relative">
                          <select
                            id={`device-type-${load.id}`}
                            value={load.deviceType ?? ''}
                            onChange={e => updateLoad(load.id, 'deviceType', e.target.value)}
                            className={`table-input ${err.deviceType ? 'error' : ''}`}
                            aria-label={`Select device for row ${idx + 1}`}
                          >
                            <option value="">Select a device...</option>
                            {COMMON_DEVICES.filter(cat => {
                              if (filter === 'All') return true;
                              if (filter === 'Household') return cat.category.includes('Household');
                              if (filter === 'Office') return cat.category.includes('Office');
                              if (filter === 'Hospital') return cat.category.includes('Hospital');
                              return false;
                            }).map(cat => (
                              <optgroup key={cat.category} label={cat.category}>
                                {cat.devices.map(dev => (
                                  <option key={dev.id} value={dev.id}>
                                    {dev.name} ({dev.wattage}W)
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {err.deviceType && (
                            <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in z-10">
                              {err.deviceType}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
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
                            <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in z-10">
                              {err.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3 w-28">
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
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                    <CellInput id={`hours-${load.id}`} type="number" value={load.hours}
                      placeholder="e.g. 8" min={0.01} max={24} step={0.25} error={err.hours}
                      onChange={v => updateLoad(load.id, 'hours', v)} />
                  </td>
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                    <CellInput id={`qty-${load.id}`} type="number" value={load.quantity}
                      placeholder="1" min={1} step={1} error={err.quantity}
                      onChange={v => updateLoad(load.id, 'quantity', v)} />
                  </td>
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-right">
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
              <td colSpan={5} className="px-2 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold text-right text-slate-400 uppercase tracking-wide">
                Total Daily Energy
              </td>
              <td className="px-2 py-2.5 sm:px-3 sm:py-3 text-right">
                <span className="font-mono font-bold text-sm text-teal-300">
                  {loads.reduce((s, l) => s + energyWh(l), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 1 })} Wh
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden bg-slate-50/50">
        <div className="p-4 space-y-4">
          {loads.map((load, idx) => {
            const err = validationErrors[load.id] ?? {};
            const isSel = selectedIds.has(load.id);
            const wh = energyWh(load);
            const filter = getRowCategoryFilter(load);

            return (
              <div
                key={load.id}
                className={`p-4 rounded-xl border transition-all duration-150 relative ${
                  isSel ? 'bg-blue-50/80 border-blue-200 shadow-sm' : 'bg-white border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`row-check-mobile-${load.id}`}
                      checked={isSel}
                      onChange={() => toggleSel(load.id)}
                      aria-label={`Select row ${idx + 1}`}
                    />
                    <span className="text-xs font-semibold text-slate-500">
                      Device #{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3.5">
                  {/* Category Tabs */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Category</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {['All', 'Household', 'Office', 'Hospital', 'Custom'].map(f => {
                        const active = getRowCategoryFilter(load) === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => handleTabClick(load.id, f)}
                            className={`px-2 py-0.5 text-[10px] rounded font-medium border transition-colors ${
                              active
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                            }`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Device Name */}
                  <div className="space-y-1 relative">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Device Name</span>
                    {filter !== 'Custom' ? (
                      <>
                        <select
                          id={`device-type-mobile-${load.id}`}
                          value={load.deviceType ?? ''}
                          onChange={e => updateLoad(load.id, 'deviceType', e.target.value)}
                          className={`table-input ${err.deviceType ? 'error' : ''}`}
                          aria-label={`Select device for row ${idx + 1}`}
                        >
                          <option value="">Select a device...</option>
                          {COMMON_DEVICES.filter(cat => {
                            if (filter === 'All') return true;
                            if (filter === 'Household') return cat.category.includes('Household');
                            if (filter === 'Office') return cat.category.includes('Office');
                            if (filter === 'Hospital') return cat.category.includes('Hospital');
                            return false;
                          }).map(cat => (
                            <optgroup key={cat.category} label={cat.category}>
                              {cat.devices.map(dev => (
                                <option key={dev.id} value={dev.id}>
                                  {dev.name} ({dev.wattage}W)
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {err.deviceType && (
                          <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in z-10">
                            {err.deviceType}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="relative">
                        <input
                          id={`name-mobile-${load.id}`}
                          type="text"
                          value={load.name}
                          placeholder="e.g. Ring Light"
                          onChange={e => updateLoad(load.id, 'name', e.target.value)}
                          className={`table-input ${err.name ? 'error' : ''}`}
                          aria-label={`Custom device name for row ${idx + 1}`}
                        />
                        {err.name && (
                          <p className="absolute left-0 -bottom-4 text-[10px] text-red-500 whitespace-nowrap animate-fade-in z-10">
                            {err.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Wattage (W)</span>
                      <CellInput
                        id={`wattage-mobile-${load.id}`}
                        type="number"
                        value={load.wattage}
                        placeholder="e.g. 60"
                        min={0.01}
                        step={0.1}
                        error={err.wattage}
                        disabled={load.deviceType !== 'custom'}
                        onChange={v => updateLoad(load.id, 'wattage', v)}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Hours / Day</span>
                      <CellInput
                        id={`hours-mobile-${load.id}`}
                        type="number"
                        value={load.hours}
                        placeholder="e.g. 8"
                        min={0.01}
                        max={24}
                        step={0.25}
                        error={err.hours}
                        onChange={v => updateLoad(load.id, 'hours', v)}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Quantity</span>
                      <CellInput
                        id={`qty-mobile-${load.id}`}
                        type="number"
                        value={load.quantity}
                        placeholder="1"
                        min={1}
                        step={1}
                        error={err.quantity}
                        onChange={v => updateLoad(load.id, 'quantity', v)}
                      />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end text-right">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Energy (Wh)</span>
                      <div className="h-8 flex items-center justify-end">
                        <span className={`font-mono font-semibold ${wh > 0 ? 'text-teal-700' : 'text-slate-300'}`}>
                          {wh.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">Wh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Total Footer */}
        <div className="bg-slate-900 px-4 py-3.5 text-right">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">
            Total Daily Energy:
          </span>
          <span className="font-mono font-bold text-sm text-teal-300">
            {loads.reduce((s, l) => s + energyWh(l), 0)
              .toLocaleString(undefined, { maximumFractionDigits: 1 })} Wh
          </span>
        </div>
      </div>
    </div>
  );
}
