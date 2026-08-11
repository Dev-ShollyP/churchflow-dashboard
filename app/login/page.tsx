'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, LogIn, KeyRound, ShieldAlert, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTab, setForgotTab] = useState<'staff' | 'admin'>('staff');
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMasterKey, setResetMasterKey] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setAuthSessionCookie = (userEmail: string) => {
    document.cookie = `churchflow_staff_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    document.cookie = `churchflow_staff_email=${encodeURIComponent(userEmail)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!password || password.length < 3) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: staffData, error: dbError } = await supabase
        .from('staff')
        .select('email, full_name, role, password_hash')
        .eq('email', cleanEmail)
        .single();

      if (dbError || !staffData) {
        setError('This email is not in the Church Staff directory. Ask your Admin to add you under Staff & Permissions.');
        setLoading(false);
        return;
      }

      const storedPassword = staffData.password_hash;

      if (!storedPassword) {
        setAuthSessionCookie(cleanEmail);
        window.location.href = '/';
        return;
      }

      if (storedPassword !== password) {
        setError('Incorrect password. Click "Forgot Password?" below or ask your Admin to reset it.');
        setLoading(false);
        return;
      }

      setAuthSessionCookie(cleanEmail);
      window.location.href = '/';

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
          email: resetEmail.trim(),
          new_password: resetNewPassword,
          master_key: resetMasterKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setResetMessage({ type: 'success', text: data.message });
      setEmail(resetEmail);
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-gold"
            style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
          >
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">Staff Portal</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 font-medium">RCCG Everflourishing Sanctuary</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4.5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
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
                  onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
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
                <LogIn size={16} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6 font-medium">
          ChurchFlow Dashboard v1.0 • Everflourishing Sanctuary
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 space-y-4 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-gold" />
                <h3 className="font-display font-semibold text-white text-base">Reset Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setForgotTab('staff')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  forgotTab === 'staff' ? 'btn-gold shadow-gold' : 'text-white/50 hover:text-white'
                }`}
              >
                Staff Reset
              </button>
              <button
                type="button"
                onClick={() => setForgotTab('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  forgotTab === 'admin' ? 'btn-gold shadow-gold' : 'text-white/50 hover:text-white'
                }`}
              >
                Admin Lockout Help
              </button>
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                resetMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}>
                {resetMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{resetMessage.text}</span>
              </div>
            )}

            {forgotTab === 'staff' ? (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <p className="text-xs text-white/60 leading-relaxed">
                  Enter your email address and new password to reset your login credentials.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1 uppercase tracking-wide">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium btn-glass"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset My Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-white/70">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Admin Password Recovery
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    If you are the Church Admin and cannot log in:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <p className="font-semibold text-gold mb-1">Option 1: Direct Reset via Staff Email</p>
                    <p className="text-[11px] text-white/50">
                      Use the "Staff Reset" tab above with your Admin email to set a new password directly.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <p className="font-semibold text-gold mb-1">Option 2: Supabase SQL Editor</p>
                    <p className="text-[11px] text-white/50 mb-1.5">
                      Run this query in your Supabase SQL Editor:
                    </p>
                    <pre className="p-2 rounded bg-black/70 text-emerald-400 font-mono text-[10px] overflow-x-auto select-all">
                      UPDATE public.staff SET password_hash = 'NewAdmin123' WHERE role = 'admin';
                    </pre>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold"
                  >
                    Close &amp; Try Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
