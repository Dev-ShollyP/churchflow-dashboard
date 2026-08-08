import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { conversation_id, member_phone, template_name, language_code = 'en_US', parameters = [] } = await request.json();

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
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || session?.access_token;
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

    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: template_name,
          language: { code: language_code },
          components: templateComponents,
        },
      }),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok || !metaData.messages) {
      const errMsg = metaData.error?.message || metaData.error?.error_data?.details || JSON.stringify(metaData);
      return NextResponse.json({ error: `Meta Template Error: ${errMsg}`, metaData }, { status: 400 });
    }

    const templateSummary = `[Template: ${template_name}] ${parameters.join(' | ')}`.trim();
    await supabase.from('messages').insert({
      conversation_id,
      sender: 'assistant',
      message: templateSummary,
    });

    return NextResponse.json({
      success: true,
      delivered: true,
      meta_data: metaData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
