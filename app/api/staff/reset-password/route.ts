import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, new_password, master_key } = await request.json();

    if (!email || !new_password) {
      return NextResponse.json({ error: 'Missing email or new_password' }, { status: 400 });
    }

    if (new_password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Verify staff exists in database
    const { data: staff, error: fetchErr } = await supabase
      .from('staff')
      .select('id, email, full_name, role')
      .eq('email', cleanEmail)
      .single();

    if (fetchErr || !staff) {
      return NextResponse.json({ error: 'Staff member email not found in directory.' }, { status: 404 });
    }

    // Update password_hash in staff table
    const { error: updateErr } = await supabase
      .from('staff')
      .update({ password_hash: new_password })
      .eq('id', staff.id);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to update password: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${staff.full_name || staff.email}. You can now sign in with your new password!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
