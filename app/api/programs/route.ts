import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Public API — n8n bot fetches active special programs from here
// GET /api/programs → returns all active special programs
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('special_programs')
      .select('id, title, description, flyer_url, program_date, end_date')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ programs: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
