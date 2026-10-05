import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Unit } from '../../types';
import { VideoPlayer } from './VideoPlayer';
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  FileText,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const LearningPath: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>(store.units);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const student = store.currentProfile;

  useEffect(() => {
    return store.subscribe(() => {
      setUnits([...store.units]);
    });
  }, []);

  // Compute status for each unit sequentially
  const publishedUnits = units.filter((u) => u.published);
  let previousCompleted = true;

  const unitStatuses = units.map((u) => {
    if (!u.published) {
      return { unit: u, status: 'coming_soon' as const };
    }

    const vid = u.videos?.[0]?.id;
    const prog = vid ? store.getVideoProgress(student.id, vid) : null;
    const isDone = Boolean(prog?.completed);

    if (isDone) {
      previousCompleted = true;
      return { unit: u, status: 'completed' as const, progress: prog };
    }

    if (previousCompleted) {
      previousCompleted = false; // Next published unit will be locked until this one finishes!
      const inProgress = (prog?.watched_seconds || 0) > 0;
      return { unit: u, status: inProgress ? ('in_progress' as const) : ('available' as const), progress: prog };
    }

    return { unit: u, status: 'locked' as const, progress: prog };
  });

  const completedCount = unitStatuses.filter((s) => s.status === 'completed').length;
  const totalPublished = publishedUnits.length;
  const percentCompleted = totalPublished > 0 ? Math.round((completedCount / totalPublished) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner required by Section 10 */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <div className="p-2 rounded-lg bg-teal-100 text-teal-800 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-teal-950">Self-Learning Laboratory Path — 25CSAE370</h3>
          <p className="text-xs text-teal-800 mt-0.5">
            Complete all videos before your lab exam. The quiz and viva will be opened by your faculty on the exam day.
          </p>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course Syllabus Progress</span>
          <h2 className="text-2xl font-bold text-slate-900">
            {completedCount} of {totalPublished} Published Units Completed
          </h2>
          <p className="text-xs text-slate-500">
            Sequential progression enforced. Units 1–6 published for CIE preparation; Units 7–12 coming soon.
          </p>
        </div>

        {/* Progress Bar & Ring */}
        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Watch Progress</span>
            <span className="text-teal-700 font-mono">{percentCompleted}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-teal-600 transition-all duration-500 rounded-full"
              style={{ width: `${percentCompleted}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Minimum 95% watch-time server requirement</span>
            <span>24/7 Access</span>
          </div>
        </div>
      </div>

      {/* 12 Units Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {unitStatuses.map(({ unit, status, progress }) => {
          const isCompleted = status === 'completed';
          const isAvailable = status === 'available' || status === 'in_progress';
          const isLocked = status === 'locked';
          const isComingSoon = status === 'coming_soon';

          return (
            <div
              key={unit.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isAvailable
                  ? 'border-teal-200 shadow-sm ring-1 ring-teal-500/20'
                  : 'border-slate-200 opacity-80 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3">
                {/* Unit Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Unit {unit.unit_number} • {unit.program_number}
                  </span>

                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                  {status === 'in_progress' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </span>
                  )}
                  {status === 'available' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Ready to Start
                    </span>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </span>
                  )}
                  {isComingSoon && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 border border-dashed border-slate-300 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{unit.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{unit.description}</p>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {unit.videos?.[0] ? (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.round(unit.videos[0].duration_seconds / 60)} mins
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">Curriculum unit</span>
                )}

                {isComingSoon ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    Unpublished
                  </button>
                ) : isLocked ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
                    title="Complete preceding unit to unlock"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Complete Unit {unit.unit_number - 1}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveUnit(unit)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Rewatch' : 'Watch Video'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Video Player Modal */}
      {activeUnit && activeUnit.videos?.[0] && (
        <VideoPlayer
          unit={activeUnit}
          video={activeUnit.videos[0]}
          onClose={() => setActiveUnit(null)}
        />
      )}
    </div>
  );
};
