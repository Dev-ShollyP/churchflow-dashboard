'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, LogIn, KeyRound, ShieldAlert, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(13,27,62,0.9) 0%, #040C1E 70%)' }}>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #C9A84C, transparent)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #0D1B3E, transparent)', filter: 'blur(60px)' }} />

      <div className="relative z-10 w-full max-w-sm mx-4 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', boxShadow: '0 0 40px rgba(201,168,76,0.3)' }}>
            <span className="font-display font-bold text-xl text-navy-dark">EVF</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Staff Portal</h1>
          <p className="text-sm text-white/40 mt-1">RCCG Everflourishing Mega Sanctuary</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-white/50 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                  className="text-xs text-gold hover:underline font-medium"
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
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-navy-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? '#8B6914' : 'linear-gradient(135deg, #C9A84C, #E8D48B)', boxShadow: '0 4px 20px rgba(201,168,76,0.25)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/25 mt-6">
          ChurchFlow v1.0
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up border border-gold/30">
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
            <div className="flex rounded-xl bg-navy-dark/60 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setForgotTab('staff')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  forgotTab === 'staff' ? 'bg-gold text-navy-dark shadow-gold' : 'text-white/50 hover:text-white'
                }`}
              >
                Staff Reset
              </button>
              <button
                type="button"
                onClick={() => setForgotTab('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  forgotTab === 'admin' ? 'bg-gold text-navy-dark shadow-gold' : 'text-white/50 hover:text-white'
                }`}
              >
                Admin Lockout Help
              </button>
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                resetMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/25 text-red-300'
              }`}>
                {resetMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{resetMessage.text}</span>
              </div>
            )}

            {forgotTab === 'staff' ? (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <p className="text-xs text-white/50 leading-relaxed">
                  Enter your email address and type your new password to update your staff login.
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
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-dark/80 border border-white/10 focus:border-gold/50 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-navy-dark/80 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white bg-white/5"
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
                    <ShieldAlert size={14} /> What can the Admin do if they forget their password?
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    If you are the Church Admin and cannot log in, choose one of these options:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-navy-dark/60 border border-white/10">
                    <p className="font-semibold text-gold mb-1">Option 1: Direct Reset via Staff Email</p>
                    <p className="text-[11px] text-white/50">
                      Use the "Staff Reset" tab above with your Admin email to set a new password directly.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-dark/60 border border-white/10">
                    <p className="font-semibold text-gold mb-1">Option 2: Supabase SQL Editor (1-Click Emergency)</p>
                    <p className="text-[11px] text-white/50 mb-2">
                      Run this 1-line SQL query in your Supabase SQL Editor:
                    </p>
                    <pre className="p-2 rounded bg-black/60 text-emerald-400 font-mono text-[10px] overflow-x-auto select-all">
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
