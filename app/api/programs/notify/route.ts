import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      program_id,
      title,
      description,
      program_date,
      end_date,
      flyer_url,
      image_url,
      send_broadcast = true,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Program title is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    let broadcastCount = 0;

    if (send_broadcast) {
      // 1. Fetch active church members for broadcast dispatch
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, full_name, phone')
        .not('phone', 'is', null);

      if (!membersError && members && members.length > 0) {
        broadcastCount = members.length;

        // 2. Queue broadcast notifications in Supabase outbound log
        const notifications = members.map((member) => ({
          member_id: member.id,
          phone: member.phone,
          message_type: 'special_program_reminder',
          content: `🔔 *RCCG Special Program*: ${title}\n📅 Date: ${program_date || 'Upcoming'}\n\n${description || 'Join us for a glorious time in God\'s presence!'}`,
          status: 'queued',
          metadata: {
            program_id,
            title,
            flyer_url: image_url || flyer_url,
          },
        }));

        await supabase.from('outbound_messages').insert(notifications).select();

        // 3. Optional: Trigger n8n webhook if N8N_BROADCAST_WEBHOOK_URL is configured
        const n8nWebhookUrl = process.env.N8N_BROADCAST_WEBHOOK_URL;
        if (n8nWebhookUrl) {
          try {
            await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'special_program_published',
                program_id,
                title,
                description,
                program_date,
                end_date,
                image_url: image_url || flyer_url,
                recipients: members,
              }),
            });
          } catch (n8nErr) {
            console.error('n8n broadcast webhook trigger failed:', n8nErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      program_id,
      broadcast_triggered: send_broadcast,
      recipients_queued: broadcastCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
