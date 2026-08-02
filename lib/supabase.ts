import { createBrowserClient } from '@supabase/ssr';

export type StaffRole = 'admin' | 'pastor' | 'media_team' | 'followup_team' | 'prayer_team';

export type PermissionKey = 
  | 'overview'
  | 'members'
  | 'conversations'
  | 'prayers'
  | 'events'
  | 'upload'
  | 'onboarding'
  | 'staff'
  | 'settings';

export interface StaffMember {
  id: string;
  branch_id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  permissions?: PermissionKey[];
  created_at: string;
}

export const defaultRolePermissions: Record<StaffRole, PermissionKey[]> = {
  admin: ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'onboarding', 'staff', 'settings'],
  pastor: ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'onboarding', 'staff', 'settings'],
  media_team: ['overview', 'events', 'upload', 'onboarding', 'members'],
  followup_team: ['overview', 'conversations', 'members'],
  prayer_team: ['overview', 'prayers', 'members', 'conversations'],
};

export const roleLabels: Record<StaffRole, { label: string; badgeClass: string; desc: string }> = {
  admin: { label: 'Admin / Developer', badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30', desc: 'Full superuser access & system management' },
  pastor: { label: 'Pastor', badgeClass: 'bg-gold/15 text-gold border-gold/30', desc: 'Full pastoral overview, staff, & settings access' },
  media_team: { label: 'Media Team', badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Upload program flyers, events, onboarding, & members' },
  followup_team: { label: 'Follow-up Team', badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Conversations & member follow-up' },
  prayer_team: { label: 'Prayer Team', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Prayer requests, conversations, & member details' },
};

// Client Component Safe Supabase Client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Branch ID helper
export async function getBranchId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('whatsapp_sessions')
    .select('branch_id')
    .eq('status', 'connected')
    .limit(1)
    .single();
  return data?.branch_id ?? null;
}

// Get Current Logged-in Staff Member with Role & Permissions
export async function getCurrentStaff(): Promise<StaffMember | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!data) {
    const isSuperAdmin = user.email?.includes('everflourishingarea') || user.email?.includes('olushola');
    const assignedRole: StaffRole = isSuperAdmin ? 'admin' : 'pastor';
    return {
      id: user.id,
      branch_id: '',
      email: user.email ?? '',
      full_name: user.email?.split('@')[0] ?? 'Staff',
      role: assignedRole,
      permissions: defaultRolePermissions[assignedRole],
      created_at: new Date().toISOString(),
    };
  }

  const staffRole: StaffRole = (data.role as StaffRole) ?? 'pastor';
  const customPermissions = Array.isArray(data.permissions) && data.permissions.length > 0
    ? data.permissions
    : defaultRolePermissions[staffRole];

  return {
    ...data,
    role: staffRole,
    permissions: customPermissions,
  } as StaffMember;
}
