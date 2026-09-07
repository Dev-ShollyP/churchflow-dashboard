import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.username || body.email || '').trim().toLowerCase();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // PRIMARY: Check staff table for username/email match (case-insensitive)
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .or(`email.ilike.${identifier},full_name.ilike.${identifier}`);

    const staffData = staffList && staffList.length > 0 ? staffList[0] : null;

    if (staffData) {
      const storedPassword = staffData.password_hash;

      // If no password was set, allow login
      if (!storedPassword) {
        return NextResponse.json({
          success: true,
          username: staffData.email,
          email: staffData.email,
          role: staffData.role,
          name: staffData.full_name,
        });
      }

      // Plain text password comparison
      if (storedPassword === password) {
        return NextResponse.json({
          success: true,
          username: staffData.email,
          email: staffData.email,
          role: staffData.role,
          name: staffData.full_name,
        });
      }

      return NextResponse.json({
        error: 'Incorrect password. Please try again or ask your church administrator to reset it.'
      }, { status: 401 });
    }

    // SUPERADMIN fallback
    const isAdmin = identifier.includes('everflourishingarea') || identifier.includes('olushola') || identifier === 'admin';

    if (isAdmin) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier.includes('@') ? identifier : `${identifier}@churchflow.internal`,
        password,
      });

      if (!authError && authData?.user) {
        return NextResponse.json({ success: true, username: identifier, email: identifier, role: 'developer' });
      }
    }

    return NextResponse.json({
      error: `Username "${identifier}" is not found in the Church Staff directory. Ask an Admin to add you under Staff & Permissions.`
    }, { status: 404 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
