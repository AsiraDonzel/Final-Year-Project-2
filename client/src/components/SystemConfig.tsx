import { Calculator, Cpu, AlertCircle, Loader2 } from 'lucide-react';
import { useConfigStore, computeTotalEnergyWh } from '../store/useConfigStore';
import AdvancedSettings from './AdvancedSettings';

const VOLTAGES = [12, 24, 48] as const;

export default function SystemConfig() {
  const loads         = useConfigStore(s => s.loads);
  const systemVoltage = useConfigStore(s => s.systemVoltage);
  const cellVoltage   = useConfigStore(s => s.cellVoltage);
  const isCalculating = useConfigStore(s => s.isCalculating);
  const calcError     = useConfigStore(s => s.calcError);
  const setVoltage    = useConfigStore(s => s.setSystemVoltage);
  const calculate     = useConfigStore(s => s.calculate);

  const getSeriesCells = (sysV: number, cellV: number) => {
    if (cellV === 3.7) {
      if (sysV === 12) return 3;
      if (sysV === 24) return 7;
      if (sysV === 48) return 14;
    }
    return Math.ceil(sysV / cellV);
  };

  const totalWh = computeTotalEnergyWh(loads);
  const canCalc = totalWh > 0 && !isCalculating;

  return (
    <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="card-header">
        <div className="section-icon bg-teal-50">
          <Cpu className="w-4 h-4 text-teal-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">System Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Set bus voltage and run the sizing calculation.</p>
        </div>
      </div>

      <div className="card-body space-y-5">
        {/* Voltage selector */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">System Bus Voltage</p>
          <div className="flex flex-wrap gap-2">
            {VOLTAGES.map(v => {
              const active = systemVoltage === v;
              const s = getSeriesCells(v, cellVoltage);
              return (
                <button
                  key={v}
                  id={`voltage-btn-${v}`}
                  onClick={() => setVoltage(v)}
                  aria-pressed={active}
                  className={`flex flex-col items-center px-6 py-3 rounded-lg border font-semibold text-sm
                    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                    focus:ring-offset-2 active:scale-[0.97]
                    ${active
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700'}`}
                >
                  <span className="text-base font-bold leading-none">{v} V</span>
                  <span className={`text-[10px] font-medium mt-1 ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                    S = {s}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Cells in series: {cellVoltage === 3.7 ? (
              <>Standard {systemVoltage}V Li-ion = <strong className="text-slate-600">{getSeriesCells(systemVoltage, cellVoltage)}S</strong></>
            ) : (
              <>S = ceil({systemVoltage} / {cellVoltage}) = <strong className="text-slate-600">{getSeriesCells(systemVoltage, cellVoltage)}S</strong></>
            )}
          </p>
          <select id="system-voltage-select" value={systemVoltage}
            onChange={e => setVoltage(parseInt(e.target.value, 10) as 12 | 24 | 48)}
            className="sr-only" aria-label="System voltage">
            {VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}
          </select>
        </div>

        <AdvancedSettings />

        {totalWh === 0 && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Add at least one load with a wattage greater than 0 before calculating.
          </div>
        )}

        {calcError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-scale-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{calcError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          <button id="calculate-btn" onClick={calculate} disabled={!canCalc} className="btn-primary w-full sm:w-auto justify-center px-6 py-2 text-sm">
            {isCalculating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
              : <><Calculator className="w-4 h-4" /> Calculate Configuration</>}
          </button>
          {totalWh > 0 && !isCalculating && (
            <span className="text-xs text-slate-400 text-center sm:text-left animate-fade-in">
              {totalWh.toLocaleString(undefined, { maximumFractionDigits: 1 })} Wh at {systemVoltage} V
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
