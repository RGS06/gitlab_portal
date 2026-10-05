import React, { useState } from 'react';
import { store } from '../../services/store';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cleanInputEmail = email.trim().toLowerCase();
  const hasTypedAt = cleanInputEmail.includes('@');
  const isSodeEdu = cleanInputEmail.endsWith('@sode-edu.in');
  const isInvalidFormat = hasTypedAt && !isSodeEdu;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!cleanInputEmail) {
      setError('Please enter your @sode-edu.in institutional email address.');
      return;
    }

    if (!cleanInputEmail.endsWith('@sode-edu.in')) {
      setError('Access Denied: Only official @sode-edu.in email addresses are allowed. Personal domain formats (@gmail.com, @yahoo.com) are strictly rejected.');
      return;
    }

    const result = store.loginWithEmail(cleanInputEmail);
    if (!result.success) {
      setError(result.error || 'Login failed. Account not found in active roster.');
    } else {
      setSuccessMsg(`Welcome, ${result.profile?.full_name}! Authenticated via @sode-edu.in domain.`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              SMVITM Bantakal
              <span className="text-xs px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/60 font-mono">
                25CSAE370
              </span>
            </h1>
            <p className="text-xs text-slate-400">GitLab Learning & Assessment Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Institutional SSO: <strong className="text-slate-200">@sode-edu.in</strong></span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 mb-2">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Institutional SSO Login</h2>
            <p className="text-xs text-slate-400">
              Enter your official SMVITM student or faculty email to access course materials and CIE lab assessments.
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-950/80 border border-red-800/80 p-3.5 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-800/80 p-3.5 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Institutional Email</span>
                <span className="text-[11px] text-teal-400 font-mono">Domain: @sode-edu.in</span>
              </label>

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. raghugs.cs@sode-edu.in or 4mw25cs001@sode-edu.in"
                  className={`w-full bg-slate-950/90 border ${
                    isInvalidFormat
                      ? 'border-red-500 text-red-200 focus:ring-red-500'
                      : isSodeEdu
                      ? 'border-emerald-500 text-emerald-200 focus:ring-emerald-500'
                      : 'border-slate-700 text-slate-100 focus:border-teal-500'
                  } rounded-xl px-3.5 py-2.5 pl-10 text-sm focus:outline-none focus:ring-1 transition`}
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                
                {isSodeEdu && (
                  <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-3 text-emerald-400" />
                )}
                {isInvalidFormat && (
                  <XCircle className="w-4 h-4 absolute right-3.5 top-3 text-red-400" />
                )}
              </div>

              {isInvalidFormat && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Only official @sode-edu.in emails are permitted.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isInvalidFormat}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Sign In with @sode-edu.in</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 text-center text-xs text-slate-500 relative z-10 flex items-center justify-between">
        <span>© 2026 Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)</span>
        <span className="font-mono text-slate-400 text-[11px]">Strict Domain Enforcement: @sode-edu.in</span>
      </footer>
    </div>
  );
};
