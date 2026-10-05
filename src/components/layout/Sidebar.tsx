import React from 'react';
import { store } from '../../services/store';
import { 
  LayoutDashboard, 
  Video, 
  CheckSquare, 
  PlayCircle, 
  Award, 
  Users, 
  Layers, 
  FileQuestion, 
  HelpCircle, 
  ShieldAlert, 
  Lock, 
  Megaphone, 
  Download, 
  FileText, 
  FileSpreadsheet,
  History,
  MonitorCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const profile = store.currentProfile;
  const isFacultyOrAdmin = profile.role === 'faculty' || profile.role === 'admin';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* STUDENT NAVIGATION */}
        {!isFacultyOrAdmin && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Student Learning & Exam
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectTab('student-dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'student-dashboard'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>My Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('student-learning')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'student-learning'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-teal-500" />
                <span>Learning Path (12 Units)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('student-exam')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'student-exam'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>Lab Exam / Assessment</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('student-practice')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'student-practice'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlayCircle className="w-4 h-4 text-blue-500" />
                <span>Practice Mode (Untimed)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('student-results')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'student-results'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-500" />
                <span>Results & Certificate</span>
              </button>
            </nav>
          </div>
        )}

        {/* FACULTY & ADMIN NAVIGATION */}
        {isFacultyOrAdmin && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Faculty / Admin Console
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectTab('admin-dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'admin-dashboard'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Console Dashboard</span>
              </button>

              {/* LIVE EXAM FLOOR */}
              <button
                type="button"
                onClick={() => onSelectTab('exam-floor')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'exam-floor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 bg-indigo-50/60 hover:bg-indigo-100 hover:text-indigo-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MonitorCheck className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold">Live Exam Floor</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('exam-sessions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'exam-sessions'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>Exam Sessions</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('students-roster')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'students-roster'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Students & Batches</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('admin-learning')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'admin-learning'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-teal-500" />
                <span>Learning Units (12)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('mcq-bank')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'mcq-bank'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileQuestion className="w-4 h-4 text-indigo-500" />
                <span>MCQ Question Bank</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('viva-bank')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'viva-bank'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Viva Bank & Rubrics</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('marks-control')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'marks-control'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Marks Freeze & Release</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('exports')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'exports'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Marks Excel Export</span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded">XLSX</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('admin-announcements')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'admin-announcements'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Broadcasts & Alerts</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('audit-logs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === 'audit-logs'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>Security Audit Log</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Course Footnote */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-700">Course 25CSAE370</p>
        <p>AEC • 01 Credit • SMVITM</p>
      </div>
    </aside>
  );
};
