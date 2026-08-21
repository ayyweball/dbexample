import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  Target,
  AlertTriangle,
  Award,
  Sparkles,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { StatsOverview, Attempt } from '../types/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';

interface DashboardPageProps {
  onNavigate: (tab: string, context?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        api.getStatsOverview(),
        api.getAttempts({ limit: 6 }),
      ]);
      setStats(statsRes.data);
      setRecentAttempts(attemptsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Fetching real-time analytics from MySQL..." size="lg" />;
  }

  if (error || !stats) {
    return (
      <ErrorState
        title="Dashboard Offline"
        message={error || 'Unable to connect to MySQL analytics endpoint'}
        onRetry={loadDashboardData}
      />
    );
  }

  const { totals, questions_by_subject, top_misconceptions } = stats;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 lg:p-8 overflow-hidden glass-panel border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/90 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Diagnostic Engine Active
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
            Cognitive Diagnostics & Misconception Tracking
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Real-time analytics engine evaluating learner reasoning, diagnosing underlying conceptual flaws, and automatically generating targeted remediation pathways.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('practice')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              <span>Launch Practice Studio</span>
            </button>
            <button
              onClick={() => onNavigate('misconceptions')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>View Misconceptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Students"
          value={totals.students}
          subtitle="Enrolled learners"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Question Bank"
          value={totals.questions}
          subtitle={`${questions_by_subject.length} active subject domains`}
          icon={BookOpen}
          color="violet"
        />
        <StatCard
          title="Practice Attempts"
          value={totals.attempts}
          subtitle={`Overall accuracy: ${totals.accuracy_percentage}%`}
          icon={Target}
          color="emerald"
        />
        <StatCard
          title="Detected Misconceptions"
          value={totals.misconceptions}
          subtitle={`${totals.followup_questions} remediation questions`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Secondary Metrics: Telemetry & Remediation Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Accuracy</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{totals.accuracy_percentage}%</div>
            <span className="text-[11px] text-slate-500">{totals.correct_attempts} / {totals.attempts} correct attempts</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {totals.accuracy_percentage}%
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Hesitation Time</span>
            <div className="text-2xl font-bold text-indigo-400 mt-0.5">
              {totals.avg_hesitation_seconds ? `${totals.avg_hesitation_seconds}s` : 'N/A'}
            </div>
            <span className="text-[11px] text-slate-500">Avg revisions per attempt: {totals.avg_revisions}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remediation Resolution</span>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">
              {totals.followup_accuracy_percentage}%
            </div>
            <span className="text-[11px] text-slate-500">{totals.followup_attempts} follow-up attempts logged</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown & Top Misconceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions by Subject */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Questions by Subject</span>
            </h3>
            <button
              onClick={() => onNavigate('questions')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Browse All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {questions_by_subject.map((item) => {
              const percentage = totals.questions > 0 ? (item.count / totals.questions) * 100 : 0;
              return (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{item.subject}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} questions ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Diagnosed Misconceptions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Top Cognitive Misconceptions</span>
            </h3>
            <button
              onClick={() => onNavigate('misconceptions')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              View Repository <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {top_misconceptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No misconceptions recorded yet. Submit attempts in the Practice Studio to diagnose reasoning flaws.
            </div>
          ) : (
            <div className="space-y-3">
              {top_misconceptions.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-white">{item.type}</h5>
                    {item.skill_area && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Skill: {item.skill_area}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="rose" size="sm">
                      {item.count} occurrences
                    </Badge>
                    {item.avg_confidence && (
                      <Badge variant="amber" size="sm">
                        {(item.avg_confidence * 100).toFixed(0)}% conf
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Practice Attempts Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Recent Learning Activity</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time attempt feed</span>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No attempts logged yet. Launch the Practice Studio to submit the first student answer.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentAttempts.map((att) => (
              <div
                key={att.attempt_id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {att.is_correct ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-white">{att.student_name || `Student #${att.student_id}`}</span>
                    <span className="text-slate-400"> attempted </span>
                    <span className="text-indigo-300 font-medium">
                      [{att.subject}: {att.topic}]
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 line-clamp-1">
                      "{att.question_text}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={att.is_correct ? 'emerald' : 'rose'} size="sm">
                    {att.is_correct ? 'Correct' : 'Incorrect'}
                  </Badge>
                  {att.hesitation_seconds && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      {att.hesitation_seconds}s
                    </span>
                  )}
                  <span className="text-slate-500 text-[11px]">
                    {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
