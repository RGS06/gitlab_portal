import React, { useState } from 'react';
import { store } from '../../services/store';
import { AuditLog } from '../../types';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(store.auditLogs);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Institutional Security & Compliance
            </span>
            <span className="text-xs text-slate-500 font-mono">Immutable Event Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Audit Trail & Security Logs</h2>
          <p className="text-xs text-slate-500">
            Records all administrative, examination, override, and state transitions with actor attribution and timestamps.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit actions..."
            className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">Metadata / Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{log.actor_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{log.entity_type}</td>
                  <td className="p-3 text-slate-500">{log.entity_id}</td>
                  <td className="p-3 text-slate-600 truncate max-w-xs">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No security events found matching query.
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
