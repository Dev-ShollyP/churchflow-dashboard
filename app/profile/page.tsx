'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { getCurrentStaff, StaffMember, roleLabels, getSessionEmail } from '@/lib/supabase';
import { User, Lock, Camera, CheckCircle2, AlertCircle, Eye, EyeOff, Save, Upload } from 'lucide-react';

export default function ProfilePage() {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile info
  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Messages
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentStaff().then((s) => {
      setStaff(s);
      setFullName(s?.full_name || '');
      setAvatarPreview((s as any)?.avatar_url || null);
      setLoading(false);
    });
  }, []);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be under 500KB. Please compress it first.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      setProfileMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/staff/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          avatarUrl: avatarPreview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      // Update the page display
      setStaff(prev => prev ? { ...prev, full_name: fullName } : prev);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/staff/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const roleInfo = staff ? (roleLabels[staff.role] ?? roleLabels.followup_team) : null;
  const initials = (staff?.full_name || staff?.email || 'S')[0]?.toUpperCase() ?? 'S';

  return (
    <DashboardShell>
      <PageHeader
        title="My Profile"
        subtitle="Update your name, profile picture, and login password"
      />

      {loading ? (
        <div className="text-center text-white/30 text-sm py-16">Loading profile...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Avatar + Info */}
          <div className="glass-card p-6 flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold font-display text-navy-dark">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-navy-dark transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}
                title="Change profile picture"
              >
                <Camera size={13} className="text-navy-dark" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>

            <div>
              <p className="font-display font-semibold text-white text-lg">{staff?.full_name || 'Staff Member'}</p>
              <p className="text-xs text-white/40 mt-0.5">{staff?.email}</p>
              {roleInfo && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}>
                  {roleInfo.label}
                </span>
              )}
            </div>

            <p className="text-[11px] text-white/30 leading-relaxed">
              Click the camera icon to upload a new profile photo (max 500KB).
            </p>
          </div>

          {/* RIGHT: Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info Card */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-white text-base mb-5 flex items-center gap-2">
                <User size={17} className="text-gold" /> Personal Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={staff?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white/30 bg-navy-dark/30 border border-white/5 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-white/25 mt-1">Email cannot be changed. Contact Admin if needed.</p>
                </div>

                {profileMsg && (
                  <div className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/25 text-red-300'
                  }`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {profileMsg.text}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-navy-dark disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)', boxShadow: '0 4px 16px rgba(201,168,76,0.2)' }}
                >
                  {savingProfile ? (
                    <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-white text-base mb-5 flex items-center gap-2">
                <Lock size={17} className="text-gold" /> Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>

                {passwordMsg && (
                  <div className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/25 text-red-300'
                  }`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {passwordMsg.text}
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-navy-dark disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)', boxShadow: '0 4px 16px rgba(201,168,76,0.2)' }}
                >
                  {savingPassword ? (
                    <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                  ) : (
                    <Lock size={15} />
                  )}
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardShell>
  );
}
