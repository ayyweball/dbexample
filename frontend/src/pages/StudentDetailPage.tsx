import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { StudentSummary, Attempt, Misconception } from '../types/api';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';

interface StudentDetailPageProps {
  studentId: number;
  onBack: () => void;
  onNavigate: (tab: string, context?: any) => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  studentId,
  onBack,
  onNavigate,
}) => {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, attemptsRes, miscRes] = await Promise.all([
        api.getStudentSummary(studentId),
        api.getStudentAttempts(studentId),
        api.getStudentMisconceptions(studentId),
      ]);

      setSummary(summaryRes.data);
      setAttempts(attemptsRes.data || []);
      setMisconceptions(miscRes.data || []);
    } catch (err: any) {
      setError(err.message || `Failed to load student #${studentId} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  if (loading) {
    return <LoadingSpinner message="Aggregating student learning telemetry from MySQL..." size="lg" />;
  }

  if (error || !summary) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </button>
        <ErrorState title="Student Profile Unavailable" message={error || 'Not found'} onRetry={loadStudentData} />
      </div>
    );
  }

  const { student, overview, subject_breakdown, top_misconceptions } = summary;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </button>

        <button
          onClick={() => onNavigate('practice')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          <span>Start Practice for this Student</span>
        </button>
      </div>

      {/* Student Profile Card Header */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-indigo-600/30">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{student.name}</h1>
              <Badge variant="indigo" size="sm">ID #{student.student_id}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5 font-mono">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {student.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Enrolled {new Date(student.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase">Overall Accuracy</span>
            <div className="text-3xl font-extrabold text-emerald-400">
              {overview.accuracy_percentage}%
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
            {overview.accuracy_percentage}%
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={overview.total_attempts}
          subtitle={`${overview.correct_attempts} correct answers`}
          icon={Target}
          color="indigo"
        />
        <StatCard
          title="Diagnosed Misconceptions"
          value={misconceptions.length}
          subtitle="Cognitive reasoning flaws"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Avg Hesitation Time"
          value={overview.avg_hesitation_seconds ? `${overview.avg_hesitation_seconds}s` : 'N/A'}
          subtitle="Time spent thinking per question"
          icon={Clock}
          color="violet"
        />
        <StatCard
          title="Avg Revision Count"
          value={overview.avg_revisions}
          subtitle="Keystroke & edit adjustments"
          icon={Brain}
          color="amber"
        />
      </div>

      {/* Subject Performance Breakdown & Top Misconceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Subject Accuracy Breakdown</span>
          </h3>

          {subject_breakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No subject attempts logged yet for this student.
            </p>
          ) : (
            <div className="space-y-3">
              {subject_breakdown.map((sb) => {
                const accuracy = sb.total_attempts > 0 ? (sb.correct_attempts / sb.total_attempts) * 100 : 0;
                return (
                  <div key={sb.subject} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-200">{sb.subject}</span>
                      <span className="text-slate-400 font-mono">
                        {sb.correct_attempts}/{sb.total_attempts} ({accuracy.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Diagnosed Misconceptions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Identified Cognitive Misconceptions</span>
          </h3>

          {top_misconceptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No misconceptions detected! Student has shown solid understanding.
            </p>
          ) : (
            <div className="space-y-3">
              {top_misconceptions.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.type}</h5>
                    {item.skill_area && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Skill: {item.skill_area}
                      </span>
                    )}
                  </div>
                  <Badge variant="rose" size="sm">
                    {item.count} occurrences
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attempt History Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <span>Attempt History Timeline ({attempts.length})</span>
        </h3>

        {attempts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No attempts recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {attempts.map((att) => (
              <div key={att.attempt_id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {att.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">
                      [{att.subject}: {att.topic}]
                    </span>
                    <Badge variant={att.difficulty === 'Easy' ? 'emerald' : att.difficulty === 'Medium' ? 'amber' : 'rose'} size="sm">
                      {att.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                    {att.hesitation_seconds && <span>Thinking: {att.hesitation_seconds}s</span>}
                    <span>{new Date(att.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-semibold">{att.question_text}</p>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-500">Student Answer:</span> <span className="font-bold text-white">"{att.answer}"</span>
                  </div>
                  {att.reasoning && (
                    <div>
                      <span className="text-slate-500">Stated Reasoning:</span> <span className="italic text-indigo-300">"{att.reasoning}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
