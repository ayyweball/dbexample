import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Filter,
  Search,
  Brain,
  Sparkles,
  ArrowRight,
  Target,
  Clock,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { Misconception, Student } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { Modal } from '../components/common/Modal';

interface MisconceptionsPageProps {
  onNavigate: (tab: string, context?: any) => void;
}

export const MisconceptionsPage: React.FC<MisconceptionsPageProps> = ({ onNavigate }) => {
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSkillArea, setSelectedSkillArea] = useState<string>('');

  // Selected Misconception for Drilldown
  const [selectedItem, setSelectedItem] = useState<Misconception | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [miscRes, studentsRes] = await Promise.all([
        api.getMisconceptions({
          student_id: selectedStudentId ? Number(selectedStudentId) : undefined,
          skill_area: selectedSkillArea || undefined,
        }),
        api.getStudents(),
      ]);

      setMisconceptions(miscRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load misconceptions from MySQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStudentId, selectedSkillArea]);

  const skillAreas = Array.from(
    new Set(misconceptions.map((m) => m.skill_area).filter(Boolean))
  ) as string[];

  const filteredItems = misconceptions.filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.type.toLowerCase().includes(query) ||
      (m.description && m.description.toLowerCase().includes(query)) ||
      (m.skill_area && m.skill_area.toLowerCase().includes(query)) ||
      (m.student_name && m.student_name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return <LoadingSpinner message="Querying diagnosed misconceptions repository..." size="lg" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Misconceptions" message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Misconceptions Repository
            </h2>
            <Badge variant="rose" size="md">
              {misconceptions.length} Diagnosed
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Cognitive gaps and reasoning errors identified during student practice sessions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('practice')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          <span>New Practice Diagnosis</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search type, explanation, skill..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
          />
        </div>

        {/* Student Filter */}
        <div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Students ({students.length})</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} (#{s.student_id})
              </option>
            ))}
          </select>
        </div>

        {/* Skill Area Filter */}
        <div>
          <select
            value={selectedSkillArea}
            onChange={(e) => setSelectedSkillArea(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Skill Areas ({skillAreas.length})</option>
            {skillAreas.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Misconceptions Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-10 h-10 text-slate-500" />}
          title="No Misconceptions Found"
          description="No cognitive misconceptions match your current filter criteria."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedStudentId('');
            setSelectedSkillArea('');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.misconception_id}
              className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Type and Confidence */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      Misconception #{item.misconception_id}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-0.5">
                      {item.type}
                    </h4>
                  </div>

                  <Badge variant="amber" size="sm">
                    {(item.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>

                {/* Skill Area & Context */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {item.skill_area && (
                    <Badge variant="violet" size="sm">
                      Skill: {item.skill_area}
                    </Badge>
                  )}
                  {item.subject && (
                    <Badge variant="indigo" size="sm">
                      {item.subject} • {item.topic}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
                    "{item.description}"
                  </p>
                )}
              </div>

              {/* Footer: Learner & Drilldown Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-300">
                    {item.student_name || `Student #${item.student_id}`}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedItem(item)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>Inspect Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drilldown Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`Misconception Analysis: ${selectedItem.type}`}
          subtitle={`Attempt #${selectedItem.attempt_id} by ${selectedItem.student_name || 'Student'}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-400 uppercase tracking-wider block">
                Associated Question Context
              </span>
              <p className="text-sm font-semibold text-white">
                {selectedItem.question_text || 'Original Question Text'}
              </p>
              <div className="flex gap-2 pt-1">
                <Badge variant="indigo" size="sm">{selectedItem.subject}</Badge>
                <Badge variant="violet" size="sm">{selectedItem.topic}</Badge>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 space-y-2">
              <span className="font-bold text-rose-400 uppercase tracking-wider block">
                Diagnostic Analysis
              </span>
              <p className="text-slate-200 leading-relaxed">
                {selectedItem.description}
              </p>
              <div className="pt-2 flex items-center justify-between text-slate-400">
                <span>Confidence Score:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {(selectedItem.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  onNavigate('remediation');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Go to Remediation Center</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
