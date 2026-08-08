import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prayer_id, status, request_text, member_phone } = await request.json();

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

    if (prayer_id) {
      // Update existing prayer_requests table row
      const { error } = await supabase
        .from('prayer_requests')
        .update({ status })
        .eq('id', prayer_id);

      if (error) throw new Error(error.message);
    } else if (request_text) {
      // Create new explicit prayer request row if converting from message
      let memberId = null;
      if (member_phone) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('phone', member_phone)
          .single();
        memberId = member?.id;
      }

      const { error } = await supabase.from('prayer_requests').insert({
        member_id: memberId,
        request_text,
        status: status || 'pending',
      });

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update prayer request' }, { status: 500 });
  }
}
