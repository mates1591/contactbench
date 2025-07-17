import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { databaseId, userId, format = 'json' } = await request.json();
    console.log('Download request received:', { databaseId, userId, format });

    if (!databaseId || !userId) {
      return NextResponse.json(
        { error: 'Database ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user owns this database
    const { data: database, error: fetchError } = await supabaseAdmin
      .from('user_databases')
      .select('*')
      .eq('id', databaseId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !database) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Database not found or user does not have permission' },
        { status: 404 }
      );
    }
    
    // Check if the database is completed
    if (database.status !== 'completed') {
      return NextResponse.json(
        { error: 'Database is not ready for download', status: database.status },
        { status: 400 }
      );
    }
    
    // Check if the file path exists for the requested format
    if (!database.file_paths || !database.file_paths[format]) {
      return NextResponse.json(
        { error: `No ${format} file available for this database` },
        { status: 404 }
      );
    }

    const filePath = database.file_paths[format];
    
    // Get a signed URL for the file
    const { data: signedUrlData, error: signUrlError } = await supabaseAdmin.storage
      .from('database_exports')
      .createSignedUrl(filePath, 3600, {
        download: true
      });
      
    if (signUrlError) {
      console.error('Error creating signed URL:', signUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL', details: signUrlError.message },
        { status: 500 }
      );
    }
    
    console.log('Download URL generated successfully');
    
    return NextResponse.json({
      status: 'success',
      downloadUrl: signedUrlData.signedUrl
    });
  } catch (error) {
    console.error('Database download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 