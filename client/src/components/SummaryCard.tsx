import { Activity, Zap, Layers } from 'lucide-react';
import { useConfigStore, computeTotalEnergyWh } from '../store/useConfigStore';

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  icon: React.ReactNode;
  cardClass: string;
  delay?: string;
}

function StatCard({ label, value, unit, sub, icon, cardClass, delay = '0s' }: StatCardProps) {
  return (
    <div className={`${cardClass} animate-fade-in-up`} style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</span>
      </div>
      <div>
        <span className="text-3xl font-bold text-white font-mono tracking-tight">{value}</span>
        {unit && <span className="text-sm text-white/60 ml-2 font-medium">{unit}</span>}
        {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function SummaryCard() {
  const loads   = useConfigStore(s => s.loads);
  const totalWh  = computeTotalEnergyWh(loads);
  const hasLoads = totalWh > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Daily Energy"
        value={hasLoads ? totalWh.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
        unit={hasLoads ? 'Wh' : ''}
        sub="Watt-hours per day"
        icon={<Zap className="w-4 h-4 text-white" strokeWidth={2} />}
        cardClass="stat-card-blue"
        delay="0s"
      />
      <StatCard
        label="In kWh"
        value={hasLoads ? (totalWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
        unit={hasLoads ? 'kWh' : ''}
        sub="Kilowatt-hours per day"
        icon={<Activity className="w-4 h-4 text-white" strokeWidth={2} />}
        cardClass="stat-card-teal"
        delay="0.07s"
      />
      <StatCard
        label="Active Loads"
        value={String(loads.length)}
        unit="devices"
        sub="Rows in the load table"
        icon={<Layers className="w-4 h-4 text-white" strokeWidth={2} />}
        cardClass="stat-card-slate"
        delay="0.14s"
      />
    </div>
  );
}
