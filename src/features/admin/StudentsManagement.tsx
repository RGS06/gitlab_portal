import React, { useState } from 'react';
import { store } from '../../services/store';
import { Profile, Section, Batch } from '../../types';
import Papa from 'papaparse';
import { 
  Users, 
  Upload, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  UserCheck,
  Edit2,
  Mail,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>(store.profiles);
  const [sections, setSections] = useState<Section[]>(store.sections);
  const [batches, setBatches] = useState<Batch[]>(store.batches);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [reassignModalStudent, setReassignModalStudent] = useState<Profile | null>(null);
  const [newBatchId, setNewBatchId] = useState<string>('');

  const students = profiles.filter((p) => p.role === 'student');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const sec = sections.find((sec) => sec.id === s.section_id);
    const bat = batches.find((b) => b.id === s.batch_id);

    if (sectionFilter !== 'all' && sec?.section_code !== sectionFilter) return false;
    if (batchFilter !== 'all' && bat?.batch_code !== batchFilter) return false;

    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        setParsedRows(rows);
        setImportErrors([]);
      },
    });
  };

  const handleConfirmImport = () => {
    const result = store.importStudents(parsedRows);
    if (result.errors.length > 0) {
      setImportErrors(result.errors);
    } else {
      alert(`Successfully imported ${result.imported} students into the institutional roster.`);
      setShowImportModal(false);
      setParsedRows([]);
      setProfiles([...store.profiles]);
    }
  };

  const handleReassignBatch = () => {
    if (!reassignModalStudent) return;
    const oldBatch = batches.find((b) => b.id === reassignModalStudent.batch_id)?.batch_code || 'Unassigned';
    const targetBatch = batches.find((b) => b.id === newBatchId);

    reassignModalStudent.batch_id = newBatchId || null;
    store.logAudit('REASSIGN_STUDENT_BATCH', 'profile', reassignModalStudent.id, {
      roll_number: reassignModalStudent.roll_number,
      old_batch: oldBatch,
      new_batch: targetBatch?.batch_code || 'Unassigned',
    });

    store.notify();
    setReassignModalStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Import Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Academic Roster Management
            </span>
            <span className="text-xs text-slate-500 font-mono">Sections A, B, C • Batches A1–C2</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Student Roster & Lab Batches</h2>
          <p className="text-xs text-slate-500">
            Total Enrolled: {students.length} students across 3 sections and 6 operational lab batches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
        >
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Import Students (CSV / Excel)</span>
        </button>
      </div>

      {/* Section Handling Faculty Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const secBatches = batches.filter((b) => b.section_id === sec.id);
          const studentCount = students.filter((s) => s.section_id === sec.id).length;
          const isSelected = sectionFilter === sec.section_code;

          return (
            <div
              key={sec.id}
              onClick={() => {
                setSectionFilter(isSelected ? 'all' : sec.section_code);
                setBatchFilter('all');
              }}
              className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    sec.section_code === 'A'
                      ? 'bg-blue-100 text-blue-800'
                      : sec.section_code === 'B'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {sec.section_code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Section {sec.section_code}</h3>
                    <p className="text-[11px] text-slate-500">{sec.program} • {sec.academic_year}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {studentCount} Students
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Faculty: {sec.handling_faculty_name || 'Not Assigned'}</span>
                </div>
                {sec.handling_faculty_email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{sec.handling_faculty_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-5 pt-0.5">
                  <span className="font-medium text-slate-600">Batches:</span>
                  <div className="flex gap-1">
                    {secBatches.map((b) => (
                      <span key={b.id} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                        {b.batch_code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-blue-600 font-medium text-right">
                {isSelected ? '✓ Filter applied (click to reset)' : 'Click to filter roster →'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, roll number, or email..."
            className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setBatchFilter('all');
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">All Sections (A, B, C)</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

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
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Roll Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Section</th>
                <th className="p-3">Operational Lab Batch</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const sec = sections.find((sec) => sec.id === s.section_id);
                const bat = batches.find((b) => b.id === s.batch_id);

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{s.roll_number}</td>
                    <td className="p-3 font-semibold text-slate-800">{s.full_name}</td>
                    <td className="p-3 font-mono text-slate-600">{s.email}</td>
                    <td className="p-3 font-semibold text-slate-700">Section {sec?.section_code || '-'}</td>
                    <td className="p-3">
                      {bat ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          Batch {bat.batch_code}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Batch Unassigned
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalStudent(s);
                          setNewBatchId(s.batch_id || '');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Reassign Batch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV / Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Import Students (CSV / Excel Format)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Upload a standard institutional CSV file. Required column headers:
              </p>
              <pre className="p-2 bg-slate-900 text-indigo-300 font-mono text-[11px] rounded">
                roll_number,full_name,section,batch,email
              </pre>
              <p className="text-[11px] text-slate-400">
                Note: Section A must map to A1 or A2; Section B to B1 or B2; Section C to C1 or C2. If batch is left blank, the student will be imported in a 'Batch Unassigned' state.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Validation Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900">
                  Validation Preview ({parsedRows.length} rows detected)
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 sticky top-0 text-[11px] text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Sec</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono">{r.roll_number}</td>
                          <td className="p-2">{r.full_name}</td>
                          <td className="p-2">{r.section}</td>
                          <td className="p-2 font-mono">{r.batch || 'Unassigned'}</td>
                          <td className="p-2 font-mono">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                <p className="font-bold">Validation Errors Detected:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                Commit & Import Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Batch Modal */}
      {reassignModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reassign Operational Batch</h3>
            <p className="text-xs text-slate-500">
              Student: <span className="font-bold text-slate-800">{reassignModalStudent.full_name}</span> ({reassignModalStudent.roll_number})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Batch:</label>
              <select
                value={newBatchId}
                onChange={(e) => setNewBatchId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.batch_code} ({b.batch_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignModalStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignBatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
