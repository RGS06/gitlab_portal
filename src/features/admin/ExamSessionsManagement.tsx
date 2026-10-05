import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { ExamSession, Batch } from '../../types';
import { 
  CheckSquare, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  ShieldCheck, 
  Settings,
  Calendar
} from 'lucide-react';

export const ExamSessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>(store.examSessions);
  const [batches, setBatches] = useState<Batch[]>(store.batches);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New session form
  const [name, setName] = useState('Lab CIE Practical Examination');
  const [date, setDate] = useState('2026-10-04');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(['batch-a1', 'batch-a2']);
  const [quizDuration, setQuizDuration] = useState(20);
  const [mcqCount, setMcqCount] = useState(12);
  const [vivaCount, setVivaCount] = useState(5);
  const [videoGateMode, setVideoGateMode] = useState<'strict' | 'warn_only' | 'off'>('strict');
  const [partOrder, setPartOrder] = useState<'quiz_then_viva' | 'viva_then_quiz' | 'both_tabs'>('quiz_then_viva');
  const [autoOpen, setAutoOpen] = useState(true);

  useEffect(() => {
    return store.subscribe(() => {
      setSessions([...store.examSessions]);
      setBatches([...store.batches]);
    });
  }, []);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatchIds.length === 0) {
      alert('Please select at least one operational lab batch.');
      return;
    }

    const newSess: ExamSession = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      name,
      date,
      status: 'draft',
      video_gate_mode: videoGateMode,
      part_order: partOrder,
      quiz_duration_seconds: quizDuration * 60,
      number_of_mcqs: mcqCount,
      number_of_viva_questions: vivaCount,
      proctoring_settings: { webcam: false, fullscreen: true, anti_cheat: true },
      violation_threshold: 3,
      auto_open_when_lab_done: autoOpen,
      close_grace_seconds: 120,
      created_by: store.currentProfile.id,
      target_batch_ids: selectedBatchIds,
      created_at: new Date().toISOString(),
    };

    store.examSessions.push(newSess);

    // Enroll students from selected batches
    const enrolledStudents = store.profiles.filter((p) => p.role === 'student' && selectedBatchIds.includes(p.batch_id || ''));
    enrolledStudents.forEach((stud) => {
      store.sessionStudents.push({
        id: 'ss-' + Math.random().toString(36).substring(2, 9),
        session_id: newSess.id,
        student_id: stud.id,
        section_id_snapshot: stud.section_id || undefined,
        batch_id_snapshot: stud.batch_id || undefined,
        lab_status: 'pending',
        quiz_open: false,
        viva_open: false,
        extra_time_seconds: 0,
        retake_allowed: false,
        marks_state: 'draft',
      });
    });

    store.logAudit('CREATE_EXAM_SESSION', 'exam_session', newSess.id, {
      name,
      batches: selectedBatchIds,
      enrolled_count: enrolledStudents.length,
    });

    store.notify();
    setShowCreateModal(false);
  };

  const handleStatusChange = (sessionId: string, newStatus: 'draft' | 'lab_in_progress' | 'active' | 'paused' | 'closed') => {
    store.updateSessionStatus(sessionId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Exam Floor Scheduling
            </span>
            <span className="text-xs text-slate-500 font-mono">Faculty-Controlled Life Cycle</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Exam Sessions Management</h2>
          <p className="text-xs text-slate-500">
            Define multi-batch targeted sessions, configure video gates, quiz durations, and transition session states.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam Session</span>
        </button>
      </div>

      {/* Session Cards */}
      <div className="grid gap-4">
        {sessions.map((s) => {
          const targetBatches = s.target_batch_ids
            .map((bid) => batches.find((b) => b.id === bid)?.batch_code)
            .join(', ');

          const enrolledCount = store.sessionStudents.filter((item) => item.session_id === s.id).length;

          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{s.name}</span>
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        s.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'lab_in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : s.status === 'paused'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date: {s.date} • Target Batches: <span className="font-mono font-bold text-slate-800">{targetBatches}</span> • Enrolled: {enrolledCount} students
                  </p>
                </div>

                {/* State Machine Action Controls (Section 19 & 24) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {s.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.id, 'lab_in_progress')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Start Session (Lab In Progress)
                    </button>
                  )}
                  {s.status === 'lab_in_progress' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.id, 'active')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      Open Assessments (Active)
                    </button>
                  )}
                  {s.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.id, 'paused')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
                    >
                      Pause Session
                    </button>
                  )}
                  {s.status === 'paused' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(s.id, 'active')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      Resume Session
                    </button>
                  )}
                  {s.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Close session? This will auto-submit all active attempts.')) {
                          handleStatusChange(s.id, 'closed');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                    >
                      Close Session
                    </button>
                  )}
                </div>
              </div>

              {/* Policy Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Video Gate Mode</span>
                  <p className="font-bold text-slate-800 font-mono mt-0.5 uppercase">{s.video_gate_mode}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Part Order</span>
                  <p className="font-bold text-slate-800 font-mono mt-0.5">{s.part_order.replace(/_/g, ' → ')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">MCQ Quiz Timer</span>
                  <p className="font-bold text-slate-800 font-mono mt-0.5">{Math.round(s.quiz_duration_seconds / 60)} mins ({s.number_of_mcqs} Qs)</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Auto-Open on Lab Done</span>
                  <p className="font-bold text-teal-700 font-mono mt-0.5">{s.auto_open_when_lab_done ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateSession} className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Create Exam Session</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Operational Batches:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {batches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBatchIds.includes(b.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedBatchIds([...selectedBatchIds, b.id]);
                        else setSelectedBatchIds(selectedBatchIds.filter((id) => id !== b.id));
                      }}
                      className="rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-800">Batch {b.batch_code}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Duration (mins):</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Video Gate Mode:</label>
                <select
                  value={videoGateMode}
                  onChange={(e) => setVideoGateMode(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="strict">Strict (All 6 videos required)</option>
                  <option value="warn_only">Warn Only</option>
                  <option value="off">Off</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={autoOpen}
                onChange={(e) => setAutoOpen(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="text-slate-800 font-medium">
                Auto-open Quiz & Viva for late finishers when faculty marks their lab completed
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
              >
                Create Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
