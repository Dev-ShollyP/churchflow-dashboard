import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { broadcast_id, test_phone, custom_title, custom_message, custom_image_url } = await request.json();

    // Standardize phone number format for Nigeria (or international)
    let targetPhone = (test_phone || '').replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0') && targetPhone.length === 11) {
      targetPhone = '234' + targetPhone.slice(1);
    } else if (targetPhone.length === 10 && !targetPhone.startsWith('234')) {
      targetPhone = '234' + targetPhone;
    }

    if (!targetPhone || targetPhone.length < 10) {
      return NextResponse.json({ error: 'Valid WhatsApp phone number is required (e.g. 080... or 23480...)' }, { status: 400 });
    }

    let titleText = custom_title || 'Announcement';
    let messageText = custom_message || '';
    let imageUrl = custom_image_url || '';

    if (broadcast_id) {
      const { data: bcast } = await supabase
        .from('scheduled_broadcasts')
        .select('*')
        .eq('id', broadcast_id)
        .single();

      if (bcast) {
        titleText = titleText || bcast.title;
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

    // WhatsApp Template parameters cannot contain newlines or multiple spaces (Meta Rule #132018)
    const sanitizedTitle = titleText.replace(/\r?\n+/g, ' ').trim().slice(0, 60);
    const sanitizedBody = messageText.replace(/\r?\n+/g, ' • ').replace(/\s+/g, ' ').trim();

    // 1. Prepare approved Meta Template payload (Delivers even if 24-hour service window is expired)
    const templatePayload: any = {
      messaging_product: 'whatsapp',
      to: targetPhone,
      type: 'template',
      template: {
        name: 'church_annoucement',
        language: { code: 'en' },
        components: (imageUrl && imageUrl.startsWith('http')) ? [
          {
            type: 'header',
            parameters: [
              { type: 'image', image: { link: imageUrl } }
            ]
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: sanitizedTitle },
              { type: 'text', text: 'Believer' },
              { type: 'text', text: sanitizedBody }
            ]
          }
        ] : [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: sanitizedTitle },
              { type: 'text', text: 'Believer' },
              { type: 'text', text: sanitizedBody }
            ]
          }
        ]
      }
    };

    // 2. Prepare Direct Session payload (Formatted text with newlines, works if user messaged within 24 hours)
    const directPayload: any = {
      messaging_product: 'whatsapp',
      to: targetPhone,
    };
    if (imageUrl && imageUrl.startsWith('http')) {
      directPayload.type = 'image';
      directPayload.image = {
        link: imageUrl,
        caption: messageText
      };
    } else {
      directPayload.type = 'text';
      directPayload.text = {
        body: messageText
      };
    }

    // Try Template First (Bypasses 24h customer window restriction)
    const templateRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });

    const templateData = await templateRes.json();

    if (templateRes.ok) {
      // Also attempt direct payload if window is active so they get the pretty multiline formatting
      try {
        await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(directPayload)
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Preview test sent successfully to your WhatsApp!',
        template_sent: true,
        metaData: templateData
      });
    }

    // If template failed, try direct payload as fallback
    const directRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(directPayload)
    });

    const directData = await directRes.json();

    if (!directRes.ok) {
      const errMsg = directData.error?.message || templateData.error?.message || 'Failed to send WhatsApp message via Meta API';
      return NextResponse.json({
        success: false,
        error: errMsg,
        metaData: directData
      }, { status: directRes.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully!',
      metaData: directData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
