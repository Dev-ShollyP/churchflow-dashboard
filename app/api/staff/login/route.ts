import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // PRIMARY: Check staff table for email + password
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (staffData) {
      // Staff member found in database
      const storedPassword = staffData.password_hash;

      if (!storedPassword) {
        // Staff exists but has no password set yet — allow login for now
        // and prompt admin to set their password
        return NextResponse.json({
          success: true,
          email: cleanEmail,
          role: staffData.role,
          warning: 'No password set. Please ask Admin to set your password via Staff & Permissions page.'
        });
      }

      // Verify password (plain text comparison — simple but works for now)
      if (storedPassword === password) {
        return NextResponse.json({
          success: true,
          email: cleanEmail,
          role: staffData.role,
          name: staffData.full_name,
        });
      }

      // Wrong password
      return NextResponse.json({
        error: 'Incorrect password. Please try again or contact your church administrator.'
      }, { status: 401 });
    }

    // SUPERADMIN fallback: hardcoded admin emails can use Supabase Auth
    const isAdminEmail = cleanEmail.includes('everflourishingarea') || cleanEmail.includes('olushola');

    if (isAdminEmail) {
      // Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authError && authData?.user) {
        return NextResponse.json({ success: true, email: cleanEmail, role: 'developer' });
      }

      // If Supabase auth fails too, try staff table again with wider search
      return NextResponse.json({
        error: 'Invalid credentials. Please check your email and password.'
      }, { status: 401 });
    }

    // Not in staff table at all
    return NextResponse.json({
      error: 'This email is not registered in the Church Staff directory. Please ask an Admin to add you under Staff & Permissions.'
    }, { status: 404 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
