import Header from './components/Header';
import HowToUse from './components/HowToUse';
import SummaryCard from './components/SummaryCard';
import LoadTable from './components/LoadTable';
import SystemConfig from './components/SystemConfig';
import ResultsCard from './components/ResultsCard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <HowToUse />
        <SummaryCard />
        <LoadTable />
        <SystemConfig />
        <ResultsCard />
      </main>
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Li-Ion Solar Configurator</span>
          <span className="text-xs text-slate-400">For design reference only — consult a qualified engineer for safety-critical installations.</span>
        </div>
      </footer>
    </div>
  );
}
