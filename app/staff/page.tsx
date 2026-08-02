'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { createClient, getCurrentStaff, StaffMember, StaffRole, PermissionKey, roleLabels, defaultRolePermissions } from '@/lib/supabase';
import { UserCheck, Shield, Trash2, Edit3, Plus, AlertCircle, CheckCircle2, UserPlus, Lock, CheckSquare, Square } from 'lucide-react';
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

  // Edit Permissions Modal
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  // New Staff State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('followup_team');
  const [addingStaff, setAddingStaff] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    const supabase = createClient();
    const [curr, listRes] = await Promise.all([
      getCurrentStaff(),
      supabase.from('staff').select('*').order('created_at', { ascending: false }),
    ]);
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

    setAddingStaff(true);
    setMessage(null);
    const supabase = createClient();

    try {
      const { data: branchData } = await supabase.from('branches').select('id').limit(1).single();
      const branchId = branchData?.id;
      const initialPerms = defaultRolePermissions[newRole];

      const { error } = await supabase.from('staff').insert({
        branch_id: branchId,
        email: newEmail,
        full_name: newName || newEmail.split('@')[0],
        role: newRole,
        permissions: initialPerms,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `Staff record created for ${newEmail}. Have them sign in to activate.` });
      setNewEmail('');
      setNewName('');
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
        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
            : 'bg-red-500/15 border border-red-500/25 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff List Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-5 border-b border-white/6 flex items-center justify-between">
            <h2 className="font-display font-semibold text-white text-sm">Church Staff Team ({staffList.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/30 text-sm">Loading staff members...</div>
          ) : staffList.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={UserCheck} title="No staff members registered" description="Add team members to assign roles." />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {staffList.map((member) => {
                const isSuperAdmin = member.email?.includes('everflourishingarea') || member.email?.includes('olushola');
                const roleData = roleLabels[member.role] ?? roleLabels.pastor;

                return (
                  <div key={member.id} className="p-4 flex items-center justify-between gap-4 table-row-hover">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-navy-dark flex-shrink-0"
                        style={{ background: isSuperAdmin ? 'linear-gradient(135deg, #EF4444, #991B1B)' : 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                        {(member.full_name || member.email || 'S')[0]?.toUpperCase() ?? 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{member.full_name || member.email}</p>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              SUPERADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/35">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role Selector */}
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as StaffRole)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-dark text-gold border border-gold/30 focus:outline-none cursor-pointer"
                      >
                        {Object.entries(roleLabels).map(([rKey, rObj]) => (
                          <option key={rKey} value={rKey}>
                            {rObj.label}
                          </option>
                        ))}
                      </select>

                      {/* Custom Permissions Button */}
                      <button
                        onClick={() => openPermissionEditor(member)}
                        className="p-2 rounded-lg text-xs text-white/50 hover:text-gold hover:bg-gold/10 border border-white/10 transition-colors"
                        title="Customize Permissions"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete Staff Button */}
                      <button
                        onClick={() => handleDeleteStaff(member.id, member.email)}
                        className="p-2 rounded-lg text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-colors"
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
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
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
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                Assign Role
              </label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as StaffRole)}
                className="w-full px-3.5 py-2 rounded-xl text-sm text-white bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              >
                {Object.entries(roleLabels).map(([rKey, rObj]) => (
                  <option key={rKey} value={rKey}>
                    {rObj.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={addingStaff}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-navy-dark transition-all shadow-gold"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)' }}
              >
                {addingStaff ? 'Adding Team Member...' : 'Add Team Member'}
              </button>
            </div>
          </form>

          {/* Role Explanations */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 text-xs">
            <h4 className="font-semibold text-gold">Role Permissions Overview:</h4>
            {Object.entries(roleLabels).map(([rKey, rObj]) => (
              <div key={rKey}>
                <p className="font-medium text-white">{rObj.label}:</p>
                <p className="text-white/40">{rObj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Granular Permissions Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 animate-slide-up border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-lg">Custom Permissions</h3>
                <p className="text-xs text-white/40">{editingStaff.full_name || editingStaff.email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleLabels[editingStaff.role]?.badgeClass}`}>
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
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-navy-mid/80 border-gold/40 text-white'
                        : 'bg-navy-dark/40 border-white/5 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-white/40">{p.desc}</p>
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={updatingPermissions}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-dark shadow-gold"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)' }}
              >
                {updatingPermissions ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
