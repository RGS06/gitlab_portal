import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { SessionStudent, Profile, MarksState, Attempt } from '../../types';
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Eye, 
  ShieldAlert, 
  Sparkles, 
  Edit3, 
  FileText,
  Filter
} from 'lucide-react';

export const ResultsAndMarksControl: React.FC = () => {
  const [sessionStudents, setSessionStudents] = useState<SessionStudent[]>(store.sessionStudents);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{
    ss: SessionStudent;
    student: Profile;
    quizAttempt?: Attempt;
    vivaAttempt?: Attempt;
  } | null>(null);

  const [overrideMarks, setOverrideMarks] = useState<number>(8);
  const [overrideReason, setOverrideReason] = useState<string>('Technical clarity verified in viva discussion');
  const [overrideQuestionId, setOverrideQuestionId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');

  useEffect(() => {
    return store.subscribe(() => {
      setSessionStudents([...store.sessionStudents]);
    });
  }, []);

  const activeSession = store.examSessions[0];

  const resultsList = sessionStudents
    .filter((ss) => ss.session_id === activeSession?.id)
    .map((ss) => {
      const student = store.profiles.find((p) => p.id === ss.student_id);
      const bat = store.batches.find((b) => b.id === student?.batch_id);
      const quizAtt = store.attempts.find((a) => a.student_id === ss.student_id && a.part_type === 'quiz');
      const vivaAtt = store.attempts.find((a) => a.student_id === ss.student_id && a.part_type === 'viva');

      const lab = ss.lab_marks || 0;
      const quiz = quizAtt?.score || 0;
      const viva = vivaAtt?.score || 0;
      const scaledQuiz = Math.round((quiz / 12) * 10 * 10) / 10;
      const scaledViva = Math.round((viva / 50) * 10 * 10) / 10;
      const total = Math.round((lab + scaledQuiz + scaledViva) * 10) / 10;

      return {
        ss,
        student,
        batCode: bat?.batch_code || 'Unassigned',
        quizAtt,
        vivaAtt,
        lab,
        quiz,
        viva,
        total,
        marksState: ss.marks_state,
        violations: (quizAtt?.violations_count || 0) + (vivaAtt?.violations_count || 0),
        risk: quizAtt?.risk_level || vivaAtt?.risk_level || 'Low',
      };
    });

  const filtered = resultsList.filter((r) => {
    if (!r.student) return false;
    const matchesSearch =
      r.student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (batchFilter !== 'all' && r.batCode !== batchFilter) return false;
    return true;
  });

  const handleStateChangeAll = (newState: MarksState) => {
    if (confirm(`Are you sure you wish to transition marks for ALL students in this session to "${newState.toUpperCase()}"?`)) {
      store.releaseMarks(activeSession.id, 'all', [], newState);
    }
  };

  const handleStateChangeSingle = (studentId: string, newState: MarksState) => {
    store.releaseMarks(activeSession.id, 'student', [studentId], newState);
  };

  const handleSaveOverride = () => {
    if (!selectedStudentDetail?.vivaAttempt || !overrideQuestionId) return;
    store.overrideVivaMarks(selectedStudentDetail.vivaAttempt.id, overrideQuestionId, overrideMarks, overrideReason);
    alert('Faculty Viva marks override recorded in security audit log.');
    setSelectedStudentDetail(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Marks Release Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Marks & Release Center
            </span>
            <span className="text-xs text-slate-500 font-mono">Academic Flow: Draft → Frozen → Released</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{activeSession?.name}</h2>
          <p className="text-xs text-slate-500">
            Students only see question breakdowns, scores, and certificates once marks are formally in the Released state.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleStateChangeAll('frozen')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Freeze All Marks</span>
          </button>

          <button
            type="button"
            onClick={() => handleStateChangeAll('released')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Release Marks to Students</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
        >
          <option value="all">All Operational Batches</option>
          <option value="A1">Batch A1</option>
          <option value="A2">Batch A2</option>
          <option value="B1">Batch B1</option>
          <option value="B2">Batch B2</option>
          <option value="C1">Batch C1</option>
          <option value="C2">Batch C2</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Lab (30)</th>
                <th className="p-3">Quiz (12)</th>
                <th className="p-3">Viva (50)</th>
                <th className="p-3">Scaled CIE (50)</th>
                <th className="p-3">Integrity / Risk</th>
                <th className="p-3">Marks State</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.ss.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{r.student?.roll_number}</td>
                  <td className="p-3 font-semibold text-slate-800">{r.student?.full_name}</td>
                  <td className="p-3 font-mono text-slate-600">{r.batCode}</td>
                  <td className="p-3 font-mono font-semibold text-teal-700">{r.lab}</td>
                  <td className="p-3 font-mono font-semibold text-indigo-700">{r.quiz}</td>
                  <td className="p-3 font-mono font-semibold text-amber-700">{r.viva}</td>
                  <td className="p-3 font-mono font-bold text-emerald-800 text-sm">{r.total} / 50</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.risk === 'High'
                          ? 'bg-red-100 text-red-800'
                          : r.risk === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {r.risk} ({r.violations} viol.)
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        r.marksState === 'released'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.marksState === 'frozen'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {r.marksState}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStudentDetail({
                            ss: r.ss,
                            student: r.student!,
                            quizAttempt: r.quizAtt,
                            vivaAttempt: r.vivaAtt,
                          })
                        }
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {r.marksState !== 'released' ? (
                        <button
                          type="button"
                          onClick={() => handleStateChangeSingle(r.ss.student_id, 'released')}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold border border-emerald-200 transition"
                        >
                          Release
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStateChangeSingle(r.ss.student_id, 'frozen')}
                          className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold border border-amber-200 transition"
                        >
                          Freeze
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Inspection & Viva Override Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assessment Audit: {selectedStudentDetail.student.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Roll No: {selectedStudentDetail.student.roll_number} • State: {selectedStudentDetail.ss.marks_state.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Viva Voce Inspection & Override */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Viva Voce Evaluation & Manual Override</span>
              </h4>

              {selectedStudentDetail.vivaAttempt?.viva_answers?.length ? (
                selectedStudentDetail.vivaAttempt.viva_answers.map((va, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Question {idx + 1}</span>
                      <span className="font-mono text-amber-700">{va.final_marks || va.ai_marks || 8} / 10 Marks</span>
                    </div>
                    <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-100">
                      "{va.student_answer || 'No response recorded'}"
                    </p>
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold">AI Feedback:</span> {va.ai_feedback || 'Matches required key concepts'}
                    </div>

                    {/* Faculty Override Controls */}
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOverrideQuestionId(va.question_id);
                          setOverrideMarks(va.final_marks || 8);
                        }}
                        className="text-[11px] font-semibold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Override AI Mark</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No Viva submission yet recorded.</p>
              )}

              {overrideQuestionId && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3 text-xs">
                  <h5 className="font-bold text-indigo-950">Record Faculty Viva Mark Override</h5>
                  <div className="flex items-center gap-3">
                    <label className="font-medium text-slate-700">New Score (0-10):</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={overrideMarks}
                      onChange={(e) => setOverrideMarks(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Mandatory Override Reason:</label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Oral clarification given on git merge vs rebase"
                      className="w-full px-2 py-1 border border-slate-300 rounded"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOverrideQuestionId('')}
                      className="px-2.5 py-1 text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOverride}
                      className="px-3 py-1 bg-indigo-600 text-white rounded font-bold text-xs hover:bg-indigo-700"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
