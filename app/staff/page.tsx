'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { createClient, getCurrentStaff, StaffMember, StaffRole, PermissionKey, roleLabels, defaultRolePermissions, isAdmin } from '@/lib/supabase';
import { UserCheck, Shield, Trash2, Edit3, AlertCircle, CheckCircle2, UserPlus, Lock, CheckSquare, Square, Eye, EyeOff } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const allPermissionKeys: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'overview', label: 'Overview Dashboard', desc: 'View church metrics & high-level stats' },
  { key: 'members', label: 'Members Directory', desc: 'View registered member contacts & phones' },
  { key: 'conversations', label: 'WhatsApp Conversations', desc: 'View live conversation threads & chat logs' },
  { key: 'prayers', label: 'Prayer Requests', desc: 'View and manage member prayer requests' },
  { key: 'events', label: 'Events & Programs', desc: 'View church events calendar & schedules' },
  { key: 'upload', label: 'Upload Program Flyers', desc: 'Upload flyers and publish events to n8n AI' },
  { key: 'onboarding', label: 'Member Onboarding Kit', desc: 'Print QR code posters and Sunday bulletin slips' },
  { key: 'staff', label: 'Staff & Permissions', desc: 'Manage team access, roles, and delete staff' },
  { key: 'settings', label: 'System Settings', desc: 'View WhatsApp session status & AI configs' },
];

