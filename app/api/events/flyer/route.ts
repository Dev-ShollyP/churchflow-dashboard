import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

    // Check events table first
    const { data: event } = await supabase
      .from('events')
      .select('id, banner_url, description, title')
      .eq('id', id)
      .single();

    let flyerSource = event?.banner_url || '';
    let title = (event?.title || '').toLowerCase();

    // If not found in events, check special_programs
    if (!event) {
      const { data: program } = await supabase
        .from('special_programs')
        .select('id, image_url, flyer_url, description, title')
        .eq('id', id)
        .single();

      if (program) {
        flyerSource = program.flyer_url || program.image_url || '';
        title = (program.title || '').toLowerCase();
      }
    }

    // Check for Youth Sunday local asset fallback
    if (id === '8161e678-0a2e-4b7a-99e6-601d361e384b' || title.includes('youth')) {
      const flyerPath = path.join(process.cwd(), 'public/flyers/youth-sunday.jpg');
      if (fs.existsSync(flyerPath)) {
        const buffer = fs.readFileSync(flyerPath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    }

    // If banner_url is empty, check embedded description metadata
    if (!flyerSource && event?.description) {
      const match = event.description.match(/\[FLYER:\s*([^\]]+)\]/);
      if (match) flyerSource = match[1].trim();
    }

    // Handle Base64 Data URL (convert to binary JPEG/PNG with 200 OK)
    if (flyerSource && flyerSource.startsWith('data:image/')) {
      const parts = flyerSource.split(',');
      const mime = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Handle standard HTTPS flyer URL (must NOT be pointing recursively to this endpoint)
    if (flyerSource && (flyerSource.startsWith('http://') || flyerSource.startsWith('https://')) && flyerSource.indexOf('/api/events/flyer') === -1 && flyerSource.indexOf('/api/flyers') === -1) {
      return NextResponse.redirect(flyerSource);
    }

    // Fallback default service flyers
    if (title.includes('thanksgiving')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Thanks.jpg');
    if (title.includes('digging')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Digging%20Deep.png');
    if (title.includes('faith')) return NextResponse.redirect('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/faith%20clinic.jpg');

    return NextResponse.redirect(DEFAULT_FLYER);
  } catch (err: any) {
    console.error('Flyer image serving error:', err);
    return NextResponse.redirect(DEFAULT_FLYER);
  }
}
