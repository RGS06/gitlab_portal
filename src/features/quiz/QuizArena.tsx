import React, { useState, useEffect, useRef } from 'react';
import { store } from '../../services/store';
import { Attempt, Profile } from '../../types';
import { 
  Clock, 
  ShieldAlert, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Maximize, 
  Lock,
  Camera,
  Eye
} from 'lucide-react';

interface QuizArenaProps {
  attempt: Attempt;
  questions: any[];
  onFinish: (receipt: string) => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({ attempt, questions, onFinish }) => {
  const student = store.currentProfile;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string | null; isFlagged: boolean }>>(() => {
    const map: Record<string, { selectedOptionId: string | null; isFlagged: boolean }> = {};
    for (const q of questions) {
      const existing = attempt.attempt_answers?.find((a) => a.question_id === q.id);
      map[q.id] = {
        selectedOptionId: existing?.selected_option_id || null,
        isFlagged: existing?.is_flagged || false,
      };
    }
    return map;
  });

  const [violationsCount, setViolationsCount] = useState(attempt.violations_count || 0);
  const [integrityScore, setIntegrityScore] = useState(attempt.integrity_score || 100);
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const started = new Date(attempt.started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const total = attempt.duration_seconds + (attempt.extra_time_seconds || 0);
    return Math.max(0, total - elapsed);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync Timer from server
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit('auto_submitted');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Proctoring Violations Engine & Event Listeners (Sections 36, 37, 38, 41)
  const triggerViolation = (type: string, severity: number, message: string) => {
    store.logProctorEvent(attempt.id, type, severity, { message, timestamp: new Date().toISOString() });
    setViolationsCount((v) => {
      const newV = v + 1;
      if (newV >= 3) {
        setToastWarning('CRITICAL: 3rd Violation reached! Exam auto-submitting by university proctor policy.');
        setTimeout(() => handleSubmit('auto_submitted'), 2000);
      } else {
        setToastWarning(`WARNING (${newV}/3): ${message}. Continued violations will cause auto-submission.`);
        setTimeout(() => setToastWarning(null), 5000);
      }
      return newV;
    });
    setIntegrityScore((s) => Math.max(0, s - severity * 15));
  };

  useEffect(() => {
    // 1. Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('FULLSCREEN_EXIT', 1, 'Fullscreen exited');
      }
    };

    // 2. Tab switch / Visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH', 1, 'Switched browser tab or minimized window');
      }
    };

    // 3. Window blur
    const handleBlur = () => {
      triggerViolation('WINDOW_BLUR', 1, 'Window lost focus');
    };

    // 4. Keyboard Shortcuts & Copy/Paste blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+P, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'p', 's', 'a'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['c', 'v', 'x', 'u', 'p', 's', 'a'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        triggerViolation('BLOCKED_SHORTCUT', 1, `Attempted blocked shortcut (${e.ctrlKey ? 'Ctrl+' : ''}${e.key})`);
      }
    };

    // 5. Right-click context menu blocking
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('RIGHT_CLICK', 1, 'Right click context menu is prohibited');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOptionId: optId,
      },
    }));
    // Autosave immediately server-side
    store.saveAnswer(attempt.id, attempt.token, currentQ.id, optId, answers[currentQ.id]?.isFlagged);
  };

  const handleToggleFlag = () => {
    const newFlag = !answers[currentQ.id]?.isFlagged;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isFlagged: newFlag,
      },
    }));
    store.saveAnswer(attempt.id, attempt.token, currentQ.id, answers[currentQ.id]?.selectedOptionId, newFlag);
  };

  const handleSubmit = (reason: 'user' | 'auto_submitted' = 'user') => {
    if (isSubmitting) return;
    if (reason === 'user') {
      const answeredCount = Object.values(answers).filter((a) => a.selectedOptionId).length;
      if (answeredCount < questions.length) {
        if (!confirm(`You have only answered ${answeredCount} of ${questions.length} questions. Are you sure you wish to submit?`)) {
          return;
        }
      }
    }
    setIsSubmitting(true);
    const result = store.submitAttempt(attempt.id, attempt.token, reason);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onFinish(result.receipt);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none relative overflow-x-hidden">
      {/* Dynamic Watermark Overlay (Section 39) */}
      <div className="fixed inset-0 pointer-events-none opacity-6 z-30 exam-watermark flex flex-wrap items-center justify-around gap-24 font-mono text-sm uppercase">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="transform -rotate-12">
            <span>{student.roll_number} • {student.full_name}</span>
            <span className="block text-[10px]">{new Date().toISOString().slice(0, 19)}</span>
          </div>
        ))}
      </div>

      {/* Slim Distraction-Free Header (Section 86) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            25C
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>CIE Lab Quiz</span>
              <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">
                {student.roll_number}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Attempt: {attempt.token.slice(0, 8)} • Server-Controlled</p>
          </div>
        </div>

        {/* Center: Authoritative Timer */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-lg">
          <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-xs text-slate-400 font-medium">Time Remaining:</span>
          <span className={`font-mono text-sm font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Right: Violation Counter & Camera Ping */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert className={`w-4 h-4 ${violationsCount >= 2 ? 'text-red-400' : violationsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400">Violations:</span>
            <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${violationsCount >= 2 ? 'bg-red-900 text-red-200' : violationsCount > 0 ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-300'}`}>
              {violationsCount} / 3
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-slate-800 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>PROCTOR ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Realtime Violation Toast Banner */}
      {toastWarning && (
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md z-50 sticky top-14 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{toastWarning}</span>
          </div>
          <span className="text-[11px] underline cursor-pointer" onClick={() => setToastWarning(null)}>Dismiss</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        {/* Left Column: Question Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            {/* Question Header & Flag Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Topic: {currentQ.topic}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {currentQ.difficulty}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  answers[currentQ.id]?.isFlagged
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${answers[currentQ.id]?.isFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                <span>{answers[currentQ.id]?.isFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-slate-900 text-base font-semibold leading-relaxed">
              {currentQ.question_text}
            </div>

            {/* Code Snippet if applicable */}
            {currentQ.code_snippet && (
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 leading-normal">
                <code>{currentQ.code_snippet}</code>
              </pre>
            )}

            {/* 4 Options (Server Shuffled order) */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt: any) => {
                const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.option_key || '•'}
                      </span>
                      <span>{opt.option_text}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit('user')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Exam Paper</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Question Navigator & Exam Info (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Question Navigator
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = Boolean(ans?.selectedOptionId);
                const isFlagged = Boolean(ans?.isFlagged);
                const isCurrent = currentIndex === idx;

                let btnClass = 'bg-slate-100 text-slate-600 border-slate-200';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-indigo-600 font-bold border-indigo-600';
                }
                if (isAnswered) {
                  btnClass += ' bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
                }
                if (isFlagged) {
                  btnClass += ' bg-amber-100 text-amber-900 border-amber-300';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-indigo-600"></span>
                <span>Current</span>
              </div>
            </div>

            {/* Final Submit Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSubmit('user')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            </div>
          </div>

          {/* System Integrity Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs space-y-2 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Integrity Score</span>
              <span className="font-mono text-emerald-400 font-bold">{integrityScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${integrityScore}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Anti-cheat telemetry records tab switches, blur, and shortcuts. Do not exit fullscreen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
