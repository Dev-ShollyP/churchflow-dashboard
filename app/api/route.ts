import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_FLYER = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('banner_url, description, title')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.redirect(DEFAULT_FLYER);
    }

    let flyerSource = event.banner_url || '';

    // If banner_url is empty, check embedded description metadata
    if (!flyerSource && event.description) {
      const match = event.description.match(/\[FLYER:\s*([^\]]+)\]/);
      if (match) flyerSource = match[1].trim();
    }

    // Handle Base64 Data URL
    if (flyerSource.startsWith('data:image/')) {
      const parts = flyerSource.split(',');
      const mime = parts[0].split(';')[0].split(':')[1] || 'image/png';
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Handle standard HTTPS flyer URL (must NOT be pointing back to /api/events/flyer)
    if ((flyerSource.startsWith('http://') || flyerSource.startsWith('https://')) && flyerSource.indexOf('/api/events/flyer') === -1 && flyerSource.indexOf('/api/flyers') === -1) {
      return NextResponse.redirect(flyerSource);
    }

    // Fallback default high-res service flyer
    const titleLower = (event.title || '').toLowerCase();
    if (titleLower.includes('thanksgiving')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Thanks.jpg');
    if (titleLower.includes('digging')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Digging%20Deep.png');
    if (titleLower.includes('faith')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/faith%20clinic.jpg');

    return NextResponse.redirect(DEFAULT_FLYER);
  } catch (err: any) {
    console.error('Flyer image serving error:', err);
    return NextResponse.redirect(DEFAULT_FLYER);
  }
}
