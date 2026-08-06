import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, name, role, branchId } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if staff with this email already exists
    const { data: existing } = await supabase
      .from('staff')
      .select('id, email')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      // Update existing staff record with new password hash
      const { error: updateError } = await supabase.rpc('set_staff_password', {
        p_email: cleanEmail,
        p_password: password,
      });

      if (updateError) {
        // Fallback: store password as plain text temporarily (will be migrated)
        const { error: plainUpdateError } = await supabase
          .from('staff')
          .update({ password_hash: password })
          .eq('email', cleanEmail);

        if (plainUpdateError) {
          return NextResponse.json({ error: plainUpdateError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, message: 'Password set successfully for existing staff member.' });
    }

    // Create new staff record
    const { data: branchData } = await supabase
      .from('branches')
      .select('id')
      .limit(1)
      .single();

    const finalBranchId = branchId || branchData?.id;

    const defaultPerms: Record<string, string[]> = {
      admin: ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'onboarding', 'staff', 'settings'],
      pastor: ['overview', 'members', 'conversations', 'prayers', 'events', 'onboarding'],
      media_team: ['upload', 'events', 'onboarding'],
      followup_team: ['members', 'conversations', 'prayers'],
      prayer_team: ['prayers'],
      developer: ['overview', 'members', 'conversations', 'prayers', 'events', 'upload', 'onboarding', 'staff', 'settings'],
    };

    const { error: insertError } = await supabase
      .from('staff')
      .insert({
        branch_id: finalBranchId,
        email: cleanEmail,
        full_name: name || cleanEmail.split('@')[0],
        role: role || 'followup_team',
        permissions: defaultPerms[role] || defaultPerms.followup_team,
        password_hash: password, // stored as plain text; will verify plainly until bcrypt RPC is set up
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Staff member created with login credentials.' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create staff member' }, { status: 500 });
  }
}
