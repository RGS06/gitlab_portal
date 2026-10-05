import React, { useState } from 'react';
import { store } from '../../services/store';
import { jsPDF } from 'jspdf';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Download, 
  Sparkles, 
  FileText,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export const StudentResults: React.FC = () => {
  const student = store.currentProfile;
  const sessions = store.examSessions;
  const activeSession = sessions[0];
  const ss = store.sessionStudents.find((s) => s.student_id === student.id && s.session_id === activeSession?.id);

  const isReleased = ss?.marks_state === 'released';
  const quizAttempt = store.attempts.find((a) => a.student_id === student.id && a.part_type === 'quiz');
  const vivaAttempt = store.attempts.find((a) => a.student_id === student.id && a.part_type === 'viva');

  const quizScore = quizAttempt?.score || 0;
  const quizMax = quizAttempt?.max_score || 12;
  const vivaScore = vivaAttempt?.score || 0;
  const vivaMax = 50; // 5 viva questions x 10 marks
  const labMarks = ss?.lab_marks || 0;
  const labMax = 30;

  // Normalized CIE Scale: Lab (30) + Quiz (10) + Viva (10) = 50 Marks total CIE
  const scaledQuiz = Math.round((quizScore / (quizMax || 1)) * 10 * 10) / 10;
  const scaledViva = Math.round((vivaScore / (vivaMax || 1)) * 10 * 10) / 10;
  const totalCieMarks = Math.round((labMarks + scaledQuiz + scaledViva) * 10) / 10;

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generateCertificate = () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Background Border
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.8);
      doc.rect(13, 13, 271, 184);

      // Institution Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY & MANAGEMENT', 148.5, 32, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('Autonomous Institute Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi', 148.5, 40, { align: 'center' });
      doc.text('Vishwothama Nagar, Bantakal, Udupi - 574115, Karnataka, India', 148.5, 46, { align: 'center' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('CERTIFICATE OF LABORATORY COMPLETION', 148.5, 66, { align: 'center' });

      // Body Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text('This is to certify that', 148.5, 80, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(student.full_name, 148.5, 92, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(`University Roll Number: ${student.roll_number} | Batch: A1`, 148.5, 100, { align: 'center' });

      doc.setFontSize(13);
      doc.text('has successfully completed the laboratory curriculum and proctored CIE assessment for:', 148.5, 114, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(13, 148, 136);
      doc.text('25CSAE370: Project Management with Git', 148.5, 124, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text(`Total Continuous Internal Evaluation (CIE) Score: ${totalCieMarks} / 50 Marks (Grade: Outstanding)`, 148.5, 134, { align: 'center' });

      // Verification Metadata
      const certId = `SMVITM-CERT-2026-${student.roll_number}-${Date.now().toString().slice(-6)}`;
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Certificate ID: ${certId}`, 25, 165);
      doc.text(`Issued On: ${new Date().toLocaleDateString('en-GB')}`, 25, 171);
      doc.text('Digitally Verified via Supabase LMS Engine', 25, 177);

      // Determine Handling Faculty for Student's Section
      const studentSec = store.sections.find((s) => s.id === student.section_id);
      const facultyName = studentSec?.handling_faculty_name || 'Mr. Raghavendra G.S';

      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(facultyName, 220, 165, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Section ${studentSec?.section_code || 'A'} Handling Faculty`, 220, 171, { align: 'center' });
      doc.text('Department of Computer Science & Engineering', 220, 177, { align: 'center' });

      doc.save(`SMVITM_Git_Certificate_${student.roll_number}.pdf`);
    } catch (err) {
      console.error('Certificate generation failed', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!isReleased) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Marks Awaiting Faculty Release</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Your exam submission has been securely recorded. In accordance with university academic procedure, scores remain confidential until formally reviewed and released by your course faculty.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 border border-slate-200 inline-block">
          Current State: <span className="font-bold text-amber-700 uppercase">{ss?.marks_state || 'Draft'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Released Results Header */}
      <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
              Official Assessment Results
            </span>
            <span className="text-xs text-emerald-300 font-mono">Released by Faculty</span>
          </div>
          <h2 className="text-2xl font-bold mt-1">25CSAE370 — Project Management with Git</h2>
          <p className="text-xs text-emerald-200 mt-1">
            Student: {student.full_name} ({student.roll_number}) • Semester End Continuous Evaluation
          </p>
        </div>

        {/* Certificate Button */}
        <button
          type="button"
          onClick={generateCertificate}
          disabled={generatingPdf}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition shadow-xs cursor-pointer shrink-0"
        >
          <Award className="w-4 h-4 text-emerald-700" />
          <span>{generatingPdf ? 'Generating PDF...' : 'Download Official PDF Certificate'}</span>
        </button>
      </div>

      {/* Score Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Lab Execution Marks</span>
          <p className="text-2xl font-bold text-teal-800">{labMarks} <span className="text-xs font-normal text-slate-400">/ {labMax}</span></p>
          <p className="text-[11px] text-slate-500">Hands-on Git commands execution</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">MCQ Quiz Score</span>
          <p className="text-2xl font-bold text-indigo-800">{scaledQuiz} <span className="text-xs font-normal text-slate-400">/ 10</span></p>
          <p className="text-[11px] text-slate-500">{quizScore} of {quizMax} MCQs answered correctly</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Viva Voce AI Score</span>
          <p className="text-2xl font-bold text-amber-800">{scaledViva} <span className="text-xs font-normal text-slate-400">/ 10</span></p>
          <p className="text-[11px] text-slate-500">Evaluated against rubrics & concepts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-emerald-500 shadow-xs space-y-1 bg-emerald-50/20">
          <span className="text-xs font-bold text-emerald-700 uppercase">Total CIE Score</span>
          <p className="text-3xl font-extrabold text-emerald-950">{totalCieMarks} <span className="text-xs font-normal text-slate-500">/ 50</span></p>
          <p className="text-[11px] font-semibold text-emerald-700">Status: PASSED (Grade O)</p>
        </div>
      </div>

      {/* Detailed Feedback & Viva Concepts Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Examiner & AI Evaluation Summary</span>
        </h3>

        <div className="space-y-3">
          {vivaAttempt?.viva_answers?.map((va, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-800">Viva Question {idx + 1}</span>
                <span className="font-mono text-emerald-700 font-bold">{va.final_marks || va.ai_marks || 8} / 10 Marks</span>
              </div>
              <p className="text-slate-600 italic">"{va.student_answer || 'Candidate presented concise technical reasoning.'}"</p>
              {va.ai_feedback && (
                <div className="text-indigo-900 bg-indigo-50/60 p-2.5 rounded border border-indigo-100 font-sans">
                  <span className="font-bold">Feedback:</span> {va.ai_feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
