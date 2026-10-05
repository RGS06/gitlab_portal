import React, { useState } from 'react';
import { store } from '../../services/store';
import { MCQQuestion } from '../../types';
import { PlayCircle, CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';

export const PracticeMode: React.FC = () => {
  const [questions] = useState<MCQQuestion[]>(() => [...store.mcqQuestions].slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const currentQ = questions[currentIndex];
  const userOptId = selectedOptions[currentQ.id];
  const isRevealed = revealed[currentQ.id];

  const handleSelect = (optId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [currentQ.id]: optId }));
    setRevealed((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const handleReset = () => {
    setSelectedOptions({});
    setRevealed({});
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-blue-900 text-white rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-mono font-bold text-blue-300">
            Self-Paced Practice Sandbox
          </span>
          <h2 className="text-xl font-bold mt-1">Untimed & Unproctored Practice Arena</h2>
          <p className="text-xs text-blue-200 mt-1">
            Solve Git questions with instant explanations. Does not affect official CIE marks or create proctored attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Practice</span>
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Practice Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">Topic: {currentQ.topic}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug">{currentQ.question_text}</h3>

        {currentQ.code_snippet && (
          <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800">
            <code>{currentQ.code_snippet}</code>
          </pre>
        )}

        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = userOptId === opt.id;
            let optClass = 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800';

            if (isRevealed) {
              if (opt.is_correct) {
                optClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-500';
              } else if (isSelected && !opt.is_correct) {
                optClass = 'bg-red-50 border-red-300 text-red-950';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${optClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                    {opt.option_key || '•'}
                  </span>
                  <span>{opt.option_text}</span>
                </div>
                {isRevealed && opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {isRevealed && isSelected && !opt.is_correct && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation */}
        {isRevealed && currentQ.explanation && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 animate-in fade-in">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Explanation & Mechanics:</span>
            </span>
            <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-xs font-mono text-slate-400">
          Question {currentIndex + 1} / {questions.length}
        </span>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
          >
            Finish Practice Session
          </button>
        )}
      </div>
    </div>
  );
};
