import { createBrowserClient } from '@supabase/ssr';

export type StaffRole = 'admin' | 'pastor' | 'media_team' | 'followup_team' | 'prayer_team' | 'developer';

export type PermissionKey = 
  | 'overview'
  | 'members'
  | 'conversations'
  | 'prayers'
  | 'events'
  | 'upload'
  | 'programs'
  | 'onboarding'
  | 'staff'
  | 'settings'
  | 'hymns';

export interface StaffMember {
  id: string;
  branch_id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  permissions?: PermissionKey[];
  avatar_url?: string | null;
  created_at: string;
}

export const defaultRolePermissions: Record<StaffRole, PermissionKey[]> = {
  admin:        ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'programs', 'onboarding', 'staff', 'settings', 'hymns'],
  developer:    ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'programs', 'onboarding', 'staff', 'settings', 'hymns'],
  pastor:       ['overview', 'members', 'conversations', 'prayers', 'events', 'programs', 'onboarding', 'hymns'],
  media_team:   ['events', 'upload', 'programs', 'onboarding', 'hymns'],
  followup_team:['overview', 'conversations', 'members', 'hymns'],
  prayer_team:  ['overview', 'prayers', 'members', 'conversations', 'hymns'],
};

export const roleLabels: Record<StaffRole, { label: string; badgeClass: string; desc: string }> = {
  admin:        { label: 'Admin / Developer', badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30', desc: 'Full superuser access & system management' },
  developer:    { label: 'Admin / Developer', badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30', desc: 'Full superuser access & system management' },
  pastor:       { label: 'Pastor', badgeClass: 'bg-gold/15 text-gold border-gold/30', desc: 'Full pastoral overview, staff, & settings access' },
  media_team:   { label: 'Media Team', badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Upload program flyers, events, onboarding, & members' },
  followup_team:{ label: 'Follow-up Team', badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Conversations & member follow-up' },
  prayer_team:  { label: 'Prayer Team', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Prayer requests, conversations, & member details' },
};

// Client Component Safe Supabase Client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Get the email stored in the session cookie (client-side)
export function getSessionEmail(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/churchflow_staff_email=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
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

// Get Current Logged-in Staff Member from cookie email
export async function getCurrentStaff(): Promise<StaffMember | null> {
  const email = getSessionEmail();
  if (!email) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('email', email)
    .single();

  if (!data) {
    // Fallback for superadmin
    const isAdmin = email.includes('everflourishingarea') || email.includes('olushola');
    const assignedRole: StaffRole = isAdmin ? 'developer' : 'followup_team';
    return {
      id: '',
      branch_id: '',
      email,
      full_name: email.split('@')[0],
      role: assignedRole,
      permissions: defaultRolePermissions[assignedRole],
      created_at: new Date().toISOString(),
    };
  }

  const staffRole: StaffRole = (data.role as StaffRole) ?? 'followup_team';
  // Use custom permissions if set, otherwise use role defaults
  const customPermissions = Array.isArray(data.permissions) && data.permissions.length > 0
    ? data.permissions as PermissionKey[]
    : defaultRolePermissions[staffRole];

  return {
    ...data,
    role: staffRole,
    permissions: customPermissions,
  } as StaffMember;
}

// Check if current staff has a specific permission
export function hasPermission(staff: StaffMember | null, key: PermissionKey): boolean {
  if (!staff) return false;
  if (staff.role === 'admin' || staff.role === 'developer') return true;
  return (staff.permissions ?? []).includes(key);
}

// Check if current staff is admin
export function isAdmin(staff: StaffMember | null): boolean {
  if (!staff) return false;
  return staff.role === 'admin' || staff.role === 'developer';
}
