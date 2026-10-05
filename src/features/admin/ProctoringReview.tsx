import React, { useState } from 'react';
import { store } from '../../services/store';
import { ProctorEvent, Attempt } from '../../types';
import { ShieldAlert, AlertTriangle, Clock, Eye, Camera, CheckCircle2 } from 'lucide-react';

export const ProctoringReview: React.FC = () => {
  const [events, setEvents] = useState<ProctorEvent[]>(store.proctorEvents);
  const attempts = store.attempts;

  const getStudentForAttempt = (attemptId: string) => {
    const att = attempts.find((a) => a.id === attemptId);
    return store.profiles.find((p) => p.id === att?.student_id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Exam Security Telemetry
            </span>
            <span className="text-xs text-slate-500 font-mono">Deterrence & Evidence Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Proctoring Events & Violation Review</h2>
          <p className="text-xs text-slate-500">
            Realtime detection records for tab-switches, fullscreen exits, blocked shortcuts, and window blur events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Violation Event</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Telemetry Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => {
                const student = getStudentForAttempt(ev.attempt_id);
                return (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{student?.full_name || 'Student'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{student?.roll_number || '4MW25CS001'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      Level {ev.severity}
                    </td>
                    <td className="p-3 font-mono text-slate-600 truncate max-w-sm">
                      {JSON.stringify(ev.metadata || {})}
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No proctoring violations recorded. Clean session floor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
