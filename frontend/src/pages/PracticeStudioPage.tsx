import React, { useEffect, useState, useRef } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  BookOpen,
  User,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Student, Question, SubjectTopic, Attempt, CreateAttemptPayload } from '../types/api';
import { Badge } from '../components/common/Badge';
import { TelemetryTimer } from '../components/practice/TelemetryTimer';
import { AiMisconceptionCard } from '../components/practice/AiMisconceptionCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';

interface PracticeStudioPageProps {
  initialQuestionId?: number;
}

export const PracticeStudioPage: React.FC<PracticeStudioPageProps> = ({ initialQuestionId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<SubjectTopic[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Form Inputs
  const [answer, setAnswer] = useState('');
  const [reasoning, setReasoning] = useState('');
  
  // Telemetry: Hesitation timer & Revision Counter
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [revisionCount, setRevisionCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data from backend
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, questionsRes, subjectsRes] = await Promise.all([
        api.getStudents(),
        api.getQuestions(),
        api.getSubjectsAndTopics(),
      ]);

      const studentList = studentsRes.data || [];
      const questionList = questionsRes.data || [];
      
      setStudents(studentList);
      setQuestions(questionList);
      setSubjects(subjectsRes.data || []);

      if (studentList.length > 0) {
        setSelectedStudentId(studentList[0].student_id);
      }

      if (initialQuestionId) {
        const matchingQ = questionList.find(q => q.question_id === initialQuestionId);
        if (matchingQ) setSelectedQuestion(matchingQ);
      } else if (questionList.length > 0) {
        setSelectedQuestion(questionList[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load initial practice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Timer logic
  useEffect(() => {
    if (selectedQuestion && !latestAttempt) {
      setSecondsElapsed(0);
      setRevisionCount(0);
      setIsTimerRunning(true);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 0.5);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedQuestion?.question_id, latestAttempt]);

  // Track keystroke revisions
  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    setRevisionCount(prev => prev + 1);
  };

  const handleReasoningChange = (val: string) => {
    setReasoning(val);
    setRevisionCount(prev => prev + 1);
  };

  const handleQuestionSelect = (q: Question) => {
    setSelectedQuestion(q);
    setAnswer('');
    setReasoning('');
    setLatestAttempt(null);
    setError(null);
  };

  const handleSubmitAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedQuestion || !answer.trim()) return;

    setIsSubmitting(true);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);

    try {
      const payload: CreateAttemptPayload = {
        student_id: selectedStudentId,
        question_id: selectedQuestion.question_id,
        answer: answer.trim(),
        reasoning: reasoning.trim() || undefined,
        hesitation_seconds: parseFloat(secondsElapsed.toFixed(2)),
        revision_count: revisionCount,
      };

      const response = await api.createAttempt(payload);
      setLatestAttempt(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit attempt');
      setIsTimerRunning(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAttempt = () => {
    setAnswer('');
    setReasoning('');
    setLatestAttempt(null);
    setSecondsElapsed(0);
    setRevisionCount(0);
    setIsTimerRunning(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading Question Bank & Learner Roster..." size="lg" />;
  }

  if (error && !selectedQuestion) {
    return <ErrorState title="Practice Studio Unavailable" message={error} onRetry={loadInitialData} />;
  }

  const filteredQuestions = selectedSubject
    ? questions.filter(q => q.subject === selectedSubject)
    : questions;

  const difficultyVariant = {
    Easy: 'emerald',
    Medium: 'amber',
    Hard: 'rose',
  }[selectedQuestion?.difficulty || 'Easy'] as any;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Interactive Practice Studio
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Groq Diagnostic
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Submit answers with qualitative reasoning to trigger real-time AI misconception detection.
          </p>
        </div>

        {/* Live Telemetry Timer */}
        <TelemetryTimer
          seconds={secondsElapsed}
          revisions={revisionCount}
          isRunning={isTimerRunning && !latestAttempt}
        />
      </div>

      {/* Selectors Bar: Student Picker & Subject Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Student Selector */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Learner:</span>
          </label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} ({s.email}) — ID #{s.student_id}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Subject Domain:</span>
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Subjects ({questions.length} questions)</option>
            {subjects.map((sub) => (
              <option key={sub.subject} value={sub.subject}>
                {sub.subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question Picker List */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Question ({filteredQuestions.length})
            </span>
          </div>

          <div className="space-y-2">
            {filteredQuestions.map((q) => {
              const isSelected = selectedQuestion?.question_id === q.question_id;
              return (
                <div
                  key={q.question_id}
                  onClick={() => handleQuestionSelect(q)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-indigo-300">
                      {q.subject} • {q.topic}
                    </span>
                    <Badge variant={q.difficulty === 'Easy' ? 'emerald' : q.difficulty === 'Medium' ? 'amber' : 'rose'} size="sm">
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{q.question_text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right Column: Interactive Practice Card & Result */}
        <div className="lg:col-span-2 space-y-6">
          {selectedQuestion && (
            <div className="glass-panel rounded-2xl border border-slate-700/80 p-6 space-y-6">
              {/* Question Header Card */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedQuestion.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Topic: {selectedQuestion.topic}
                    </span>
                  </div>

                  <Badge variant={difficultyVariant} size="md">
                    Difficulty: {selectedQuestion.difficulty}
                  </Badge>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Question #{selectedQuestion.question_id}
                  </span>
                  <h3 className="text-base lg:text-lg font-extrabold text-white leading-relaxed">
                    {selectedQuestion.question_text}
                  </h3>
                </div>
              </div>

              {/* Practice Submission Form */}
              {!latestAttempt ? (
                <form onSubmit={handleSubmitAttempt} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Answer: <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={answer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="e.g. 10 or x = 4"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Your Reasoning & Steps (Analyzed by AI):
                      </label>
                      <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Triggers Cognitive Misconception Detection
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={reasoning}
                      onChange={(e) => handleReasoningChange(e.target.value)}
                      placeholder="Explain your step-by-step logic (e.g. 'I transposed 6 across the equals sign by adding it to 14...')"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !answer.trim()}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/25 active:scale-98 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Evaluating Reasoning with Groq AI...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Attempt & Run AI Analysis</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* The AI Misconception Showstopper Card */}
                  <AiMisconceptionCard attempt={latestAttempt} />

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={handleResetAttempt}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try This Question Again</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
