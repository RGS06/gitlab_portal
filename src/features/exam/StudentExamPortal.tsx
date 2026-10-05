import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { ExamSession, SessionStudent, Attempt } from '../../types';
import { QuizArena } from '../quiz/QuizArena';
import { VivaArena } from '../viva/VivaArena';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  Play, 
  ShieldCheck, 
  Maximize, 
  AlertCircle, 
  Monitor, 
  FileCheck,
  Award,
  Video
} from 'lucide-react';

export const StudentExamPortal: React.FC = () => {
  const student = store.currentProfile;
  const [sessions, setSessions] = useState<ExamSession[]>(store.examSessions);
  const [sessionStudents, setSessionStudents] = useState<SessionStudent[]>(store.sessionStudents);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [safeQuestions, setSafeQuestions] = useState<any[]>([]);
  const [activeArena, setActiveArena] = useState<'quiz' | 'viva' | null>(null);
  const [preCheckModal, setPreCheckModal] = useState<'quiz' | 'viva' | null>(null);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [cameraChecked, setCameraChecked] = useState(false);
  const [fullscreenChecked, setFullscreenChecked] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setSessions([...store.examSessions]);
      setSessionStudents([...store.sessionStudents]);
    });
  }, []);

  const studentBatId = student.batch_id;
  const activeSession = sessions.find((s) => s.target_batch_ids.includes(studentBatId || '')) || sessions[0];
  const ss = sessionStudents.find((s) => s.session_id === activeSession?.id && s.student_id === student.id);

  // Video completion check
  const publishedUnits = store.units.filter((u) => u.published);
  const completedVids = publishedUnits.filter((u) => {
    const vid = u.videos?.[0]?.id;
    return vid && store.getVideoProgress(student.id, vid)?.completed;
  }).length;
  const videosCompleted = completedVids >= publishedUnits.length;

  const handleStartExam = (partType: 'quiz' | 'viva') => {
    // Request fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const deviceId = 'dev-sess-' + Math.random().toString(36).substring(2, 9);
    const result = store.startAttempt(activeSession.id, partType, deviceId);

    if (result.success && result.attempt && result.safeQuestions) {
      setActiveAttempt(result.attempt);
      setSafeQuestions(result.safeQuestions);
      setActiveArena(partType);
      setPreCheckModal(null);
    } else {
      alert(result.error || 'Unable to launch assessment.');
    }
  };

  if (activeArena === 'quiz' && activeAttempt) {
    return (
      <QuizArena
        attempt={activeAttempt}
        questions={safeQuestions}
        onFinish={(receipt) => {
          setActiveArena(null);
          setActiveAttempt(null);
          setSubmissionReceipt(receipt);
        }}
      />
    );
  }

  if (activeArena === 'viva' && activeAttempt) {
    return (
      <VivaArena
        attempt={activeAttempt}
        questions={safeQuestions}
        onFinish={(receipt) => {
          setActiveArena(null);
          setActiveAttempt(null);
          setSubmissionReceipt(receipt);
        }}
      />
    );
  }

  const labDone = ss?.lab_status === 'completed';
  const quizOpen = ss?.quiz_open;
  const vivaOpen = ss?.viva_open;

  // Check attempt states
  const quizAttempt = store.attempts.find((a) => a.session_id === activeSession?.id && a.student_id === student.id && a.part_type === 'quiz');
  const vivaAttempt = store.attempts.find((a) => a.session_id === activeSession?.id && a.student_id === student.id && a.part_type === 'viva');

  return (
    <div className="space-y-6">
      {/* Session Title Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Assessment Floor
            </span>
            <span className="text-xs text-slate-500 font-mono">Course: 25CSAE370</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{activeSession?.name}</h2>
          <p className="text-xs text-slate-500">
            Exam Date: {activeSession?.date} • Video Gate: {activeSession?.video_gate_mode.toUpperCase()}
          </p>
        </div>

        {/* Video Gate Status Pill */}
        <div className="flex items-center gap-2">
          {videosCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Video Gate Cleared (6/6 Units)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Video Gate: {completedVids}/6 Videos Watched</span>
            </span>
          )}
        </div>
      </div>

      {/* Submission Receipt Toast Banner if just submitted */}
      {submissionReceipt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Assessment Paper Successfully Submitted</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Official Submission Receipt: <span className="font-mono font-bold">{submissionReceipt}</span>
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Your paper has been cryptographically recorded on the server. Marks are currently in faculty review state.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionReceipt(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Stage Stepper (Section 58) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Exam Stepper Progression</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Videos */}
          <div className={`p-4 rounded-xl border ${videosCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-teal-200 bg-teal-50/30'}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Stage 1</span>
              {videosCompleted ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
              ) : (
                <span className="text-teal-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Current</span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Course Videos</h4>
            <p className="text-xs text-slate-500 mt-1">Complete all 6 published lab units.</p>
          </div>

          {/* Step 2: Lab Execution */}
          <div className={`p-4 rounded-xl border ${labDone ? 'border-emerald-200 bg-emerald-50/30' : videosCompleted ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Stage 2</span>
              {labDone ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
              ) : videosCompleted ? (
                <span className="text-amber-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Locked</span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Lab Execution</h4>
            <p className="text-xs text-slate-500 mt-1">
              {labDone ? `Verified: ${ss?.lab_marks || 28}/30 Marks` : 'Execute Git experiment in laboratory.'}
            </p>
          </div>

          {/* Step 3: Randomized MCQ Quiz */}
          <div className={`p-4 rounded-xl border ${quizAttempt?.status === 'submitted' ? 'border-emerald-200 bg-emerald-50/30' : quizOpen ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-500/20' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Stage 3</span>
              {quizAttempt?.status === 'submitted' ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</span>
              ) : quizOpen ? (
                <span className="text-indigo-700 flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Open</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Locked</span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Randomized MCQ Quiz</h4>
            <p className="text-xs text-slate-500 mt-1">12 Questions • 20 Minutes • Proctored</p>
          </div>

          {/* Step 4: Typed Viva Voce */}
          <div className={`p-4 rounded-xl border ${vivaAttempt?.status === 'submitted' ? 'border-emerald-200 bg-emerald-50/30' : vivaOpen ? 'border-amber-200 bg-amber-50/40 ring-1 ring-amber-500/20' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Stage 4</span>
              {vivaAttempt?.status === 'submitted' ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</span>
              ) : vivaOpen ? (
                <span className="text-amber-700 flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Open</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Locked</span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-1">Typed Viva Voce</h4>
            <p className="text-xs text-slate-500 mt-1">5 Questions • AI Rubric Evaluation</p>
          </div>
        </div>
      </div>

      {/* Assessment Launch Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* MCQ Quiz Assessment Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Component A
              </span>
              {quizAttempt?.status === 'submitted' ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Paper Submitted
                </span>
              ) : quizOpen ? (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Open for Attempt
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">Locked by Faculty</span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900">Proctored Randomized MCQ Quiz</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              12 randomized questions selected across syllabus units with shuffled options. Real-time timer and anti-cheat fullscreen restrictions apply.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Duration: 20 Mins</span>
            {quizAttempt?.status === 'submitted' ? (
              <button
                disabled
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                Submitted (Receipt: {quizAttempt.submission_receipt?.slice(0, 14)}...)
              </button>
            ) : !quizOpen ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                title="Waiting for faculty to mark your lab completed and unlock the quiz"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Waiting for Faculty</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPreCheckModal('quiz')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start MCQ Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Typed Viva Assessment Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Component B
              </span>
              {vivaAttempt?.status === 'submitted' ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Paper Submitted
                </span>
              ) : vivaOpen ? (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Open for Attempt
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">Locked by Faculty</span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900">Typed Viva Voce with AI Auto-Evaluation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              5 comprehensive technical questions. You will type your explanations directly into the platform. Answers are evaluated using server-side Gemini AI models.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Duration: 20 Mins</span>
            {vivaAttempt?.status === 'submitted' ? (
              <button
                disabled
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                Submitted (Receipt: {vivaAttempt.submission_receipt?.slice(0, 14)}...)
              </button>
            ) : !vivaOpen ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Waiting for Faculty</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPreCheckModal('viva')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Viva Assessment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Exam Verification Modal (Section 35) */}
      {preCheckModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Pre-Exam System Integrity Check</h3>
                <p className="text-xs text-slate-500">Assessment: {preCheckModal.toUpperCase()} • SMVITM Examination Floor</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Check 1: Fullscreen */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800">Fullscreen Requirement:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    document.documentElement.requestFullscreen().catch(() => {});
                    setFullscreenChecked(true);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    fullscreenChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {fullscreenChecked ? '✓ Fullscreen Enabled' : 'Enable Fullscreen'}
                </button>
              </div>

              {/* Workstation Lab Notice */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Lab Workstation Mode:</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  No Webcam Required
                </span>
              </div>

              {/* Rules Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1">
                <p className="font-bold">Proctoring Ground Rules:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Exiting fullscreen, switching tabs, or losing window focus counts as a violation.</li>
                  <li>3 recorded violations will trigger automatic server submission.</li>
                  <li>Keyboard shortcuts (Ctrl+C, Ctrl+V, F12) and context menu right-clicks are strictly blocked.</li>
                  <li>A subtle cryptographic watermark with your Roll No is embedded across the screen.</li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium leading-tight">
                  I agree to the proctoring terms and affirm that I will complete this assessment independently without secondary devices or assistance.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreCheckModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!consentAgreed || !fullscreenChecked}
                onClick={() => handleStartExam(preCheckModal)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
              >
                Enter Proctored Exam Arena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
