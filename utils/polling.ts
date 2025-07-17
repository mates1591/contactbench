import { createClient } from '@supabase/supabase-js';
import { OutscraperClient } from './outscraper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const outscraper = new OutscraperClient();

interface PollingResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function pollDatabase(databaseId: string): Promise<PollingResult> {
  try {
    // Get the database record
    const { data: database, error: dbError } = await supabase
      .from('user_databases')
      .select('*')
      .eq('id', databaseId)
      .single();

    if (dbError || !database) {
      throw new Error(dbError?.message || 'Database not found');
    }

    if (!database.request_id) {
      throw new Error('No request ID found for database');
    }

    // Check the status with Outscraper
    const response = await outscraper.checkResults(database.request_id);

    // Update database status based on response
    if (response.status === 'Completed') {
      // Process and store the results
      const { error: updateError } = await supabase
        .from('user_databases')
        .update({
          status: 'completed',
          results: response.data || response.results,
          completed_at: new Date().toISOString(),
          statistics: {
            total: (response.data || response.results || []).length,
            completed: (response.data || response.results || []).length
          }
        })
        .eq('id', databaseId);

      if (updateError) {
        throw new Error(`Failed to update database: ${updateError.message}`);
      }

      return {
        success: true,
        data: response.data || response.results
      };
    } else if (response.status === 'Failed') {
      // Update database status to failed
      const { error: updateError } = await supabase
        .from('user_databases')
        .update({
          status: 'failed',
          error: response.status,
          completed_at: new Date().toISOString()
        })
        .eq('id', databaseId);

      if (updateError) {
        throw new Error(`Failed to update database: ${updateError.message}`);
      }

      return {
        success: false,
        error: 'Outscraper request failed'
      };
    } else {
      // Still processing
      const { error: updateError } = await supabase
        .from('user_databases')
        .update({
          status: 'processing',
          statistics: {
            total: (response.data || response.results || []).length,
            completed: 0
          }
        })
        .eq('id', databaseId);

      if (updateError) {
        throw new Error(`Failed to update database: ${updateError.message}`);
      }

      return {
        success: true,
        data: {
          status: response.status,
          progress: 0
        }
      };
    }
  } catch (error) {
    console.error('Error polling database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function pollAllPendingDatabases(): Promise<void> {
  try {
    // Get all databases that are in 'processing' status
    const { data: databases, error: dbError } = await supabase
      .from('user_databases')
      .select('*')
      .in('status', ['pending', 'processing']);

    if (dbError) {
      throw new Error(`Failed to fetch databases: ${dbError.message}`);
    }

    // Poll each database
    for (const database of databases || []) {
      await pollDatabase(database.id);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error polling databases:', error);
  }
} 