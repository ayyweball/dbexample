import React from 'react';
import { Clock, Edit3 } from 'lucide-react';

interface TelemetryTimerProps {
  seconds: number;
  revisions: number;
  isRunning: boolean;
}

export const TelemetryTimer: React.FC<TelemetryTimerProps> = ({
  seconds,
  revisions,
  isRunning,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${isRunning ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
        <span className="text-slate-400">Hesitation Time:</span>
        <span className="font-mono font-bold text-white text-sm">
          {formatTime(seconds)} <span className="text-[10px] text-slate-500">({seconds.toFixed(1)}s)</span>
        </span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      <div className="flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-amber-400" />
        <span className="text-slate-400">Revisions:</span>
        <span className="font-mono font-bold text-amber-300 text-sm">
          {revisions}
        </span>
      </div>
    </div>
  );
};
