import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      iconBg: 'bg-indigo-600/20 text-indigo-400',
      borderHover: 'hover:border-indigo-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-600/20 text-emerald-400',
      borderHover: 'hover:border-emerald-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-600/20 text-amber-400',
      borderHover: 'hover:border-amber-500/40',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      iconBg: 'bg-rose-600/20 text-rose-400',
      borderHover: 'hover:border-rose-500/40',
    },
    violet: {
      bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      iconBg: 'bg-violet-600/20 text-violet-400',
      borderHover: 'hover:border-violet-500/40',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border transition-all duration-200 ${scheme.borderHover} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
            {trend && <span className="text-emerald-400 font-semibold">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
