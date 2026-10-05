import React from 'react';
import { store } from '../../services/store';
import { 
  GraduationCap, 
  Video, 
  CheckSquare, 
  Clock, 
  Award, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const student = store.currentProfile;
  const units = store.units;
  const publishedUnits = units.filter((u) => u.published);
  const activeSession = store.examSessions[0];
  const ss = store.sessionStudents.find((s) => s.student_id === student.id && s.session_id === activeSession?.id);

  const completedCount = publishedUnits.filter((u) => {
    const vid = u.videos?.[0]?.id;
    return vid && store.getVideoProgress(student.id, vid)?.completed;
  }).length;

  const percent = publishedUnits.length > 0 ? Math.round((completedCount / publishedUnits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-mono font-bold text-teal-400">
            Student Academic Dashboard
          </span>
          <h2 className="text-2xl font-bold mt-1">Welcome, {student.full_name}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Roll No: <span className="font-mono font-semibold">{student.roll_number}</span> • Course: 25CSAE370 (Project Management with Git) • SMVITM
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('student-learning')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 transition shadow-xs cursor-pointer shrink-0"
        >
          <Video className="w-4 h-4" />
          <span>Resume Video Learning</span>
        </button>
      </div>

      {/* Progress & Exam Stage Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Video Learning Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-teal-600" />
              <span>Self-Learning Progress</span>
            </h3>
            <span className="text-xs font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {completedCount} / {publishedUnits.length} Units Done
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Overall Completion</span>
              <span className="text-teal-700 font-mono">{percent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400">
              Videos must be watched to 95% completion to satisfy the exam video gate requirement.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('student-learning')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View 12 Units Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Exam Session Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Active Exam Session</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                {activeSession?.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800">{activeSession?.name}</p>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Lab Execution:</span>{' '}
                {ss?.lab_status === 'completed' ? (
                  <span className="text-emerald-700 font-bold">Verified ({ss.lab_marks}/30)</span>
                ) : (
                  <span className="text-amber-700 font-medium">Pending Faculty Confirmation</span>
                )}
              </p>
              <p>
                <span className="font-semibold text-slate-700">MCQ & Viva Status:</span>{' '}
                {ss?.quiz_open ? (
                  <span className="text-indigo-700 font-bold">Unlocked for Attempt</span>
                ) : (
                  <span className="text-slate-500">Locked until lab verified</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('student-exam')}
            className="w-full py-2.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Proceed to Examination Floor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
