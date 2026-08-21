import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />;
};

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading data from backend...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div
        className={`${sizeMap[size]} border-indigo-500 border-t-transparent rounded-full animate-spin mb-3`}
      />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to Load', message, onRetry }) => {
  return (
    <div className="glass-panel border-rose-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="glass-panel rounded-2xl p-12 text-center border-dashed border-slate-800 max-w-md mx-auto my-8">
      {icon && <div className="text-indigo-400 mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 text-sm font-medium transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
