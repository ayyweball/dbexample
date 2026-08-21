import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  AlertTriangle,
  Target,
  BookOpen,
  Users,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'practice',
      label: 'Practice Studio',
      icon: BrainCircuit,
      badge: 'AI Powered',
    },
    {
      id: 'misconceptions',
      label: 'Misconceptions',
      icon: AlertTriangle,
      badge: null,
    },
    {
      id: 'remediation',
      label: 'Remediation',
      icon: Target,
      badge: null,
    },
    {
      id: 'questions',
      label: 'Question Bank',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-64 glass-panel border-r border-slate-800/80 p-4 flex lg:flex-col justify-between shrink-0 overflow-x-auto lg:overflow-x-visible">
      <div className="flex lg:flex-col gap-1.5 w-full">
        <div className="hidden lg:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Core Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:whitespace-normal group ${
                isActive
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Info card in sidebar on desktop */}
      <div className="hidden lg:block p-3.5 rounded-xl glass-panel border border-indigo-500/20 bg-indigo-950/30 mt-6">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Cognitive Diagnosis</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Groq AI analyzes reasoning flaws in real-time and generates targeted remediation questions.
        </p>
      </div>
    </aside>
  );
};
