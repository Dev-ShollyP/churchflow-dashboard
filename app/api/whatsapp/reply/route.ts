import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { conversation_id, member_phone, message_text } = await request.json();

    if (!conversation_id || !message_text) {
      return NextResponse.json({ error: 'Missing conversation_id or message_text' }, { status: 400 });
    }

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
            } catch {
              // Read-only
            }
          },
        },
      }
    );

    // 1. Fetch connected WhatsApp session & token from Supabase
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('phone_number_id, access_token')
      .eq('status', 'connected')
      .limit(1)
      .single();

    const phoneNumberId = session?.phone_number_id;
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || session?.access_token;

    let metaStatusMessage = '';
    let metaDelivered = false;

    // Clean phone number (must be digits only, no + or spaces)
    const formattedPhone = (member_phone || '').replace(/\D/g, '');

    // 2. Send via Meta WhatsApp Cloud API if token & phone ID exist
    if (phoneNumberId && whatsappToken && formattedPhone) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: message_text },
          }),
        });

        const metaData = await metaRes.json();

        if (metaRes.ok && metaData.messages) {
          metaDelivered = true;
          metaStatusMessage = 'WhatsApp message delivered to member phone!';
        } else {
          metaStatusMessage = `Meta WhatsApp Error: ${metaData.error?.message || JSON.stringify(metaData)}`;
        }
      } catch (err: any) {
        metaStatusMessage = `Meta Network Error: ${err.message}`;
      }
    } else {
      metaStatusMessage = 'Missing WHATSAPP_ACCESS_TOKEN in .env.local or whatsapp_sessions table.';
    }

    // 3. Save outbound message to Supabase messages table
    const { data: insertedMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender: 'assistant',
        message: message_text,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: insertedMsg,
      meta_delivered: metaDelivered,
      meta_status: metaStatusMessage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
