import { Zap } from 'lucide-react';
import { useConfigStore } from '../store/useConfigStore';

export default function Header() {
  const reset = useConfigStore(s => s.reset);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Li-Ion Solar Configurator
            </span>
            <span className="hidden sm:inline text-slate-400 text-xs ml-3">
              Battery Pack Sizing Tool
            </span>
          </div>
        </div>
        <button
          id="header-reset-btn"
          onClick={reset}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Reset
        </button>
      </div>
    </header>
  );
}
