import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Brain,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Question, SubjectTopic, Difficulty } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { Modal } from '../components/common/Modal';

interface QuestionBankPageProps {
  onNavigate: (tab: string, context?: any) => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<SubjectTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Question Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('Easy');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, subjectsRes] = await Promise.all([
        api.getQuestions({
          subject: selectedSubject || undefined,
          topic: selectedTopic || undefined,
          difficulty: selectedDifficulty || undefined,
          search: searchQuery || undefined,
        }),
        api.getSubjectsAndTopics(),
      ]);

      setQuestions(qRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, selectedTopic, selectedDifficulty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTopic.trim() || !newQuestionText.trim() || !newCorrectAnswer.trim()) {
      setCreateError('All fields are required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await api.createQuestion({
        subject: newSubject.trim(),
        topic: newTopic.trim(),
        question_text: newQuestionText.trim(),
        correct_answer: newCorrectAnswer.trim(),
        difficulty: newDifficulty,
      });

      setIsAddModalOpen(false);
      setNewSubject('');
      setNewTopic('');
      setNewQuestionText('');
      setNewCorrectAnswer('');
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create question');
    } finally {
      setIsCreating(false);
    }
  };

  const activeTopics = selectedSubject
    ? subjects.find((s) => s.subject === selectedSubject)?.topics || []
    : [];

  if (loading && questions.length === 0) {
    return <LoadingSpinner message="Querying Question Bank from MySQL..." size="lg" />;
  }

  if (error && questions.length === 0) {
    return <ErrorState title="Question Bank Offline" message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Question Bank
            </h2>
            <Badge variant="indigo" size="md">
              {questions.length} Questions
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Curated question repository spanning Mathematics, Physics, Chemistry, and Computer Science.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.subject} value={sub.subject}>
                  {sub.subject}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={selectedTopic}
              disabled={!selectedSubject}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            >
              <option value="">All Topics</option>
              {activeTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </form>
      </div>

      {/* Question List Grid */}
      {questions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10 text-slate-500" />}
          title="No Questions Match Filter"
          description="Try broadening your subject, topic, or difficulty filters."
          actionText="Reset Filters"
          onAction={() => {
            setSelectedSubject('');
            setSelectedTopic('');
            setSelectedDifficulty('');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {questions.map((q) => {
            const diffVariant = {
              Easy: 'emerald',
              Medium: 'amber',
              Hard: 'rose',
            }[q.difficulty] as any;

            return (
              <div
                key={q.question_id}
                className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {q.subject}
                    </span>
                    <Badge variant={diffVariant} size="sm">
                      {q.difficulty}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Topic: {q.topic}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-relaxed">
                      {q.question_text}
                    </h3>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-400 font-mono">
                    Correct Answer: <span className="text-emerald-400 font-bold">"{q.correct_answer}"</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">ID #{q.question_id}</span>
                  <button
                    onClick={() => onNavigate('practice', { questionId: q.question_id })}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold uppercase tracking-wider text-[11px] transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Practice Question</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Question to Bank"
          subtitle="Insert a new problem into the MySQL question bank."
        >
          <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subject: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Topic: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Linear Equations"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Question Text: <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter complete question statement..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Authoritative Correct Answer: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCorrectAnswer}
                  onChange={(e) => setNewCorrectAnswer(e.target.value)}
                  placeholder="e.g. 4 or 20 m/s"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Difficulty Level:
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300">
                {createError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Add Question'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
