import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Profile } from '../../types';
import { 
  GraduationCap, 
  Bell, 
  UserCheck, 
  ShieldCheck, 
  ChevronDown, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  LogIn,
  LogOut,
  Mail,
  CheckCircle2,
  XCircle,
  Lock,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const [profile, setProfile] = useState<Profile>(store.currentProfile);
  const [profiles, setProfiles] = useState<Profile[]>(store.profiles);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);

  const announcements = store.announcements;

  useEffect(() => {
    return store.subscribe(() => {
      setProfile(store.currentProfile);
      setProfiles([...store.profiles]);
    });
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'faculty':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Faculty</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Student</span>;
    }
  };

  const getSectionBatchDisplay = (p: Profile) => {
    if (p.role !== 'student') return null;
    const sec = store.sections.find((s) => s.id === p.section_id)?.section_code;
    const bat = store.batches.find((b) => b.id === p.batch_id)?.batch_code;
    if (!bat) {
      return (
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium">
          Batch Unassigned
        </span>
      );
    }
    return (
      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono">
        Sec {sec} • Batch {bat}
      </span>
    );
  };

  // Real-time domain validation
  const cleanInputEmail = loginEmail.trim().toLowerCase();
  const hasTypedAt = cleanInputEmail.includes('@');
  const isSodeEdu = cleanInputEmail.endsWith('@sode-edu.in');
  const isInvalidFormat = hasTypedAt && !isSodeEdu;

  const handleInstitutionalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccessMsg(null);

    // Strict validation: Must end with @sode-edu.in
    if (!cleanInputEmail.endsWith('@sode-edu.in')) {
      setLoginError('Access Restricted: Only official @sode-edu.in institutional email addresses are permitted. Personal emails (@gmail.com, @yahoo.com, etc.) are strictly rejected.');
      return;
    }

    const result = store.loginWithEmail(cleanInputEmail);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please check your credentials.');
    } else {
      setLoginSuccessMsg(`Welcome, ${result.profile?.full_name}! Authenticated via @sode-edu.in institutional SSO.`);
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginError(null);
        setLoginSuccessMsg(null);
      }, 1000);
    }
  };

  const handleQuickChipLogin = (email: string) => {
    setLoginEmail(email);
    setLoginError(null);
    const result = store.loginWithEmail(email);
    if (result.success) {
      setLoginSuccessMsg(`Switched to ${result.profile?.full_name} (${email})`);
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginSuccessMsg(null);
      }, 700);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Course Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shadow-xs">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">SMVITM Bantakal</span>
                <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">25CSAE370</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">GitLab Learning & Assessment Portal — Project Management with Git</p>
            </div>
          </div>

          {/* Right Area: Institutional Login & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Login with @sode-edu.in Button */}
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(true);
                setLoginError(null);
                setLoginSuccessMsg(null);
              }}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Authenticate using official @sode-edu.in institutional email"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Institutional Login</span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1 py-0.2 rounded font-mono">@sode-edu.in</span>
            </button>

            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition cursor-pointer"
                title="Switch active user to test student, faculty, or admin permissions"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">User:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[100px]">{profile.full_name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Quick User Simulator</span>
                    <span className="text-[10px] text-emerald-600 lowercase font-mono">@sode-edu.in</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {profiles.slice(0, 15).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          store.switchUser(p.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          p.id === profile.id ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="text-xs font-medium text-slate-900 truncate">{p.full_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{p.email}</p>
                        </div>
                        <div className="shrink-0">{getRoleBadge(p.role)}</div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Total {profiles.length} users</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowLoginModal(true);
                      }}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      Login by Email →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Announcements notification icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative cursor-pointer"
                aria-label="View announcements"
              >
                <Bell className="w-5 h-5" />
                {announcements.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showAnnouncements && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-600" />
                      Course Announcements
                    </h4>
                    <span className="text-[11px] text-slate-500">{announcements.length} new</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs">
                        <p className="font-semibold text-slate-800">{a.title}</p>
                        <p className="text-slate-600 mt-1">{a.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Active User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/20">
                {profile.full_name[0]}
              </div>
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">{profile.full_name}</span>
                  {getRoleBadge(profile.role)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">{profile.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Login Modal with Strict @sode-edu.in Domain Enforcement */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Single Sign-On</h3>
                <p className="text-xs text-slate-500">Shri Madhwa Vadiraja Institute of Technology & Management</p>
              </div>
            </div>

            {/* Domain Enforcement Alert */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Strict Domain Policy:</span> Only accounts ending with{' '}
                <span className="font-mono font-bold text-blue-950 bg-blue-100 px-1 py-0.2 rounded">@sode-edu.in</span> are authorized. All other formats (@gmail, @yahoo, etc.) are ignored and rejected.
              </div>
            </div>

            <form onSubmit={handleInstitutionalLogin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="e.g. raghugs.cs@sode-edu.in or usn@sode-edu.in"
                    className={`w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border font-mono transition focus:outline-hidden ${
                      isInvalidFormat
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-400'
                        : isSodeEdu
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 focus:ring-2 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  {isSodeEdu && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  )}
                  {isInvalidFormat && (
                    <XCircle className="w-4 h-4 text-red-500 absolute right-3 top-3" />
                  )}
                </div>

                {/* Realtime Live Domain Feedback */}
                {isInvalidFormat && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Domain not allowed: Email must end with @sode-edu.in</span>
                  </p>
                )}

                {isSodeEdu && (
                  <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Official @sode-edu.in institutional domain verified</span>
                  </p>
                )}
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{loginSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isSodeEdu}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                Sign In with @sode-edu.in
              </button>
            </form>

            {/* Quick 1-Click Institutional Roster Login */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick 1-Click Institutional Access:
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickChipLogin('raghugs.cs@sode-edu.in')}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">Mr. Raghavendra G.S</span>
                    <span className="text-[10px] text-slate-500 block font-mono">raghugs.cs@sode-edu.in</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Sec A</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickChipLogin('ashritha.cs@sode-edu.in')}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">Ms. Ashritha K P</span>
                    <span className="text-[10px] text-slate-500 block font-mono">ashritha.cs@sode-edu.in</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">Sec B</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickChipLogin('soundharya.cs@sode-edu.in')}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 text-left transition cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">Ms. R. Soundharya</span>
                    <span className="text-[10px] text-slate-500 block font-mono">soundharya.cs@sode-edu.in</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">Sec C</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickChipLogin('aditya.25cs001@sode-edu.in')}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">ADITYA NAYAK</span>
                    <span className="text-[10px] text-slate-500 block font-mono">aditya.25cs001@sode-edu.in</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
