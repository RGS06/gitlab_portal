import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { ExamSession, SessionStudent, Profile, RiskLevel } from '../../types';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  QrCode, 
  Play, 
  RotateCcw, 
  Plus, 
  Megaphone, 
  ShieldAlert, 
  Send,
  Filter,
  CheckSquare,
  Lock,
  ChevronDown
} from 'lucide-react';

export const ExamFloor: React.FC = () => {
  const [sessions, setSessions] = useState<ExamSession[]>(store.examSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(store.examSessions[0]?.id || '');
  const [sessionStudents, setSessionStudents] = useState<SessionStudent[]>(store.sessionStudents);
  const [profiles, setProfiles] = useState<Profile[]>(store.profiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [quickRollInput, setQuickRollInput] = useState('');
  const [quickRollFeedback, setQuickRollFeedback] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [labModalStudent, setLabModalStudent] = useState<Profile | null>(null);
  const [labMarks, setLabMarks] = useState<number>(28);
  const [labRemarks, setLabRemarks] = useState<string>('Code executed successfully');

  useEffect(() => {
    return store.subscribe(() => {
      setSessions([...store.examSessions]);
      setSessionStudents([...store.sessionStudents]);
      setProfiles([...store.profiles]);
    });
  }, []);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Roster entries for this active session
  const roster = sessionStudents
    .filter((ss) => ss.session_id === activeSession?.id)
    .map((ss) => {
      const student = profiles.find((p) => p.id === ss.student_id);
      const sec = store.sections.find((s) => s.id === student?.section_id);
      const bat = store.batches.find((b) => b.id === student?.batch_id);

      // Calculate video watch %
      const published = store.units.filter((u) => u.published);
      const completedVids = published.filter((u) => {
        const vid = u.videos?.[0]?.id;
        return vid && store.getVideoProgress(ss.student_id, vid)?.completed;
      }).length;
      const videoPercent = published.length > 0 ? Math.round((completedVids / published.length) * 100) : 0;

      // Find attempt status
      const quizAttempt = store.attempts.find((a) => a.session_id === activeSession.id && a.student_id === ss.student_id && a.part_type === 'quiz');
      const vivaAttempt = store.attempts.find((a) => a.session_id === activeSession.id && a.student_id === ss.student_id && a.part_type === 'viva');

      let quizState = 'Locked';
      if (quizAttempt?.status === 'submitted') quizState = 'Submitted';
      else if (quizAttempt?.status === 'in_progress') quizState = 'In Progress';
      else if (ss.quiz_open) quizState = 'Open';

      let vivaState = 'Locked';
      if (vivaAttempt?.status === 'submitted') vivaState = 'Submitted';
      else if (vivaAttempt?.status === 'in_progress') vivaState = 'In Progress';
      else if (ss.viva_open) vivaState = 'Open';

      const violations = (quizAttempt?.violations_count || 0) + (vivaAttempt?.violations_count || 0);
      const risk: RiskLevel = quizAttempt?.risk_level || vivaAttempt?.risk_level || 'Low';

      return {
        ss,
        student,
        secCode: sec?.section_code || '-',
        batCode: bat?.batch_code || 'Unassigned',
        videoPercent,
        quizState,
        vivaState,
        quizAttempt,
        vivaAttempt,
        violations,
        risk,
      };
    });

  // Filters
  const filteredRoster = roster.filter((r) => {
    if (!r.student) return false;
    const matchesSearch =
      r.student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (sectionFilter !== 'all' && r.secCode !== sectionFilter) return false;
    if (batchFilter !== 'all' && r.batCode !== batchFilter) return false;

    if (statusFilter === 'lab_pending' && r.ss.lab_status !== 'pending') return false;
    if (statusFilter === 'lab_completed' && r.ss.lab_status !== 'completed') return false;
    if (statusFilter === 'in_progress' && r.quizState !== 'In Progress' && r.vivaState !== 'In Progress') return false;
    if (statusFilter === 'submitted' && r.quizState !== 'Submitted' && r.vivaState !== 'Submitted') return false;
    if (statusFilter === 'flagged' && r.violations === 0 && r.risk === 'Low') return false;

    return true;
  });

  // Counters
  const totalCount = roster.length;
  const labDoneCount = roster.filter((r) => r.ss.lab_status === 'completed').length;
  const quizOpenCount = roster.filter((r) => r.ss.quiz_open).length;
  const inProgressCount = roster.filter((r) => r.quizState === 'In Progress' || r.vivaState === 'In Progress').length;
  const submittedCount = roster.filter((r) => r.quizState === 'Submitted' || r.vivaState === 'Submitted').length;
  const flaggedCount = roster.filter((r) => r.violations > 0 || r.risk === 'High').length;

  // Roll Number Quick Entry Handler
  const handleQuickRollEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRollInput.trim()) return;
    const match = roster.find(
      (r) => r.student?.roll_number.toUpperCase() === quickRollInput.trim().toUpperCase()
    );

    if (match && match.student) {
      setLabModalStudent(match.student);
      setQuickRollFeedback(`Found student: ${match.student.full_name} (${match.batCode})`);
      setQuickRollInput('');
    } else {
      setQuickRollFeedback(`No student found with roll number "${quickRollInput}" in active session.`);
      setTimeout(() => setQuickRollFeedback(null), 4000);
    }
  };

  const handleBulkAction = (action: 'lab' | 'open_both' | 'open_quiz' | 'open_viva' | 'extend_time') => {
    if (selectedStudentIds.length === 0) {
      alert('Please select one or more students using checkboxes.');
      return;
    }

    if (action === 'lab') {
      store.markLabComplete(activeSession.id, selectedStudentIds, 28, 'Verified on floor');
    } else if (action === 'open_both') {
      store.openExam(activeSession.id, 'student', selectedStudentIds, 'both');
    } else if (action === 'open_quiz') {
      store.openExam(activeSession.id, 'student', selectedStudentIds, 'quiz');
    } else if (action === 'open_viva') {
      store.openExam(activeSession.id, 'student', selectedStudentIds, 'viva');
    } else if (action === 'extend_time') {
      store.extendTime(activeSession.id, selectedStudentIds, 5);
    }
    setSelectedStudentIds([]);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    store.announcements.unshift({
      id: 'ann-' + Math.random().toString(36).substring(2, 9),
      title: `[Exam Floor Broadcast] ${store.currentProfile.full_name}`,
      content: broadcastMessage,
      target_type: 'session',
      target_id: activeSession.id,
      created_by: store.currentProfile.id,
      created_at: new Date().toISOString(),
    });
    store.logAudit('FACULTY_BROADCAST', 'exam_session', activeSession.id, { message: broadcastMessage });
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Session Title & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Faculty Exam Floor</span>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Session Status: {activeSession?.status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{activeSession?.name}</h2>
          <p className="text-xs text-slate-500">
            Target Batches: {activeSession?.target_batch_ids.map((id) => store.batches.find((b) => b.id === id)?.batch_code).join(', ')} • Auto-Open on Lab Done: {activeSession?.auto_open_when_lab_done ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Faculty Broadcast Button */}
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600" />
            <span>Send Floor Broadcast</span>
          </button>

          {/* Quick QR Check-in Simulation */}
          <button
            type="button"
            onClick={() => {
              const pendingStudent = roster.find((r) => r.ss.lab_status === 'pending');
              if (pendingStudent && pendingStudent.student) {
                setLabModalStudent(pendingStudent.student);
              } else {
                alert('All registered students already have completed lab status.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>QR Assistant Check-in</span>
          </button>
        </div>
      </div>

      {/* Realtime Counters Strip (Section 45) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Students</span>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 uppercase">Lab Done</span>
          <p className="text-2xl font-bold text-teal-800 mt-0.5">{labDoneCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase">Quiz / Viva Open</span>
          <p className="text-2xl font-bold text-indigo-800 mt-0.5">{quizOpenCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase">In Progress</span>
          <p className="text-2xl font-bold text-blue-800 mt-0.5">{inProgressCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Submitted</span>
          <p className="text-2xl font-bold text-emerald-800 mt-0.5">{submittedCount}</p>
        </div>
        <div className={`p-3.5 rounded-xl border shadow-xs ${flaggedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <span className="text-[11px] font-semibold text-red-600 uppercase">Flagged / Alerts</span>
          <p className="text-2xl font-bold text-red-800 mt-0.5">{flaggedCount}</p>
        </div>
      </div>

      {/* Roster Controls: Search, Quick Roll Entry, Section/Batch Filter, Bulk Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Roll Number Quick Entry */}
          <form onSubmit={handleQuickRollEntry} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickRollInput}
                onChange={(e) => setQuickRollInput(e.target.value)}
                placeholder="Roll No Quick Entry (e.g. 4MW25CS002)..."
                className="w-full text-xs font-mono px-3 py-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Verify Lab
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setBatchFilter('all');
              }}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
            >
              <option value="all">All Batches</option>
              {sectionFilter === 'A' || sectionFilter === 'all' ? (
                <>
                  <option value="A1">Batch A1</option>
                  <option value="A2">Batch A2</option>
                </>
              ) : null}
              {sectionFilter === 'B' || sectionFilter === 'all' ? (
                <>
                  <option value="B1">Batch B1</option>
                  <option value="B2">Batch B2</option>
                </>
              ) : null}
              {sectionFilter === 'C' || sectionFilter === 'all' ? (
                <>
                  <option value="C1">Batch C1</option>
                  <option value="C2">Batch C2</option>
                </>
              ) : null}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="lab_pending">Lab Pending</option>
              <option value="lab_completed">Lab Completed</option>
              <option value="in_progress">Exam In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="flagged">Flagged / High Risk</option>
            </select>
          </div>
        </div>

        {quickRollFeedback && (
          <div className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 p-2 rounded-lg">
            {quickRollFeedback}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-indigo-50/80 border border-indigo-200 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-semibold text-indigo-900">
              {selectedStudentIds.length} students selected for bulk actions:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleBulkAction('lab')}
                className="px-2.5 py-1 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700"
              >
                Mark Lab Complete
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('open_both')}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
              >
                Open Quiz & Viva
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('open_quiz')}
                className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
              >
                Open Quiz Only
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('extend_time')}
                className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
              >
                +5 Mins Extra Time
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Floor Roster Table (Section 44 Columns) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length === filteredRoster.length && filteredRoster.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(filteredRoster.map((r) => r.ss.student_id));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Sec / Batch</th>
                <th className="p-3">Videos %</th>
                <th className="p-3">Lab Status</th>
                <th className="p-3">Quiz State</th>
                <th className="p-3">Viva State</th>
                <th className="p-3">Time Left</th>
                <th className="p-3">Violations</th>
                <th className="p-3">Risk</th>
                <th className="p-3 text-right">Floor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map((r) => {
                const isSelected = selectedStudentIds.includes(r.ss.student_id);
                const isFlagged = r.violations >= 2 || r.risk === 'High';

                return (
                  <tr
                    key={r.ss.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isFlagged ? 'bg-red-50/30' : isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, r.ss.student_id]);
                          else setSelectedStudentIds(selectedStudentIds.filter((id) => id !== r.ss.student_id));
                        }}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{r.student?.roll_number}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.student?.full_name}</td>
                    <td className="p-3">
                      <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {r.secCode}-{r.batCode}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={r.videoPercent >= 95 ? 'text-teal-700 font-bold' : 'text-amber-700'}>
                        {r.videoPercent}%
                      </span>
                    </td>
                    <td className="p-3">
                      {r.ss.lab_status === 'completed' ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Done ({r.ss.lab_marks || 28}/30)
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.quizState === 'Submitted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.quizState === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : r.quizState === 'Open'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.quizState}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.vivaState === 'Submitted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.vivaState === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : r.vivaState === 'Open'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.vivaState}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {r.quizAttempt?.status === 'in_progress' ? '18:32' : '--:--'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-mono font-bold ${
                          r.violations >= 2 ? 'text-red-600' : r.violations > 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {r.violations}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.risk === 'High'
                            ? 'bg-red-100 text-red-800'
                            : r.risk === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.risk}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.ss.lab_status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setLabModalStudent(r.student || null)}
                            className="px-2 py-1 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold border border-teal-200 transition"
                          >
                            Mark Lab
                          </button>
                        )}
                        {!r.ss.quiz_open && (
                          <button
                            type="button"
                            onClick={() => store.openExam(activeSession.id, 'student', [r.ss.student_id], 'both')}
                            className="px-2 py-1 rounded bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-semibold border border-indigo-200 transition"
                          >
                            Open Exam
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => store.extendTime(activeSession.id, [r.ss.student_id], 5)}
                          className="px-2 py-1 rounded bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium border border-slate-200 transition"
                          title="Add 5 minutes"
                        >
                          +5m
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lab Verification Modal */}
      {labModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Verify Lab Execution</h3>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><span className="font-semibold text-slate-700">Roll Number:</span> <span className="font-mono">{labModalStudent.roll_number}</span></p>
              <p><span className="font-semibold text-slate-700">Student Name:</span> {labModalStudent.full_name}</p>
              <p><span className="font-semibold text-slate-700">Target Session:</span> {activeSession.name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lab Execution Marks (out of 30):
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={labMarks}
                onChange={(e) => setLabMarks(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Remarks:
              </label>
              <textarea
                value={labRemarks}
                onChange={(e) => setLabRemarks(e.target.value)}
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="p-2.5 rounded bg-teal-50 border border-teal-200 text-xs text-teal-800">
              {activeSession.auto_open_when_lab_done
                ? '⚡ Auto-Open is enabled: Quiz & Viva will unlock immediately for this student.'
                : 'Auto-Open is disabled: You will manually open the quiz when ready.'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLabModalStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  store.markLabComplete(activeSession.id, [labModalStudent.id], labMarks, labRemarks);
                  setLabModalStudent(null);
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition"
              >
                Confirm Lab Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal (Section 47) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleBroadcast} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Broadcast Floor Announcement</h3>
            </div>
            <p className="text-xs text-slate-500">
              This message will display in real time as a non-blocking announcement banner to all students currently taking the exam.
            </p>
            <textarea
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Please note: 10 minutes remaining for Section A. Ensure all answers are saved."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Now</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
