'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Query the staff table directly — no Supabase Auth required
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

      // Check password
      const storedPassword = staffData.password_hash;

      if (!storedPassword) {
        // No password set yet — still let them in (admin must set password via Lock icon)
        setAuthSessionCookie(cleanEmail);
        window.location.href = '/';
        return;
      }

      if (storedPassword !== password) {
        setError('Incorrect password. Please try again or ask your Admin to reset it.');
        setLoading(false);
        return;
      }

      // ✅ Password matches — log in
      setAuthSessionCookie(cleanEmail);
      window.location.href = '/';

    } catch (err: any) {
      setError('Unable to connect. Please check your internet connection and try again.');
      setLoading(false);
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
              <label htmlFor="password" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                Password
              </label>
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
    </div>
  );
}
