import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/broadcasts - Fetch all scheduled broadcasts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');

    let query = supabase
      .from('scheduled_broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet or other query error, return empty array gracefully
      return NextResponse.json({ broadcasts: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ broadcasts: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/broadcasts - Create a new scheduled broadcast
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      message,
      image_url,
      days_of_week = ['monday', 'wednesday', 'friday'],
      send_time = '17:00:00',
      target_audience = 'all',
      is_active = true,
      branch_id,
      created_by
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_broadcasts')
      .insert({
        title: title.trim(),
        message: message.trim(),
        image_url: image_url || null,
        days_of_week: Array.isArray(days_of_week) ? days_of_week : ['monday', 'wednesday', 'friday'],
        send_time: send_time || '17:00:00',
        target_audience: target_audience || 'all',
        is_active: is_active ?? true,
        branch_id: branch_id || null,
        created_by: created_by || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ broadcast: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/broadcasts - Update a broadcast
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('scheduled_broadcasts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ broadcast: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/broadcasts - Delete a broadcast
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_broadcasts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
