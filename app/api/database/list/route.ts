import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all databases for the user
    const { data: databases, error } = await supabaseAdmin
      .from('user_databases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database list fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch databases', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      databases: databases || []
    });
  } catch (error) {
    console.error('Database list error:', error);
    return NextResponse.json(
      { error: 'Failed to list databases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 