import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Unit } from '../../types';
import { Video, CheckCircle2, Lock, Eye, Edit3, Clock } from 'lucide-react';

export const AdminLearningManagement: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>(store.units);

  useEffect(() => {
    return store.subscribe(() => {
      setUnits([...store.units]);
    });
  }, []);

  const handleToggle = (unitId: string) => {
    store.toggleUnitPublish(unitId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Curriculum Video Modules
            </span>
            <span className="text-xs text-slate-500 font-mono">12 Course Experiments</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Learning Unit Publication Controls</h2>
          <p className="text-xs text-slate-500">
            Publish or unpublish units. Published units unlock sequentially for enrolled students; unpublished units remain "Coming Soon".
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Unit {u.unit_number}: {u.program_number}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    u.published
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-500 border border-dashed border-slate-300'
                  }`}
                >
                  {u.published ? 'Published' : 'Coming Soon'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{u.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{u.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {u.videos?.[0] ? `${Math.round(u.videos[0].duration_seconds / 60)} mins` : 'No video attached'}
              </span>
              <button
                type="button"
                onClick={() => handleToggle(u.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  u.published
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                }`}
              >
                {u.published ? 'Unpublish Unit' : 'Publish Unit'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
