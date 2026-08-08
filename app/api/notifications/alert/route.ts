import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { conversation_id, member_name, member_phone, trigger_type, message_text } = await request.json();

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

    const { data: staffList } = await supabase
      .from('staff')
      .select('full_name, email, phone')
      .or("role.eq.admin,role.eq.pastor");

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1252855381239526';
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;

    const alertTitle = trigger_type === 'human_assistance'
      ? '🚨 HUMAN ASSISTANCE REQUESTED'
      : '💬 NEW CHAT RECEIVED';

    const alertBody = `${alertTitle}\nMember: ${member_name || 'Visitor'} (${member_phone})\nMessage: "${message_text}"\nOpen Chat: https://churchflow-dashboard.vercel.app/conversations/${conversation_id}`;

    let alertsSent = 0;
    if (phoneNumberId && whatsappToken && staffList && staffList.length > 0) {
      for (const staff of staffList) {
        if (!staff.phone) continue;
        const cleanPhone = staff.phone.replace(/\D/g, '');
        if (!cleanPhone) continue;

        try {
          await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'text',
              text: { body: alertBody },
            }),
          });
          alertsSent++;
        } catch (e) {
          console.error('[Notification Alert] Failed to send WhatsApp alert to staff:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      alerts_sent: alertsSent,
      alert_body: alertBody,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
