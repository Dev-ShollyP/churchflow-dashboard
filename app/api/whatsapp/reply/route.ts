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

    // 1. Resolve Phone Number ID & Access Token
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('phone_number_id, access_token')
      .limit(1)
      .single();

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || session?.phone_number_id || '1252855381239526';
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || session?.access_token || 'EAGATFNQZCUQIBSEf9WbNE4la5u2lMVD0sPkfPUksFwtf7GiCAzUcx3pvl0rP2fwWf8xu2QJoJh0Ybuqx072cc0mUv0eLBFYS39WlxkmF8dTVOPJ4lwUTqOLzlWFTfCTgQZArkpI5tC3NWRZCGp0RW79px4olQuosTf88Ei2Lh3tZBGCpDFWar8X2ZA4I9aPQWagZDZD';

    let metaStatusMessage = '';
    let metaDelivered = false;

    // Clean phone number (must be digits only, no + or spaces)
    const formattedPhone = (member_phone || '').replace(/\D/g, '');

    if (!formattedPhone) {
      metaStatusMessage = 'No phone number provided for this member.';
    }

    // 2. Send via Meta WhatsApp Cloud API with AbortSignal timeout
    if (phoneNumberId && whatsappToken && formattedPhone) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: message_text },
          }),
        });

        clearTimeout(timeoutId);
        const metaData = await metaRes.json();

        if (metaRes.ok && metaData.messages) {
          metaDelivered = true;
          metaStatusMessage = 'WhatsApp message delivered to member phone!';
        } else {
          const errMsg = metaData.error?.message || metaData.error?.error_data?.details || JSON.stringify(metaData);
          metaStatusMessage = `Meta API Error: ${errMsg}`;
          console.error('[WhatsApp Reply] Meta API error:', metaData);
        }
      } catch (err: any) {
        metaStatusMessage = err.name === 'AbortError'
          ? 'Meta WhatsApp API request timed out (8s timeout). Saved to thread.'
          : `Meta Network Error: ${err.message || 'Connection failed'}`;
        console.error('[WhatsApp Reply] Fetch error:', err);
      }
    } else {
      const missing = [];
      if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
      if (!whatsappToken) missing.push('WHATSAPP_ACCESS_TOKEN');
      if (!formattedPhone) missing.push('member phone number');
      metaStatusMessage = `Cannot send via WhatsApp Cloud API: missing ${missing.join(', ')}. Saved to thread.`;
      console.warn('[WhatsApp Reply] Missing config:', metaStatusMessage);
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
      return NextResponse.json({ error: `Supabase Insert Error: ${insertError.message}` }, { status: 500 });
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
