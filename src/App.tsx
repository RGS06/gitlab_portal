import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './features/auth/StudentDashboard';
import { LearningPath } from './features/learning/LearningPath';
import { StudentExamPortal } from './features/exam/StudentExamPortal';
import { PracticeMode } from './features/auth/PracticeMode';
import { StudentResults } from './features/results/StudentResults';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ExamFloor } from './features/exam/ExamFloor';
import { ExamSessionsManagement } from './features/admin/ExamSessionsManagement';
import { StudentsManagement } from './features/admin/StudentsManagement';
import { AdminLearningManagement } from './features/admin/AdminLearningManagement';
import { QuestionBankManagement } from './features/admin/QuestionBankManagement';
import { ResultsAndMarksControl } from './features/results/ResultsAndMarksControl';
import { ProctoringReview } from './features/admin/ProctoringReview';
import { ExportsAndPrintables } from './features/admin/ExportsAndPrintables';
import { AuditLogViewer } from './features/admin/AuditLogViewer';

import { Profile } from './types';
import { LoginPage } from './features/auth/LoginPage';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile>(store.currentProfile);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(store.isLoggedIn);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return store.currentProfile.role === 'student' ? 'student-dashboard' : 'exam-floor';
  });

  useEffect(() => {
    return store.subscribe(() => {
      setProfile(store.currentProfile);
      setIsLoggedIn(store.isLoggedIn);
      if (store.currentProfile.role === 'student' && !activeTab.startsWith('student')) {
        setActiveTab('student-dashboard');
      } else if (store.currentProfile.role !== 'student' && activeTab.startsWith('student')) {
        setActiveTab('exam-floor');
      }
    });
  }, [activeTab]);

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setActiveTab(store.currentProfile.role === 'student' ? 'student-dashboard' : 'exam-floor');
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      // Student Tabs
      case 'student-dashboard':
        return <StudentDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'student-learning':
        return <LearningPath />;
      case 'student-exam':
        return <StudentExamPortal />;
      case 'student-practice':
        return <PracticeMode />;
      case 'student-results':
        return <StudentResults />;

      // Faculty / Admin Tabs
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'exam-floor':
        return <ExamFloor />;
      case 'exam-sessions':
        return <ExamSessionsManagement />;
      case 'students-roster':
        return <StudentsManagement />;
      case 'admin-learning':
        return <AdminLearningManagement />;
      case 'mcq-bank':
        return <QuestionBankManagement />;
      case 'viva-bank':
        return <QuestionBankManagement />;
      case 'marks-control':
        return <ResultsAndMarksControl />;
      case 'proctoring-review':
        return <ProctoringReview />;
      case 'exports':
        return <ExportsAndPrintables />;
      case 'audit-logs':
        return <AuditLogViewer />;

      default:
        return profile.role === 'student' ? <StudentDashboard onNavigate={setActiveTab} /> : <ExamFloor />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar currentTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
