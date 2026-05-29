import { Router, Request, Response } from 'express';
import { z } from 'zod';
// jsPDF works in Node.js (CommonJS require at runtime avoids ESM issues)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { jsPDF } = require('jspdf');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const autoTable = require('jspdf-autotable');

const router = Router();

// ── Zod schemas ─────────────────────────────────────────────────────────────

const LoadSchema = z.object({
  id:       z.string(),
  name:     z.string().default(''),
  wattage:  z.number(),
  hours:    z.number(),
  quantity: z.number(),
});

const CalcResultSchema = z.object({
  totalEnergyWh:   z.number(),
  totalEnergyKwh:  z.number(),
  requiredAh:      z.number(),
  effectiveAh:     z.number(),
  finalAh:         z.number(),
  seriesCells:     z.number(),
  parallelStrings: z.number(),
  totalCells:      z.number(),
  packConfig:      z.string(),
});

const ReportRequestSchema = z.object({
  loads:             z.array(LoadSchema).min(1),
  systemVoltage:     z.number(),
  calculationResult: CalcResultSchema,
  cellVoltage:       z.number().default(3.7),
  cellCapacityAh:    z.number().default(3.0),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 2) => n.toFixed(dec);

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── POST /api/generate-report ───────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  const parsed = ReportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid report data',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { loads, systemVoltage, calculationResult: cr, cellVoltage, cellCapacityAh } = parsed.data;

  try {
    // ── Create PDF document ──────────────────────────────────────────────
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Colour palette ───────────────────────────────────────────────────
    const INDIGO  = [79, 70, 229] as [number, number, number];   // brand-600
    const EMERALD = [5, 150, 105] as [number, number, number];   // solar-600
    const SLATE   = [71, 85, 105] as [number, number, number];   // slate-600
    const LIGHT   = [241, 245, 249] as [number, number, number]; // slate-100

    // ── Header banner ────────────────────────────────────────────────────
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, pageW, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Lithium-Ion Battery System Technical Summary', margin, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Li-Ion Solar Configurator', margin, 23);
    doc.text(`Generated: ${formatDate()}`, margin, 29);

    y = 50;

    // ── Section helper ────────────────────────────────────────────────────
    const sectionTitle = (title: string, color: [number, number, number] = INDIGO) => {
      doc.setFillColor(...color);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 3, y + 5);
      y += 10;
      doc.setTextColor(0, 0, 0);
    };

    const kvRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...SLATE);
      doc.text(label, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(value, margin + 65, y);
      y += 6;
    };

    // ── Section 1: Load Table ─────────────────────────────────────────────
    sectionTitle('1. Electrical Loads');

    const tableBody = loads.map(l => [
      l.name || '—',
      `${l.wattage} W`,
      `${l.hours} h`,
      String(l.quantity),
      `${fmt(l.wattage * l.hours * l.quantity)} Wh`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Device Name', 'Wattage', 'Hours/day', 'Quantity', 'Energy (Wh)']],
      body: tableBody,
      foot: [['', '', '', 'TOTAL', `${fmt(cr.totalEnergyWh)} Wh  (${fmt(cr.totalEnergyKwh, 3)} kWh)`]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: EMERALD, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 4: { halign: 'right' } },
    });

    // Draw footer on Page 1
    doc.setFillColor(...SLATE);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Generated by Li-Ion Solar Configurator  |  For design reference only — consult a qualified engineer for safety-critical installations.',
      margin,
      pageH - 4.5,
    );

    // Add Page 2
    doc.addPage();

    // Page 2 header banner
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, pageW, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Lithium-Ion Battery System Sizing Report — Configuration & Sizing', margin, 9.5);

    y = 25;

    // ── Section 2: System Configuration ──────────────────────────────────
    sectionTitle('2. System Configuration');
    kvRow('System Bus Voltage:', `${systemVoltage} V`);
    kvRow('Cell Nominal Voltage:', `${cellVoltage} V`);
    kvRow('Cell Rated Capacity:', `${cellCapacityAh} Ah`);
    y += 2;

    // ── Section 3: Battery Pack Sizing ────────────────────────────────────
    sectionTitle('3. Battery Pack Sizing Calculation', EMERALD);

    kvRow('Total Daily Energy Demand:', `${fmt(cr.totalEnergyWh)} Wh  (${fmt(cr.totalEnergyKwh, 3)} kWh)`);
    kvRow('Step 1 — Raw Ah demand:', `${fmt(cr.totalEnergyWh)} ÷ ${systemVoltage} V = ${fmt(cr.requiredAh)} Ah`);
    kvRow('Step 2 — After 80 % DoD:', `${fmt(cr.requiredAh)} ÷ 0.8 = ${fmt(cr.effectiveAh)} Ah`);
    kvRow('Step 3 — +20 % margin:', `${fmt(cr.effectiveAh)} × 1.2 = ${fmt(cr.finalAh)} Ah`);
    const step4Label = cellVoltage === 3.7
      ? `Standard Li-ion configuration (${systemVoltage}V)`
      : `ceil(${systemVoltage} ÷ ${cellVoltage})`;
    kvRow('Step 4 — Series cells (S):', `${step4Label} = ${cr.seriesCells}`);
    kvRow('Step 5 — Parallel strings (P):', `ceil(${fmt(cr.finalAh)} ÷ ${cellCapacityAh}) = ${cr.parallelStrings}`);
    y += 2;

    // ── Result box ────────────────────────────────────────────────────────
    doc.setFillColor(...LIGHT);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
    doc.setDrawColor(...EMERALD);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, contentW, 28, 3, 3, 'S');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INDIGO);
    doc.text(`Pack Configuration: ${cr.packConfig}`, margin + 6, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text(`${cr.seriesCells} cells in series  ×  ${cr.parallelStrings} parallel strings  =  ${cr.totalCells} total cells`, margin + 6, y + 16);
    doc.text(`Pack voltage ≈ ${fmt(cr.seriesCells * cellVoltage)} V  |  Pack capacity = ${fmt(cr.parallelStrings * cellCapacityAh)} Ah`, margin + 6, y + 22);
    y += 36;

    // ── Section 4: Assumptions ────────────────────────────────────────────
    sectionTitle('4. Design Assumptions');
    const assumptions = [
      `Cell chemistry: Lithium-Ion (Li-Ion)`,
      `Cell nominal voltage: ${cellVoltage} V per cell`,
      `Cell rated capacity: ${cellCapacityAh} Ah per cell`,
      `Depth of Discharge (DoD): 80 % — only 80 % of rated capacity is used per cycle`,
      `Degradation design margin: 20 % — pack oversized to compensate for capacity fade over lifetime`,
      `Series count always rounded up to ensure system voltage is met or exceeded`,
      `Parallel count always rounded up to ensure energy demand is met`,
    ];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    for (const line of assumptions) {
      doc.text(`• ${line}`, margin + 3, y);
      y += 5.5;
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFillColor(...SLATE);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Generated by Li-Ion Solar Configurator  |  For design reference only — consult a qualified engineer for safety-critical installations.',
      margin,
      pageH - 4.5,
    );

    // ── Output ────────────────────────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output('arraybuffer') as ArrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="LiIon-Battery-Report.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('[generateReport] PDF generation error:', err);
    return res.status(500).json({ error: 'PDF generation failed. Please try again.' });
  }
});

export { router as generateReportRoute };
