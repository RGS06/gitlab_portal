import React, { useState } from 'react';
import { store } from '../../services/store';
import { MCQQuestion, VivaQuestion } from '../../types';
import { 
  FileQuestion, 
  HelpCircle, 
  Plus, 
  Search, 
  Upload, 
  Code2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export const QuestionBankManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'viva'>('mcq');
  const [mcqs, setMcqs] = useState<MCQQuestion[]>(store.mcqQuestions);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>(store.vivaQuestions);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMCQs = mcqs.filter(
    (q) =>
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredViva = vivaQuestions.filter(
    (vq) =>
      vq.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vq.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Curriculum Bank Repository
            </span>
            <span className="text-xs text-slate-500 font-mono">25CSAE370 Syllabus</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">MCQ & Viva Voce Question Bank</h2>
          <p className="text-xs text-slate-500">
            {mcqs.length} MCQs and {vivaQuestions.length} Viva rubrics stratified across 12 syllabus units.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('mcq')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mcq'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>MCQ Bank ({mcqs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('viva')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'viva'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Viva Bank ({vivaQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="relative max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab.toUpperCase()} questions by keyword or topic...`}
            className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* MCQ Tab Content */}
      {activeTab === 'mcq' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {filteredMCQs.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      MCQ #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{q.topic}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {q.difficulty}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-snug">{q.question_text}</p>

                {q.code_snippet && (
                  <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800">
                    <code>{q.code_snippet}</code>
                  </pre>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        opt.is_correct
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500">{opt.option_key}.</span>
                        <span>{opt.option_text}</span>
                      </div>
                      {opt.is_correct && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Correct Key
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viva Tab Content */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {filteredViva.map((vq, idx) => (
              <div key={vq.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Viva #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{vq.topic}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Max: {vq.max_marks} Marks
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{vq.question_text}</h4>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700">Protected Reference / Ideal Answer:</span>
                  <p className="text-slate-600 leading-relaxed">{vq.reference_answer}</p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-700">Key Concepts for AI Rubric Evaluation:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vq.key_concepts.map((concept, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium text-[11px]">
                        ✓ {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {vq.rubric && (
                  <p className="text-xs text-slate-500 bg-amber-50/50 p-2.5 rounded border border-amber-200">
                    <span className="font-semibold text-amber-900">Grading Rubric:</span> {vq.rubric}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
