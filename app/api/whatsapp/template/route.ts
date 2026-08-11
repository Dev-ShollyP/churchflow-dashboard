import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function sendMetaTemplate(
  phoneNumberId: string,
  whatsappToken: string,
  formattedPhone: string,
  templateName: string,
  langCode: string,
  components: any[]
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
    return { ok: false, data: { error: { message: err.name === 'AbortError' ? 'Meta API timeout (8s)' : err.message } } };
  }
}

export async function POST(request: Request) {
  try {
    const { conversation_id, member_phone, template_name = 'staff_followup', language_code = 'en', parameters = [] } = await request.json();

    if (!conversation_id || !template_name) {
      return NextResponse.json({ error: 'Missing conversation_id or template_name' }, { status: 400 });
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
    const formattedPhone = (member_phone || '').replace(/\D/g, '');

    if (!phoneNumberId || !whatsappToken || !formattedPhone) {
      return NextResponse.json({
        error: 'Missing WhatsApp phone number ID, access token, or recipient phone.',
      }, { status: 400 });
    }

    const templateComponents = parameters.length > 0
      ? [
          {
            type: 'body',
            parameters: parameters.map((val: string) => ({ type: 'text', text: val })),
          },
        ]
      : [];

    // Attempt 1: Try language_code (e.g. 'en')
    let metaRes = await sendMetaTemplate(phoneNumberId, whatsappToken, formattedPhone, template_name, language_code, templateComponents);

    // Attempt 2: If 'en' failed with #132001, try 'en_US' fallback
    if (!metaRes.ok && metaRes.data?.error?.code === 132001 && language_code !== 'en_US') {
      metaRes = await sendMetaTemplate(phoneNumberId, whatsappToken, formattedPhone, template_name, 'en_US', templateComponents);
    }

    const templateSummary = `[Template: ${template_name}] ${parameters.join(' | ')}`.trim();
    
    // Always record outbound template message in DB thread
    await supabase.from('messages').insert({
      conversation_id,
      sender: 'assistant',
      message: templateSummary,
    });

    if (!metaRes.ok) {
      const errMsg = metaRes.data?.error?.message || metaRes.data?.error?.error_data?.details || 'Meta API delivery failed';
      return NextResponse.json({
        success: true,
        delivered: false,
        warning: `Saved to chat thread, but Meta returned error: ${errMsg}`,
        meta_data: metaRes.data,
      });
    }

    return NextResponse.json({
      success: true,
      delivered: true,
      meta_data: metaRes.data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
