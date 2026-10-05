import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Attempt } from '../../types';
import { 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VivaArenaProps {
  attempt: Attempt;
  questions: any[];
  onFinish: (receipt: string) => void;
}

export const VivaArena: React.FC<VivaArenaProps> = ({ attempt, questions, onFinish }) => {
  const student = store.currentProfile;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      const existing = attempt.viva_answers?.find((v) => v.question_id === q.id);
      map[q.id] = existing?.student_answer || '';
    }
    return map;
  });

  const [violationsCount, setViolationsCount] = useState(attempt.violations_count || 0);
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(1200); // 20 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync Timer
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

  // Proctoring listeners
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        store.logProctorEvent(attempt.id, 'TAB_SWITCH', 1, { msg: 'Tab switch in Viva' });
        setViolationsCount((v) => v + 1);
        setToastWarning('Tab switch detected and logged by proctor.');
        setTimeout(() => setToastWarning(null), 4000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [attempt.id]);

  const currentQ = questions[currentIndex];
  const currentText = answers[currentQ.id] || '';

  const handleTextChange = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: text }));
    store.saveVivaAnswer(attempt.id, attempt.token, currentQ.id, text);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    store.logProctorEvent(attempt.id, 'PASTE_ATTEMPT', 1, { msg: 'Paste blocked in viva textarea' });
    setToastWarning('Direct copy-pasting is blocked. All viva explanations must be typed.');
    setTimeout(() => setToastWarning(null), 3000);
  };

  const handleSubmit = (reason: 'user' | 'auto_submitted' = 'user') => {
    if (isSubmitting) return;
    if (reason === 'user') {
      const answeredCount = Object.values(answers).filter((t) => t.trim().length > 10).length;
      if (answeredCount < questions.length) {
        if (!confirm(`You have only completed ${answeredCount} of ${questions.length} viva questions. Are you ready to submit for AI evaluation?`)) {
          return;
        }
      }
    }

    setIsSubmitting(true);
    const result = store.submitAttempt(attempt.id, attempt.token, reason);
    onFinish(result.receipt);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none relative">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-6 z-30 exam-watermark flex flex-wrap items-center justify-around gap-24 font-mono text-sm uppercase">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="transform -rotate-12">
            <span>{student.roll_number} • {student.full_name}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white text-xs">
            VIVA
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Typed Viva Voce Assessment</span>
              <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                {student.roll_number}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Gemini AI Auto-Evaluation • 5 Questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400">Time Left:</span>
          <span className="font-mono text-sm font-bold text-white">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Violations:</span>
            <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {violationsCount} / 3
            </span>
          </div>
        </div>
      </header>

      {toastWarning && (
        <div className="bg-amber-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between z-50 sticky top-14">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{toastWarning}</span>
          </div>
          <span className="text-[11px] underline cursor-pointer" onClick={() => setToastWarning(null)}>Dismiss</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 relative z-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Viva Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Topic: {currentQ.topic}</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Max Marks: {currentQ.max_marks || 10}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-relaxed">
            {currentQ.question_text}
          </h3>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Type Your Technical Explanation:</span>
              <span className="font-mono">{currentText.length} characters (min 40 recommended)</span>
            </div>
            <textarea
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              onPaste={handlePaste}
              rows={8}
              placeholder="Explain the concepts, underlying Git architecture, data structures, and command flags clearly in your own words..."
              className="w-full text-xs sm:text-sm p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed select-text"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Note: Pasting is disabled. Answers will be evaluated server-side by Google Gemini AI against official university rubrics and key concepts.
            </p>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Question</span>
          </button>

          <div className="flex items-center gap-2">
            {questions.map((q, idx) => {
              const hasText = (answers[q.id] || '').trim().length > 10;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-amber-600 text-white'
                      : hasText
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

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
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Viva for Evaluation</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
