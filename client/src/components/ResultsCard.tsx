import { useState } from 'react';
import { BarChart2, FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useConfigStore, computeTotalEnergyWh } from '../store/useConfigStore';

function StepRow({ step, label, value, highlight = false }: {
  step: number; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`step-row ${highlight ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
          ${highlight ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {step}
        </span>
        <span className="text-slate-600 text-xs">{label}</span>
      </div>
      <span className={`font-mono font-semibold text-sm whitespace-nowrap ml-4
        ${highlight ? 'text-blue-700' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

export default function ResultsCard() {
  const loads          = useConfigStore(s => s.loads);
  const systemVoltage  = useConfigStore(s => s.systemVoltage);
  const cellVoltage    = useConfigStore(s => s.cellVoltage);
  const cellCapacityAh = useConfigStore(s => s.cellCapacityAh);
  const result         = useConfigStore(s => s.calculationResult);
  const totalWh        = computeTotalEnergyWh(loads);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loads, systemVoltage, calculationResult: result, cellVoltage, cellCapacityAh }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'LiIon-Battery-Report.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError((e as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="card border-dashed border-slate-300 bg-white/60 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="card-body text-center py-14">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-700 font-semibold">No configuration calculated yet</p>
          <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
            {totalWh === 0
              ? 'Add your loads above, then click "Calculate Configuration".'
              : 'Click "Calculate Configuration" to run the battery sizing engine.'}
          </p>
        </div>
      </div>
    );
  }

  const r = result;
  const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
      {/* Result header */}
      <div className="card overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-shrink-0 bg-blue-700 rounded-xl px-6 py-4 text-center animate-scale-in">
            <p className="text-3xl font-black text-white font-mono tracking-tight leading-none">{r.packConfig}</p>
            <p className="text-[10px] text-blue-300 mt-1.5 uppercase tracking-wider font-semibold">Pack Config</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Sizing Result</p>
            <h2 className="text-xl font-bold text-white">
              {r.seriesCells} cells in series, {r.parallelStrings} strings in parallel
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {r.totalCells} total cells &mdash; pack voltage approx. {fmt(r.seriesCells * cellVoltage, 1)} V,&nbsp;
              {fmt(r.parallelStrings * cellCapacityAh, 1)} Ah
            </p>
          </div>
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
          {[
            { label: 'Series (S)',     value: String(r.seriesCells),     sub: 'per string',          color: 'text-blue-700'  },
            { label: 'Parallel (P)',  value: String(r.parallelStrings), sub: 'strings',              color: 'text-teal-700'  },
            { label: 'Total Cells',   value: String(r.totalCells),       sub: `${r.seriesCells} × ${r.parallelStrings}`, color: 'text-slate-800' },
            { label: 'Capacity Req.', value: `${fmt(r.finalAh)} Ah`,    sub: 'with safety margins', color: 'text-slate-800' },
          ].map(({ label, value, sub, color }, i) => (
            <div key={i} className="px-5 py-4 text-center bg-white animate-scale-in"
                 style={{ animationDelay: `${i * 0.05}s` }}>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation breakdown */}
      <div className="card">
        <div className="card-header">
          <div className="section-icon bg-teal-50">
            <BarChart2 className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Step-by-Step Calculation</h3>
        </div>
        <div className="card-body space-y-2">
          <StepRow step={1} label={`Raw Ah demand: ${fmt(r.totalEnergyWh, 1)} Wh / ${systemVoltage} V`} value={`${fmt(r.requiredAh)} Ah`} />
          <StepRow step={2} label="Depth of Discharge correction (/ 0.80) — only 80% of capacity used per cycle" value={`${fmt(r.effectiveAh)} Ah`} />
          <StepRow step={3} label="Degradation margin (* 1.20) — 20% headroom for capacity fade over lifetime" value={`${fmt(r.finalAh)} Ah`} />
          <StepRow step={4} label={`Cells in series: ceil(${systemVoltage} / ${cellVoltage} V)`} value={`S = ${r.seriesCells}`} highlight />
          <StepRow step={5} label={`Parallel strings: ceil(${fmt(r.finalAh)} / ${cellCapacityAh} Ah)`} value={`P = ${r.parallelStrings}`} highlight />
          <StepRow step={6} label={`Total cells: ${r.seriesCells} * ${r.parallelStrings}`} value={`${r.totalCells} cells`} />
        </div>
      </div>

      {/* Assumptions + PDF */}
      <div className="card">
        <div className="card-body space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <h4 className="text-sm font-semibold text-slate-800">Design Assumptions</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
              {[
                ['Cell chemistry',        'Lithium-Ion (Li-Ion)'],
                ['Cell nominal voltage',  `${cellVoltage} V`],
                ['Cell rated capacity',   `${cellCapacityAh} Ah`],
                ['Depth of Discharge',    '80%'],
                ['Degradation margin',    '20%'],
                ['Rounding rule',         'S and P always rounded up'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline gap-3">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className="text-xs font-semibold text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-slate-100">
            <button id="generate-pdf-btn" onClick={handleGeneratePdf} disabled={pdfLoading} className="btn-success">
              {pdfLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><FileDown className="w-4 h-4" /> Download PDF Report</>}
            </button>
            <p className="text-xs text-slate-400">
              Exports a formatted PDF with the full calculation, load table, and assumptions.
            </p>
          </div>

          {pdfError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {pdfError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