export default function StaffManagementPage() {
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('followup_team');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);

  const [setPasswordTarget, setSetPasswordTarget] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  const handleSetExistingPassword = async () => {
    if (!setPasswordTarget || !resetPassword || resetPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSettingPassword(true);
    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: setPasswordTarget.email,
          password: resetPassword,
          name: setPasswordTarget.full_name,
          role: setPasswordTarget.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `✅ Password set for ${setPasswordTarget.email}. They can now sign in!` });
      setSetPasswordTarget(null);
      setResetPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSettingPassword(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    const supabase = createClient();
    const [curr, listRes] = await Promise.all([
      getCurrentStaff(),
      supabase.from('staff').select('*').order('created_at', { ascending: false }),
    ]);

    if (curr && !isAdmin(curr)) {
      window.location.href = '/';
      return;
    }

    setCurrentStaff(curr);
    setStaffList((listRes.data as StaffMember[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleRoleChange = async (staffId: string, role: StaffRole) => {
    setMessage(null);
    const supabase = createClient();
    const newPerms = defaultRolePermissions[role];

    const { error } = await supabase
      .from('staff')
      .update({ role, permissions: newPerms })
      .eq('id', staffId);

    if (error) {
      setMessage({ type: 'error', text: `Failed to update role: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Staff role & default permissions updated!' });
      fetchStaff();
    }
  };

  const handleDeleteStaff = async (staffId: string, email: string) => {
    if (currentStaff?.id === staffId) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to delete staff member "${email}"? This action cannot be undone.`)) {
      return;
    }

    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from('staff').delete().eq('id', staffId);

    if (error) {
      setMessage({ type: 'error', text: `Failed to delete staff: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `Staff member ${email} deleted successfully.` });
      fetchStaff();
    }
  };

  const openPermissionEditor = (member: StaffMember) => {
    setEditingStaff(member);
    setSelectedPermissions(member.permissions || defaultRolePermissions[member.role] || []);
  };

  const togglePermission = (key: PermissionKey) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(k => k !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingStaff) return;
    setUpdatingPermissions(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('staff')
      .update({ permissions: selectedPermissions })
      .eq('id', editingStaff.id);

    if (error) {
      setMessage({ type: 'error', text: `Failed to update permissions: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `Custom permissions saved for ${editingStaff.email}` });
      setEditingStaff(null);
      fetchStaff();
    }
    setUpdatingPermissions(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setAddingStaff(true);
    setMessage(null);

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          name: newName,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add staff member.');

      setMessage({ type: 'success', text: `✅ Account created for ${newEmail}! They can now sign in with the password you set.` });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchStaff();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add staff member.' });
    } finally {
      setAddingStaff(false);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Staff & Role Permissions"
        subtitle="Manage church team access, assign roles (Admin, Pastor, Media, Follow-up, Prayer), customize page permissions, and delete staff."
      />

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff List Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h2 className="font-display font-semibold text-white text-sm">Church Staff Team ({staffList.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/40 text-sm">Loading staff members...</div>
          ) : staffList.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={UserCheck} title="No staff members registered" description="Add team members to assign roles." />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {staffList.map((member) => {
                const isSuperAdmin = member.email?.includes('everflourishingarea') || member.email?.includes('olushola');

                return (
                  <div key={member.id} className="p-4 flex items-center justify-between gap-4 table-row-hover">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0 shadow-sm"
                        style={{ background: isSuperAdmin ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
                      >
                        {(member.full_name || member.email || 'S')[0]?.toUpperCase() ?? 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{member.full_name || member.email}</p>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              SUPERADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as StaffRole)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/40 text-gold border border-gold/30 focus:outline-none cursor-pointer"
                      >
                        {Object.entries(roleLabels).map(([rKey, rObj]) => (
                          <option key={rKey} value={rKey} className="bg-slate-900 text-white">
                            {rObj.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => { setSetPasswordTarget(member); setResetPassword(''); }}
                        className="p-2 rounded-xl text-xs text-white/50 hover:text-gold hover:bg-white/10 border border-white/10 transition-colors"
                        title="Set Login Password"
                      >
                        <Lock size={15} />
                      </button>

                      <button
                        onClick={() => openPermissionEditor(member)}
                        className="p-2 rounded-xl text-xs text-white/60 hover:text-gold hover:bg-white/10 border border-white/10 transition-colors"
                        title="Customize Permissions"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteStaff(member.id, member.email)}
                        className="p-2 rounded-xl text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-colors"
                        title="Delete Staff User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Staff Form */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white text-base mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-gold" /> Add Team Member
          </h3>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Media Director / Deacon Ayobami"
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="team@evfsanctuary.org"
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                Login Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Set a login password (min. 6 chars)"
                  className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-white/30 mt-1">Share this password with the staff member so they can sign in.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                Assign Role
              </label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as StaffRole)}
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
              >
                {Object.entries(roleLabels).map(([rKey, rObj]) => (
                  <option key={rKey} value={rKey} className="bg-slate-900">
                    {rObj.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={addingStaff}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold btn-gold shadow-gold"
              >
                {addingStaff ? 'Creating Account...' : 'Create Staff Account'}
              </button>
            </div>
          </form>

          {/* Role Explanations */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 text-xs">
            <h4 className="font-semibold text-gold">Role Permissions Overview:</h4>
            {Object.entries(roleLabels).map(([rKey, rObj]) => (
              <div key={rKey}>
                <p className="font-semibold text-white">{rObj.label}:</p>
                <p className="text-white/40">{rObj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Custom Permissions Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-lg">Custom Permissions</h3>
                <p className="text-xs text-white/40">{editingStaff.full_name || editingStaff.email}</p>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${roleLabels[editingStaff.role]?.badgeClass}`}>
                {roleLabels[editingStaff.role]?.label}
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {allPermissionKeys.map((p) => {
                const isSelected = selectedPermissions.includes(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePermission(p.key)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white/10 border-gold/40 text-white'
                        : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">{p.label}</p>
                      <p className="text-[11px] text-white/40">{p.desc}</p>
                    </div>
                    {isSelected ? (
                      <CheckSquare size={18} className="text-gold flex-shrink-0" />
                    ) : (
                      <Square size={18} className="text-white/20 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={updatingPermissions}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold"
              >
                {updatingPermissions ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {setPasswordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 space-y-5 animate-popover border border-gold/30">
            <div className="border-b border-white/10 pb-4">
              <h3 className="font-display font-semibold text-white text-lg flex items-center gap-2">
                <Lock size={18} className="text-gold" /> Set Login Password
              </h3>
              <p className="text-xs text-white/40 mt-1">{setPasswordTarget.full_name || setPasswordTarget.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setSetPasswordTarget(null); setResetPassword(''); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass"
              >
                Cancel
              </button>
              <button
                onClick={handleSetExistingPassword}
                disabled={settingPassword || resetPassword.length < 6}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold disabled:opacity-50"
              >
                {settingPassword ? 'Setting...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
