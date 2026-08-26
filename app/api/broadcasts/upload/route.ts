import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

// Server-side client with full admin/service role privileges (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'Broadcasts';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Supabase Storage bucket 'Flyers' using service role key
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Flyers')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Get the public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('Flyers')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      filePath
    });
  } catch (err: any) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: err.message || 'Server upload failed' }, { status: 500 });
  }
}
