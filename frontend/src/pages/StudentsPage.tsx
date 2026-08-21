import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  User,
  Mail,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Student } from '../types/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { Modal } from '../components/common/Modal';

interface StudentsPageProps {
  onSelectStudent: (studentId: number) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents(searchQuery);
      setStudents(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load students from MySQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchQuery]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.createStudent({ name: name.trim(), email: email.trim() });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      loadStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && students.length === 0) {
    return <LoadingSpinner message="Loading student roster from MySQL..." size="lg" />;
  }

  if (error && students.length === 0) {
    return <ErrorState title="Student Roster Offline" message={error} onRetry={loadStudents} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Student Directory
            </h2>
            <Badge variant="indigo" size="md">
              {students.length} Learners
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Enrolled students and individual cognitive diagnostic progress.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or email..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 text-slate-500" />}
          title="No Students Found"
          description="No students matched your search query. Try searching with a different term."
          actionText="Register First Student"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {students.map((student) => (
            <div
              key={student.student_id}
              className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <Badge variant="slate" size="sm">
                    ID #{student.student_id}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-1">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>
                    Enrolled: {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onSelectStudent(student.student_id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-indigo-500/20"
                >
                  <span>View Diagnostic Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Student"
          subtitle="Add a student profile to the MySQL database."
        >
          <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Patel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address: <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300">
                {formError}
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
