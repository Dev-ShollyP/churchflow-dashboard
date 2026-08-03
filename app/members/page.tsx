'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Phone, Calendar, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Member {
  id: string;
  full_name: string | null;
  phone: string;
  created_at: string;
  membership_status: string | null;
}

type StatusFilter = 'all' | 'active' | 'visitor' | 'inactive';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const fetchMembers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('members')
      .select('id, full_name, phone, created_at, membership_status')
      .order('created_at', { ascending: false })
      .limit(200);

    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Update Status via API Route for 100% reliability on Vercel
  const handleStatusChange = async (memberId: string, newStatus: string) => {
    setUpdatingId(memberId);
    setToast(null);

    try {
      const res = await fetch('/api/members/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: newStatus }),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        setToast({ type: 'error', text: `Failed to update status: ${resData.error || 'Server error'}` });
      } else {
        setToast({ type: 'success', text: `Member status updated to "${newStatus}"` });
        setMembers(prev =>
          prev.map(m => m.id === memberId ? { ...m, membership_status: newStatus } : m)
        );
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to update member status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered members list based on search and status filter
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone || '').includes(searchQuery);

    const status = (member.membership_status || 'visitor').toLowerCase();
    const matchesStatus =
      selectedStatus === 'all' ? true : status.includes(selectedStatus);

    return matchesSearch && matchesStatus;
  });

  const activeCount = members.filter(m => ['active', 'member'].includes((m.membership_status || '').toLowerCase())).length;
  const visitorCount = members.filter(m => !['active', 'member'].includes((m.membership_status || '').toLowerCase())).length;

  return (
    <DashboardShell>
      <PageHeader
        title="Members Directory"
        subtitle={`${members.length} total WhatsApp contacts · ${activeCount} Active Members · ${visitorCount} Visitors`}
      />

      {toast && (
        <div className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 animate-fade-in ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
            : 'bg-red-500/15 border border-red-500/25 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Search Bar & Filter Controls */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name or phone number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/30 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
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

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-white/40 flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={12} /> Status:
          </span>

          {(['all', 'active', 'visitor', 'inactive'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex-shrink-0 ${
                selectedStatus === st
                  ? 'bg-gold text-navy-dark shadow-gold'
                  : 'bg-navy-dark/60 text-white/60 border border-white/8 hover:text-white hover:bg-white/5'
              }`}
            >
              {st === 'all' ? `All (${members.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/30 text-sm">Loading members directory...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Users}
              title={searchQuery || selectedStatus !== 'all' ? "No matching members found" : "No members registered yet"}
              description={searchQuery || selectedStatus !== 'all' ? "Try adjusting your search query or filter." : "Members will appear here as they message the WhatsApp bot."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">Member Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">Phone Number</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">Joined Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">Status (Click to Change)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member: Member, idx: number) => {
                  const currentSt = (member.membership_status || 'visitor').toLowerCase();
                  const isUpdating = updatingId === member.id;
                  const isActive = currentSt === 'active' || currentSt === 'member';

                  return (
                    <tr key={member.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${idx * 15}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-navy-dark flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                            {(member.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-white">{member.full_name ?? 'Unknown Member'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-white/60">
                          <Phone size={12} />
                          {member.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-white/40">
                          <Calendar size={12} />
                          {member.created_at ? format(parseISO(member.created_at), 'MMM d, yyyy') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={isActive ? 'active' : currentSt === 'inactive' ? 'inactive' : 'visitor'}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(member.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border focus:outline-none cursor-pointer transition-all ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : currentSt === 'inactive'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                                : 'bg-gold/15 text-gold border-gold/30 hover:bg-gold/25'
                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <option value="visitor" className="bg-navy-dark text-white">visitor</option>
                            <option value="active" className="bg-navy-dark text-white">active member</option>
                            <option value="inactive" className="bg-navy-dark text-white">inactive</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Count Footer */}
      {!loading && filteredMembers.length > 0 && (
        <div className="mt-4 text-xs text-white/30 px-1 text-right">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      )}
    </DashboardShell>
  );
}
