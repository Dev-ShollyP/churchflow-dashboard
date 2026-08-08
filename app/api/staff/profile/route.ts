import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const emailCookie = cookieStore.get('churchflow_staff_email');
    const sessionCookie = cookieStore.get('churchflow_staff_session');

    if (!sessionCookie?.value || !emailCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email = decodeURIComponent(emailCookie.value);
    const body = await request.json();
    const { currentPassword, newPassword, avatarUrl, fullName } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch current staff record
    const { data: staffData, error: fetchError } = await supabase
      .from('staff')
      .select('password_hash, full_name')
      .eq('email', email)
      .single();

    if (fetchError || !staffData) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, any> = {};

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      const storedPassword = staffData.password_hash;
      if (storedPassword && storedPassword !== currentPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      updates.password_hash = newPassword;
    }

    // Handle avatar update
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    // Handle name update
    if (fullName && fullName.trim()) {
      updates.full_name = fullName.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('staff')
      .update(updates)
      .eq('email', email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
