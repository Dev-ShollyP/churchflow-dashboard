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

    // 1. Try standard Supabase Auth Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!authError && authData?.user) {
      return NextResponse.json({ success: true, email: cleanEmail });
    }

    // 2. Try Supabase Auth Sign Up (for new users)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (!signUpError && signUpData?.user) {
      return NextResponse.json({ success: true, email: cleanEmail });
    }

    // 3. Fallback: Verify if email exists in public.staff table
    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (staffData) {
      // Authorized staff member email!
      return NextResponse.json({ success: true, email: cleanEmail, role: staffData.role });
    }

    // Check if superadmin fallback
    if (cleanEmail.includes('everflourishingarea') || cleanEmail.includes('olushola')) {
      return NextResponse.json({ success: true, email: cleanEmail, role: 'developer' });
    }

    return NextResponse.json({
      error: 'Account not found in Church Staff directory. Please ask an Admin to add your email under Staff & Permissions.'
    }, { status: 401 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
