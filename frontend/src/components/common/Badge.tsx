import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'violet' | 'slate' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-950/70 text-rose-400 border-rose-500/30',
    amber: 'bg-amber-950/70 text-amber-400 border-amber-500/30',
    indigo: 'bg-indigo-950/70 text-indigo-400 border-indigo-500/30',
    violet: 'bg-violet-950/70 text-violet-400 border-violet-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    blue: 'bg-blue-950/70 text-blue-400 border-blue-500/30',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    indigo: 'bg-indigo-400',
    violet: 'bg-violet-400',
    slate: 'bg-slate-400',
    blue: 'bg-blue-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
};
