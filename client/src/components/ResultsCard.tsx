import { useState } from 'react';
import { BarChart2, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useConfigStore, computeTotalEnergyWh } from '../store/useConfigStore';

function StepRow({ step, label, value, highlight = false }: {
  step: number; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`step-row ${highlight ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
      <div className="flex items-start gap-3 w-full sm:w-auto">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5
          ${highlight ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {step}
        </span>
        <span className="text-slate-600 text-xs leading-normal">{label}</span>
      </div>
      <span className={`font-mono font-semibold text-sm whitespace-nowrap self-start sm:self-auto ml-8 sm:ml-0
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

  const [pdfError, setPdfError] = useState<string | null>(null);

  // ── Client-side PDF generation ──────────────────────────────────────────────
  const handleGeneratePdf = () => {
    if (!result) return;
    setPdfError(null);

    try {
      const r      = result;
      const doc    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW  = doc.internal.pageSize.getWidth();
      const pageH  = doc.internal.pageSize.getHeight();
      const margin = 20;
      const cW     = pageW - margin * 2;
      let y        = margin;

      const fmt = (n: number, d = 2) => n.toFixed(d);
      const date = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      // Colour palette — matches the app UI
      const NAVY  : [number,number,number] = [30,  41,  59 ];  // slate-800
      const BLUE  : [number,number,number] = [29,  78,  216];  // blue-700
      const TEAL  : [number,number,number] = [15,  118, 110];  // teal-700
      const SLATE : [number,number,number] = [71,  85,  105];  // slate-600
      const LIGHT : [number,number,number] = [248, 250, 252];  // slate-50

      // ── Header banner ────────────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Lithium-Ion Battery System Technical Summary', margin, 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Li-Ion Solar Configurator', margin, 23);
      doc.text(`Generated: ${date}`, margin, 29);
      y = 50;

      // ── Helpers ───────────────────────────────────────────────────────────
      const section = (title: string, color: [number,number,number] = BLUE) => {
        doc.setFillColor(...color);
        doc.rect(margin, y, cW, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin + 3, y + 5);
        y += 10;
        doc.setTextColor(0, 0, 0);
      };

      const kv = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...SLATE);
        doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(value, margin + 68, y);
        y += 6;
      };

      // ── Section 1: Electrical Loads ───────────────────────────────────────
      section('1. Electrical Loads');
      autoTable(doc, {
        startY: y,
        head: [['Device Name', 'Wattage', 'Hours / Day', 'Quantity', 'Energy (Wh)']],
        body: loads.map(l => [
          l.name || '—',
          `${l.wattage} W`,
          `${l.hours} h`,
          String(l.quantity),
          `${fmt(l.wattage * l.hours * l.quantity)} Wh`,
        ]),
        foot: [['', '', '', 'TOTAL',
          `${fmt(r.totalEnergyWh)} Wh  (${fmt(r.totalEnergyWh / 1000, 3)} kWh)`]],
        margin:  { left: margin, right: margin },
        styles:  { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: BLUE,  textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: TEAL,  textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 4: { halign: 'right' } },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 12;

      // ── Section 2: System Configuration ──────────────────────────────────
      section('2. System Configuration');
      kv('System Bus Voltage:',  `${systemVoltage} V`);
      kv('Cell Nominal Voltage:', `${cellVoltage} V`);
      kv('Cell Rated Capacity:', `${cellCapacityAh} Ah`);
      y += 2;

      // ── Section 3: Sizing Calculation ─────────────────────────────────────
      section('3. Battery Pack Sizing Calculation', TEAL);
      kv('Total Daily Energy:', `${fmt(r.totalEnergyWh)} Wh  (${fmt(r.totalEnergyWh / 1000, 3)} kWh)`);
      kv('Step 1 — Raw Ah demand:', `${fmt(r.totalEnergyWh)} / ${systemVoltage} V = ${fmt(r.requiredAh)} Ah`);
      kv('Step 2 — After 80% DoD:', `${fmt(r.requiredAh)} / 0.8 = ${fmt(r.effectiveAh)} Ah`);
      kv('Step 3 — +20% margin:', `${fmt(r.effectiveAh)} x 1.2 = ${fmt(r.finalAh)} Ah`);
      kv('Step 4 — Series cells (S):', `ceil(${systemVoltage} / ${cellVoltage}) = ${r.seriesCells}`);
      kv('Step 5 — Parallel strings (P):', `ceil(${fmt(r.finalAh)} / ${cellCapacityAh}) = ${r.parallelStrings}`);
      y += 2;

      // ── Result box ────────────────────────────────────────────────────────
      doc.setFillColor(...LIGHT);
      doc.roundedRect(margin, y, cW, 28, 3, 3, 'F');
      doc.setDrawColor(...BLUE);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, cW, 28, 3, 3, 'S');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLUE);
      doc.text(`Pack Configuration: ${r.packConfig}`, margin + 6, y + 9);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE);
      doc.text(
        `${r.seriesCells} cells in series  x  ${r.parallelStrings} parallel strings  =  ${r.totalCells} total cells`,
        margin + 6, y + 16
      );
      doc.text(
        `Pack voltage approx. ${fmt(r.seriesCells * cellVoltage)} V  |  Pack capacity = ${fmt(r.parallelStrings * cellCapacityAh)} Ah`,
        margin + 6, y + 22
      );
      y += 36;

      // ── Section 4: Design Assumptions ────────────────────────────────────
      section('4. Design Assumptions');
      const assumptions = [
        `Cell chemistry: Lithium-Ion (Li-Ion)`,
        `Cell nominal voltage: ${cellVoltage} V per cell`,
        `Cell rated capacity: ${cellCapacityAh} Ah per cell`,
        `Depth of Discharge (DoD): 80% — only 80% of rated capacity is used per cycle`,
        `Degradation design margin: 20% — pack oversized to compensate for capacity fade over lifetime`,
        `Series count always rounded up to ensure system voltage is met or exceeded`,
        `Parallel count always rounded up to ensure energy demand is met`,
      ];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      for (const line of assumptions) {
        doc.text(`  ${line}`, margin + 3, y);
        y += 5.5;
      }

      // ── Footer ────────────────────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'Generated by Li-Ion Solar Configurator  |  For design reference only — consult a qualified engineer for safety-critical installations.',
        margin, pageH - 4.5,
      );

      // ── Trigger download ──────────────────────────────────────────────────
      doc.save('LiIon-Battery-Report.pdf');

    } catch (err) {
      console.error('[PDF]', err);
      setPdfError('PDF generation failed. Please try again.');
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-slate-100 border-t border-slate-100 overflow-hidden">
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-slate-100">
            <button id="generate-pdf-btn" onClick={handleGeneratePdf} className="btn-success w-full sm:w-auto justify-center">
              <FileDown className="w-4 h-4" /> Download PDF Report
            </button>
            <p className="text-xs text-slate-400 text-center sm:text-left">
              Generates and downloads a formatted A4 PDF report instantly.
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
