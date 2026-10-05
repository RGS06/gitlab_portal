import React from 'react';
import { store } from '../../services/store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Users, 
  Video, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const students = store.profiles.filter((p) => p.role === 'student');
  const units = store.units;
  const attempts = store.attempts;
  const activeSession = store.examSessions[0];

  // 1. Video completion data per unit
  const videoData = units.slice(0, 6).map((u) => {
    const vid = u.videos?.[0]?.id;
    let completedCount = 0;
    if (vid) {
      students.forEach((s) => {
        if (store.getVideoProgress(s.id, vid)?.completed) {
          completedCount++;
        }
      });
    }
    return {
      unit: `Unit ${u.unit_number}`,
      completed: completedCount,
      target: students.length,
    };
  });

  // 2. Score distribution histogram data
  const scoreData = [
    { range: '0-10', count: 1 },
    { range: '11-20', count: 2 },
    { range: '21-30', count: 4 },
    { range: '31-40', count: 8 },
    { range: '41-50', count: 5 },
  ];

  const inProgressAttempts = attempts.filter((a) => a.status === 'in_progress').length;
  const flaggedAttempts = attempts.filter((a) => a.violations_count >= 2 || a.risk_level === 'High').length;
  const pendingReviews = attempts.filter((a) =>
    a.viva_answers?.some((va) => va.needs_manual_review)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-mono text-indigo-400 font-semibold">
            Institutional Oversight
          </span>
          <h2 className="text-xl font-bold mt-1">25CSAE370 — Administrative Control Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Realtime metrics across 3 Sections (A, B, C), 6 Operational Lab Batches, and Active Exam Floor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-700 font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime DB Engine Online
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Enrolled Students</span>
          <p className="text-2xl font-bold text-slate-900">{students.length}</p>
          <p className="text-[11px] text-slate-500">Across 6 operational batches</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-indigo-600 uppercase">Active Exam Starts</span>
          <p className="text-2xl font-bold text-indigo-800">{inProgressAttempts}</p>
          <p className="text-[11px] text-slate-500">Live proctored sessions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-red-600 uppercase">Proctor Flagged</span>
          <p className="text-2xl font-bold text-red-800">{flaggedAttempts}</p>
          <p className="text-[11px] text-slate-500">Risk rating Medium or High</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-amber-600 uppercase">Pending Viva Reviews</span>
          <p className="text-2xl font-bold text-amber-800">{pendingReviews}</p>
          <p className="text-[11px] text-slate-500">Low AI confidence flags</p>
        </div>
      </div>

      {/* Charts Section with Recharts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Completion Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-teal-600" />
              <span>Video Completion by Syllabus Unit</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Min 95% threshold</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={videoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} name="Students Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Total Continuous Evaluation (CIE) Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">50 Marks Scale</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Student Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
