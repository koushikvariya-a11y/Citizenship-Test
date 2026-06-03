import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  highlightText?: string;
  isPositive?: boolean;
  icon: ReactNode;
}

export default function MetricCard({ title, value, highlightText, isPositive = true, icon }: MetricCardProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-0 top-0 h-24 w-24 bg-slate-950/40 rounded-bl-full -mr-5 -mt-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-950/80" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white font-sans">{value}</p>
          {highlightText && (
            <p className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {highlightText}
            </p>
          )}
        </div>
        <div className="p-3 bg-slate-950 text-slate-400 rounded-lg group-hover:bg-indigo-950/40 group-hover:text-indigo-400 transition-colors duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}
