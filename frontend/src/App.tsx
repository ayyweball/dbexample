import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PracticeStudioPage } from './pages/PracticeStudioPage';
import { MisconceptionsPage } from './pages/MisconceptionsPage';
import { RemediationCenterPage } from './pages/RemediationCenterPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [practiceQuestionId, setPracticeQuestionId] = useState<number | undefined>(undefined);

  const handleNavigate = (tab: string, context?: any) => {
    if (tab === 'student-detail' && context?.studentId) {
      setSelectedStudentId(context.studentId);
    }
    if (tab === 'practice' && context?.questionId) {
      setPracticeQuestionId(context.questionId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    setActiveTab('student-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with Live API Health Indicator */}
      <Navbar activeTab={activeTab} onNavigate={handleNavigate} />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onNavigate={handleNavigate} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activeTab === 'practice' && <PracticeStudioPage initialQuestionId={practiceQuestionId} />}
          {activeTab === 'misconceptions' && <MisconceptionsPage onNavigate={handleNavigate} />}
          {activeTab === 'remediation' && <RemediationCenterPage />}
          {activeTab === 'questions' && <QuestionBankPage onNavigate={handleNavigate} />}
          {activeTab === 'students' && <StudentsPage onSelectStudent={handleSelectStudent} />}
          {activeTab === 'student-detail' && selectedStudentId && (
            <StudentDetailPage
              studentId={selectedStudentId}
              onBack={() => setActiveTab('students')}
              onNavigate={handleNavigate}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsPage />}
        </main>
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">Secure the Repo</span>
          <span>•</span>
          <span>Cognitive Diagnostic & Misconception Remediation</span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          Powered by Node.js, Express, MySQL & Groq API
        </div>
      </footer>
    </div>
  );
};

export default App;
