import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function sendMetaTemplateDirect(
  phoneNumberId: string,
  whatsappToken: string,
  formattedPhone: string,
  templateName: string,
  langCode: string,
  parameters: string[]
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const components = parameters.length > 0
      ? [
          {
            type: 'body',
            parameters: parameters.map((val) => ({ type: 'text', text: val })),
          },
        ]
      : [];

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: langCode },
          components,
        },
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: res.ok && !!data.messages, data };
  } catch (err: any) {
    return { ok: false, data: { error: { message: err.message } } };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      program_id,
      title,
      description,
      program_date,
      end_date,
      start_time,
      scripture,
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

    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('phone_number_id, access_token')
      .limit(1)
      .single();

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || session?.phone_number_id || '1252855381239526';
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || session?.access_token || 'EAGATFNQZCUQIBSEf9WbNE4la5u2lMVD0sPkfPUksFwtf7GiCAzUcx3pvl0rP2fwWf8xu2QJoJh0Ybuqx072cc0mUv0eLBFYS39WlxkmF8dTVOPJ4lwUTqOLzlWFTfCTgQZArkpI5tC3NWRZCGp0RW79px4olQuosTf88Ei2Lh3tZBGCpDFWar8X2ZA4I9aPQWagZDZD';

    let broadcastCount = 0;
    let deliveredCount = 0;

    if (send_broadcast) {
      // 1. Fetch active church members for broadcast dispatch (members marked 'active' or 'member' on dashboard)
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, full_name, phone, membership_status')
        .not('phone', 'is', null);

      const members = (allMembers || []).filter((m) => {
        const st = (m.membership_status || '').toLowerCase().trim();
        return st === 'active' || st === 'member';
      });

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

        // 3. Dispatch Meta Approved Template 'service_reminder' directly to all active members (bypassing 24h window)
        for (const member of members) {
          const formattedPhone = (member.phone || '').replace(/\D/g, '');
          if (!formattedPhone) continue;

          const memberFirstName = (member.full_name || '').trim().split(' ')[0] || 'Believer';

          // Template parameters:
          // {{1}} = Service / Program Title Upper (e.g. SPECIAL PROGRAM)
          // {{2}} = Offset (e.g. UPCOMING)
          // {{3}} = Member Name
          // {{4}} = Service Name
          // {{5}} = Date
          // {{6}} = Time
          // {{7}} = Scripture / Verse
          const params = [
            (title || 'SPECIAL PROGRAM').toUpperCase(),
            'UPCOMING',
            memberFirstName,
            title || 'Special Program',
            program_date || 'Upcoming Date',
            start_time || '6:00 PM',
            scripture ? `"${scripture}"` : '"For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end." — Jeremiah 29:11',
          ];

          let res = await sendMetaTemplateDirect(phoneNumberId, whatsappToken, formattedPhone, 'service_reminder', 'en', params);
          if (!res.ok && res.data?.error?.code === 132001) {
            res = await sendMetaTemplateDirect(phoneNumberId, whatsappToken, formattedPhone, 'service_reminder', 'en_US', params);
          }

          if (res.ok) {
            deliveredCount++;
          }
        }

        // 4. Trigger n8n webhook if N8N_BROADCAST_WEBHOOK_URL is configured
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
      templates_delivered_live: deliveredCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
