import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { databaseId, userId } = await request.json();

    if (!databaseId || !userId) {
      return NextResponse.json(
        { error: 'Database ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user owns this database and get file paths
    const { data: database, error: fetchError } = await supabaseAdmin
      .from('user_databases')
      .select('*')
      .eq('id', databaseId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Database not found or user does not have permission' },
        { status: 404 }
      );
    }

    // Delete files from storage bucket if they exist
    if (database.file_paths && Object.keys(database.file_paths).length > 0) {
      try {
        console.log(`Deleting storage files for database ${databaseId}`);
        
        // Get all the file paths with proper typing
        const filePaths = Object.values(database.file_paths as Record<string, string>);
        
        // Delete all files in the bucket for this database
        for (const filePath of filePaths) {
          const { error: storageError } = await supabaseAdmin.storage
            .from('database_exports')
            .remove([filePath]);
          
          if (storageError) {
            console.error(`Error deleting file ${filePath}:`, storageError);
          } else {
            console.log(`Successfully deleted file: ${filePath}`);
          }
        }
        
        // Also try to delete the directory itself (if Supabase supports it)
        const dirPath = `${userId}/${databaseId}`;
        await supabaseAdmin.storage
          .from('database_exports')
          .remove([dirPath]);
          
      } catch (storageError) {
        console.error('Error deleting storage files:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabaseAdmin
      .from('user_databases')
      .delete()
      .eq('id', databaseId);

    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete database', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database and associated files successfully deleted'
    });
  } catch (error) {
    console.error('Database deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 