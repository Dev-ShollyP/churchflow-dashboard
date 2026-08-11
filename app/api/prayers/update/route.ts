import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prayer_id, status, request_text, member_phone } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const isAnswered = status === 'answered' || status === 'completed';
    const targetStatus = isAnswered ? 'completed' : 'pending';

    if (prayer_id) {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ status: targetStatus, answered: isAnswered })
        .eq('id', prayer_id);

      if (error) {
        console.error('[API Prayer Update Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (request_text) {
      let memberId = null;
      if (member_phone) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('phone', member_phone)
          .limit(1)
          .maybeSingle();
        memberId = member?.id || null;
      }

      const { error } = await supabase.from('prayer_requests').insert({
        branch_id: '22222222-2222-2222-2222-222222222222',
        member_id: memberId,
        request: request_text,
        status: targetStatus,
        answered: isAnswered,
      });

      if (error) {
        console.error('[API Prayer Insert Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Prayer Handler Exception]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update prayer request' }, { status: 500 });
  }
}
