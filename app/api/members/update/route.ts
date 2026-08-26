import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, full_name, membership_status, phone } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

    if (full_name !== undefined) {
      updatePayload.full_name = full_name.trim();
    }
    if (membership_status !== undefined) {
      updatePayload.membership_status = membership_status.trim();
    }
    if (phone !== undefined) {
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        cleanPhone = '234' + cleanPhone.slice(1);
      }
      updatePayload.phone = cleanPhone;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .update(updatePayload)
      .eq('id', memberId)
      .select();

    if (error) {
      console.error('Member update Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: data?.[0] || null });
  } catch (err: any) {
    console.error('Member update API crash:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
