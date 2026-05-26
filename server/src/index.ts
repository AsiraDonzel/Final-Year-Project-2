import express from 'express';
import cors from 'cors';
import path from 'path';
import { calculateRoute } from './routes/calculate';
import { generateReportRoute } from './routes/generateReport';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3001'] }));
app.use(express.json({ limit: '5mb' }));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/calculate',       calculateRoute);
app.use('/api/generate-report', generateReportRoute);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Serve React build (production) ───────────────────────────────────────────
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔋 Li-Ion Solar Configurator API  →  http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
