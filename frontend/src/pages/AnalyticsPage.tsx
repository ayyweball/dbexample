import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Award,
  AlertTriangle,
  BookOpen,
  Target,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { StatsOverview } from '../types/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStatsOverview();
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Aggregating platform analytics..." size="lg" />;
  }

  if (error || !stats) {
    return <ErrorState title="Analytics Engine Unavailable" message={error || 'Failed'} onRetry={loadStats} />;
  }

  const { totals, questions_by_subject, top_misconceptions } = stats;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Learning Analytics & Cognitive Insights
            </h2>
            <Badge variant="indigo" size="md">Platform-Wide</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Telemetry metrics, cognitive diagnosis distributions, and remediation resolution effectiveness.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Student Accuracy"
          value={`${totals.accuracy_percentage}%`}
          subtitle={`${totals.correct_attempts} of ${totals.attempts} total attempts`}
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Remediation Success Rate"
          value={`${totals.followup_accuracy_percentage}%`}
          subtitle={`${totals.followup_attempts} follow-up attempts`}
          icon={Target}
          color="amber"
        />
        <StatCard
          title="Avg Hesitation Time"
          value={totals.avg_hesitation_seconds ? `${totals.avg_hesitation_seconds}s` : 'N/A'}
          subtitle="Cognitive delay before submit"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Avg Keystroke Revisions"
          value={totals.avg_revisions}
          subtitle="Modifications during reasoning"
          icon={Brain}
          color="violet"
        />
      </div>

      {/* Deep Dive Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Domain Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Subject Domain Volume</span>
          </h3>

          <div className="space-y-4">
            {questions_by_subject.map((sub) => {
              const pct = totals.questions > 0 ? (sub.count / totals.questions) * 100 : 0;
              return (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{sub.subject}</span>
                    <span className="text-indigo-400 font-mono">{sub.count} questions ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cognitive Misconception Prevalence */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Top Cognitive Misconception Flaws</span>
          </h3>

          {top_misconceptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No misconceptions identified yet.
            </p>
          ) : (
            <div className="space-y-3">
              {top_misconceptions.map((m, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-white">{m.type}</h5>
                    {m.skill_area && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Skill: {m.skill_area}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="rose" size="sm">{m.count} diagnosed</Badge>
                    {m.avg_confidence && (
                      <Badge variant="amber" size="sm">{(m.avg_confidence * 100).toFixed(0)}% conf</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
