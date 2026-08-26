import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { broadcast_id, test_phone, custom_message, custom_image_url } = await request.json();

    let targetPhone = (test_phone || '').replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0') && targetPhone.length === 11) {
      targetPhone = '234' + targetPhone.slice(1);
    }

    if (!targetPhone) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    let messageText = custom_message || '';
    let imageUrl = custom_image_url || '';

    if (broadcast_id) {
      const { data: bcast } = await supabase
        .from('scheduled_broadcasts')
        .select('*')
        .eq('id', broadcast_id)
        .single();

      if (bcast) {
        messageText = messageText || bcast.message;
        imageUrl = imageUrl || bcast.image_url;
      }
    }

    if (!messageText) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Resolve WhatsApp credentials
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('phone_number_id, access_token')
      .limit(1)
      .single();

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || session?.phone_number_id || '1252855381239526';
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || session?.access_token || 'EAGATFNQZCUQIBSEf9WbNE4la5u2lMVD0sPkfPUksFwtf7GiCAzUcx3pvl0rP2fwWf8xu2QJoJh0Ybuqx072cc0mUv0eLBFYS39WlxkmF8dTVOPJ4lwUTqOLzlWFTfCTgQZArkpI5tC3NWRZCGp0RW79px4olQuosTf88Ei2Lh3tZBGCpDFWar8X2ZA4I9aPQWagZDZD';

    let payload: any = {
      messaging_product: 'whatsapp',
      to: targetPhone,
    };

    if (imageUrl && imageUrl.startsWith('http')) {
      payload.type = 'image';
      payload.image = {
        link: imageUrl,
        caption: messageText
      };
    } else {
      payload.type = 'text';
      payload.text = {
        body: messageText
      };
    }

    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return NextResponse.json({
        success: false,
        error: metaData.error?.message || 'Failed to send WhatsApp message via Meta API',
        metaData
      }, { status: metaRes.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Test broadcast sent successfully!',
      metaData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
