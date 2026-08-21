import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, BrainCircuit, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { HealthResponse } from '../../types/api';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime_seconds: 0,
        database: { connected: false, error: 'Connection failed' },
        environment: 'offline',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'healthy' && health?.database?.connected;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">
                Secure the Repo
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Diagnostic
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Cognitive Learning & Misconception Remediation Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Health Badge */}
        <div
          onClick={checkHealth}
          title="Click to recheck API health"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-medium transition-all"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 hidden md:inline">API Status:</span>
          <span
            className={
              isHealthy ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
            }
          >
            {isChecking ? 'Checking...' : isHealthy ? 'Live / Connected' : 'Degraded'}
          </span>
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 hover:text-slate-300 ${
              isChecking ? 'animate-spin' : ''
            }`}
          />
        </div>

        {/* Quick Launch Practice Studio */}
        <button
          onClick={() => onNavigate('practice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            activeTab === 'practice'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white ring-2 ring-indigo-400/50 shadow-indigo-500/25'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-200" />
          <span>Practice Studio</span>
        </button>
      </div>
    </header>
  );
};
