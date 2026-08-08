import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { conversation_id, member_name, member_phone, trigger_type, message_text } = await request.json();

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

    // Fetch staff phone numbers to alert (or default admin phone)
    const { data: staffList } = await supabase
      .from('staff')
      .select('full_name, email, phone')
      .or("role.eq.admin,role.eq.pastor");

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;

    const alertTitle = trigger_type === 'human_assistance'
      ? '🚨 HUMAN ASSISTANCE REQUESTED'
      : '💬 NEW CHAT RECEIVED';

    const alertBody = `${alertTitle}\nMember: ${member_name || 'Visitor'} (${member_phone})\nMessage: "${message_text}"\nOpen Chat: https://churchflow-dashboard.vercel.app/conversations/${conversation_id}`;

    // Send WhatsApp notification to Admin/Staff numbers if configured
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
