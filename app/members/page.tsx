'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import {
  Users, Phone, Calendar, Search, Filter, CheckCircle2, AlertCircle,
  Edit3, Check, X, RefreshCw, Sparkles, UserCheck, Shield, Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Member {
  id: string;
  full_name: string | null;
  phone: string;
  created_at: string;
  membership_status: string | null;
}

export const CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  active:       { label: 'Active Member', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', desc: 'Regular church member' },
  member:       { label: 'Active Member', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', desc: 'Regular church member' },
  youth:        { label: 'Youth & Singles (YAYA)', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', desc: 'Youth & young adults' },
  worker:       { label: 'Worker & Minister', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40', desc: 'Church worker / departmental leader' },
  first_timer:  { label: 'First Timer / Convert', badgeClass: 'bg-gold/20 text-gold border-gold/40', desc: 'New visitor / first timer' },
  visitor:      { label: 'First Timer / Convert', badgeClass: 'bg-gold/20 text-gold border-gold/40', desc: 'New visitor / first timer' },
  inactive:     { label: 'Inactive', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40', desc: 'Dormant or unreached contact' },
};

type GroupFilter = 'all' | 'active' | 'youth' | 'worker' | 'first_timer' | 'inactive';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>('all');

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('active');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('members')
      .select('id, full_name, phone, created_at, membership_status')
      .order('created_at', { ascending: false })
      .limit(300);

    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCategoryChange = async (memberId: string, newCategory: string) => {
    setUpdatingId(memberId);
    setToast(null);

    try {
      const res = await fetch('/api/members/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, membership_status: newCategory }),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        setToast({ type: 'error', text: `Failed to update category: ${resData.error || 'Server error'}` });
      } else {
        const config = CATEGORY_CONFIG[newCategory] || { label: newCategory };
        setToast({ type: 'success', text: `Member category updated to "${config.label}"` });
        setMembers(prev =>
          prev.map(m => m.id === memberId ? { ...m, membership_status: newCategory } : m)
        );
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to update member category.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setEditName(member.full_name || '');
    const st = (member.membership_status || 'first_timer').toLowerCase();
    setEditCategory(['active', 'youth', 'worker', 'first_timer', 'inactive'].includes(st) ? st : 'active');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/members/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: editingMember.id,
          full_name: editName.trim(),
          membership_status: editCategory
        })
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Failed to update member');
      }

      setMembers(prev =>
        prev.map(m => m.id === editingMember.id ? { ...m, full_name: editName.trim(), membership_status: editCategory } : m)
      );

      setToast({ type: 'success', text: `Updated ${editName.trim()} successfully!` });
      setEditingMember(null);
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to save member details' });
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone || '').includes(searchQuery);

    const status = (member.membership_status || 'first_timer').toLowerCase();

    let matchesGroup = true;
    if (selectedGroup === 'all') {
      matchesGroup = true;
    } else if (selectedGroup === 'active') {
      matchesGroup = status === 'active' || status === 'member';
    } else if (selectedGroup === 'first_timer') {
      matchesGroup = status === 'first_timer' || status === 'visitor';
    } else {
      matchesGroup = status === selectedGroup;
    }

    return matchesSearch && matchesGroup;
  });

  const activeCount = members.filter(m => ['active', 'member'].includes((m.membership_status || '').toLowerCase())).length;
  const youthCount = members.filter(m => (m.membership_status || '').toLowerCase() === 'youth').length;
  const workerCount = members.filter(m => (m.membership_status || '').toLowerCase() === 'worker').length;
  const firstTimerCount = members.filter(m => ['first_timer', 'visitor'].includes((m.membership_status || '').toLowerCase())).length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Members Directory & Groups"
          subtitle={`${members.length} WhatsApp contacts · ${activeCount} Active Members · ${youthCount} Youth · ${workerCount} Workers · ${firstTimerCount} First Timers`}
        />

        {toast && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, phone or group..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-white/40 flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter size={13} /> Group:
            </span>

            {[
              { id: 'all', label: `All (${members.length})` },
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'youth', label: `Youth (${youthCount})` },
              { id: 'worker', label: `Workers (${workerCount})` },
              { id: 'first_timer', label: `First Timers (${firstTimerCount})` },
              { id: 'inactive', label: 'Inactive' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedGroup(st.id as GroupFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedGroup === st.id
                    ? 'btn-gold shadow-gold'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Directory Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-white/40 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-gold" />
              Loading members directory...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={Users}
                title={searchQuery || selectedGroup !== 'all' ? "No matching members found" : "No members registered yet"}
                description={searchQuery || selectedGroup !== 'all' ? "Try adjusting search query or group filter." : "Members will automatically populate as they message the WhatsApp bot."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 whitespace-nowrap bg-white/5">
                    <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Member Name</th>
                    <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Phone Number</th>
                    <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Joined Date</th>
                    <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Assigned Category / Group</th>
                    <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 whitespace-nowrap">
                  {filteredMembers.map((member: Member, idx: number) => {
                    const rawSt = (member.membership_status || 'first_timer').toLowerCase();
                    const isUpdating = updatingId === member.id;
                    const catConfig = CATEGORY_CONFIG[rawSt] || CATEGORY_CONFIG.first_timer;

                    // Normalize value for the select dropdown
                    let selectVal = 'active';
                    if (rawSt === 'youth') selectVal = 'youth';
                    else if (rawSt === 'worker') selectVal = 'worker';
                    else if (rawSt === 'first_timer' || rawSt === 'visitor') selectVal = 'first_timer';
                    else if (rawSt === 'inactive') selectVal = 'inactive';

                    return (
                      <tr key={member.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${idx * 15}ms` }}>
                        {/* Member Name */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0 shadow-sm"
                              style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
                            >
                              {(member.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{member.full_name ?? 'Unknown Member'}</span>
                              <button
                                onClick={() => openEditModal(member)}
                                className="p-1 rounded-md text-white/30 hover:text-gold hover:bg-white/10 transition-colors"
                                title="Edit Name & Group"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <span className="flex items-center gap-1.5 text-white/70 text-sm font-mono">
                            <Phone size={13} className="text-gold/60" />
                            {member.phone}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <span className="flex items-center gap-1.5 text-white/40 text-xs">
                            <Calendar size={13} />
                            {member.created_at ? format(parseISO(member.created_at), 'MMM d, yyyy') : '—'}
                          </span>
                        </td>

                        {/* Category Dropdown */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <select
                            value={selectVal}
                            disabled={isUpdating}
                            onChange={(e) => handleCategoryChange(member.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none cursor-pointer transition-all ${
                              catConfig.badgeClass
                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <option value="active" className="bg-zinc-900 text-white">Active Member</option>
                            <option value="youth" className="bg-zinc-900 text-white">Youth & Singles (YAYA)</option>
                            <option value="worker" className="bg-zinc-900 text-white">Worker & Minister</option>
                            <option value="first_timer" className="bg-zinc-900 text-white">First Timer / Convert</option>
                            <option value="inactive" className="bg-zinc-900 text-white">Inactive</option>
                          </select>
                        </td>

                        {/* Quick Edit Action */}
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <button
                            onClick={() => openEditModal(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-medium transition-colors"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/80">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-gold" />
                  Edit Member Details
                </h2>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Full Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abraham Odefunso or Sis. Grace Adebayo"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/60 border border-white/20 text-sm focus:outline-none focus:border-gold/60 placeholder-white/30"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Phone: <span className="font-mono text-zinc-200">{editingMember.phone}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Category / Departmental Group
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-zinc-900 border border-white/20 text-sm focus:outline-none focus:border-gold/60"
                  >
                    <option value="active" className="bg-zinc-900 text-white">Active Member</option>
                    <option value="youth" className="bg-zinc-900 text-white">Youth & Singles (YAYA)</option>
                    <option value="worker" className="bg-zinc-900 text-white">Worker & Minister</option>
                    <option value="first_timer" className="bg-zinc-900 text-white">First Timer / Convert</option>
                    <option value="inactive" className="bg-zinc-900 text-white">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-gold/20"
                  >
                    {savingEdit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
