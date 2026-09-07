'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, LogIn, KeyRound, ShieldAlert, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { CHURCH_LOGO_URL } from '@/lib/branding';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTab, setForgotTab] = useState<'staff' | 'admin'>('staff');
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMasterKey, setResetMasterKey] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setAuthSessionCookie = (userIdentifier: string) => {
    document.cookie = `churchflow_staff_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    document.cookie = `churchflow_staff_email=${encodeURIComponent(userIdentifier)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setError('Please enter your username.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      // 1. Authenticate via server API
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthSessionCookie(data.username || data.email || cleanUsername);
        window.location.href = '/';
        return;
      }

      // 2. Direct Supabase fallback
      const supabase = createClient();
      const { data: staffList } = await supabase
        .from('staff')
        .select('email, full_name, role, password_hash')
        .or(`email.ilike.${cleanUsername},full_name.ilike.${cleanUsername}`);

      const staffData = staffList && staffList.length > 0 ? staffList[0] : null;

      if (!staffData) {
        setError(data.error || `Username "${cleanUsername}" is not registered. Ask your church administrator to add you.`);
        setLoading(false);
        return;
      }

      const storedPassword = staffData.password_hash;

      if (!storedPassword || storedPassword === password) {
        setAuthSessionCookie(staffData.email || cleanUsername);
        window.location.href = '/';
        return;
      }

      setError(data.error || 'Incorrect password. Ask your Admin to reset it.');
      setLoading(false);

    } catch (err: any) {
      setError('Unable to connect. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch('/api/staff/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetUsername.trim(),
          new_password: resetNewPassword,
          master_key: resetMasterKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setResetMessage({ type: 'success', text: data.message });
      setUsername(resetUsername);
      setPassword(resetNewPassword);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetMessage(null);
      }, 3000);
    } catch (err: any) {
      setResetMessage({ type: 'error', text: err.message });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, oklch(0.18 0.05 260) 0%, oklch(0.08 0.02 270) 100%)' }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div
            className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 p-2.5 backdrop-blur-2xl bg-gradient-to-b from-white/15 via-white/5 to-white/[0.02] border border-white/20 shadow-[0_8px_32px_0_rgba(212,175,55,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.4)] hover:border-gold/40 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-3xl bg-gold/15 blur-xl -z-10" />
            <img src={CHURCH_LOGO_URL} alt="RCCG EVF Sanctuary" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">Staff Portal</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 font-medium">RCCG Everflourishing Sanctuary</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4.5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. pastor_ayo, media_team, or email"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-white/60 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setResetUsername(username); }}
                  className="text-xs text-gold hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold btn-gold shadow-gold disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4.5 h-4.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          ChurchFlow Dashboard v1.0 • Everflourishing Sanctuary
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
                <KeyRound size={17} className="text-gold" /> Reset Password
              </h3>
              <button
                onClick={() => { setShowForgotModal(false); setResetMessage(null); }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => { setForgotTab('staff'); setResetMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  forgotTab === 'staff'
                    ? 'bg-gold text-slate-950 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Staff Member
              </button>
              <button
                type="button"
                onClick={() => { setForgotTab('admin'); setResetMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  forgotTab === 'admin'
                    ? 'bg-gold text-slate-950 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Admin Recovery
              </button>
            </div>

            {forgotTab === 'staff' ? (
              <div className="space-y-3 text-xs text-white/70">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="font-semibold text-white">How to reset your password:</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/60">
                    <li>Contact your Church Administrator.</li>
                    <li>They will open <span className="text-gold font-medium">Staff & Permissions</span>.</li>
                    <li>They will click <span className="text-gold font-medium">Set Password</span> next to your account to assign a new password immediately.</li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold btn-gold shadow-gold mt-2"
                >
                  Got It
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <p className="text-xs text-white/60">
                  Church Admins can reset credentials using their Master Admin Key.
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wide mb-1">
                    Username / Account *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetUsername}
                    onChange={e => setResetUsername(e.target.value)}
                    placeholder="e.g. pastor_ayo or email"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wide mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wide mb-1">
                    Master Admin Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetMasterKey}
                    onChange={e => setResetMasterKey(e.target.value)}
                    placeholder="Enter Admin Master Key"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                {resetMessage && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium ${
                    resetMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}>
                    {resetMessage.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setResetMessage(null); }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold btn-glass"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold disabled:opacity-50"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
