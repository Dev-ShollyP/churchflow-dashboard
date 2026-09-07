import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.username || body.email || '').trim().toLowerCase();
    const password = body.password;
    const name = body.name;
    const role = body.role || 'followup_team';
    const branchId = body.branchId;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if staff with this username/email already exists
    const { data: existing } = await supabase
      .from('staff')
      .select('id, email')
      .eq('email', identifier)
      .single();

    if (existing) {
      // Update existing staff record with new password
      const { error: plainUpdateError } = await supabase
        .from('staff')
        .update({
          password_hash: password,
          full_name: name || undefined,
          role: role || undefined,
          is_active: true
        })
        .eq('id', existing.id);

      if (plainUpdateError) {
        return NextResponse.json({ error: plainUpdateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Password updated successfully for ${identifier}. They can log in immediately!` });
    }

    // Resolve branch ID
    const { data: branchData } = await supabase
      .from('branches')
      .select('id')
      .limit(1)
      .single();

    const finalBranchId = branchId || branchData?.id || '22222222-2222-2222-2222-222222222222';

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
        email: identifier,
        full_name: name || identifier,
        role: role,
        permissions: defaultPerms[role] || defaultPerms.followup_team,
        password_hash: password,
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Account created for "${identifier}"! They can now log in immediately with their username and password.`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create staff account' }, { status: 500 });
  }
}
