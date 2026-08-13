import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('banner_url, description, title')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let flyerSource = event.banner_url || '';

    // Check if embedded in description metadata
    if (!flyerSource && event.description) {
      const match = event.description.match(/\[FLYER:\s*([^\]]+)\]/);
      if (match) flyerSource = match[1].trim();
    }

    // If flyerSource is a base64 Data URL, decode and serve as image binary
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

    // If flyerSource is an HTTP URL, redirect to it
    if (flyerSource.startsWith('http://') || flyerSource.startsWith('https://')) {
      return NextResponse.redirect(flyerSource);
    }

    // Fallback default flyer image
    return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg');
  } catch (err: any) {
    console.error('Flyer image serving error:', err);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
