import { ClipboardList, Settings, BarChart2, FileText } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Add your loads',
    desc: "Enter each device's name, wattage, daily hours of use, and quantity in the load table.",
  },
  {
    icon: Settings,
    title: 'Choose system voltage',
    desc: 'Select 12 V, 24 V, or 48 V depending on your inverter and wiring setup.',
  },
  {
    icon: BarChart2,
    title: 'Run the calculation',
    desc: 'Click "Calculate Configuration" to get the exact series and parallel cell count for your pack.',
  },
  {
    icon: FileText,
    title: 'Download the report',
    desc: 'Export a PDF summary of the full calculation — useful for documentation or sharing with an installer.',
  },
];

export default function HowToUse() {
  return (
    <div className="card animate-fade-in-up">
      <div className="card-header">
        <div className="section-icon bg-slate-100">
          <ClipboardList className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">How to use this tool</h2>
          <p className="text-xs text-slate-500 mt-0.5">Four steps to size your Li-Ion battery pack.</p>
        </div>
      </div>

      <div className="card-body">
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold
                                   flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
