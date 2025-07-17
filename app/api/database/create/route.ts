import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOutscraperService } from '@/utils/outscraper';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';
import { Country } from 'country-state-city';

interface DatabaseCreateData {
  name: string;
  queries: string[];
  enrichments?: string[];
  language?: string;
  limit?: number;
  userId?: string;
}

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.query || !data.userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has enough credits in the user_contact_credits table
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_contact_credits')
      .select('credits_available, credits_used')
      .eq('user_id', data.userId)
      .single();

    if (creditsError) {
      console.error('User credits fetch error:', creditsError);
      return NextResponse.json(
        { error: 'Failed to fetch user credits', details: creditsError.message },
        { status: 500 }
      );
    }

    if (!userCredits) {
      return NextResponse.json(
        { error: 'User credits not found' },
        { status: 404 }
      );
    }

    const creditsRequired = data.credits || 50; // Default to 50 credits if not specified

    if (userCredits.credits_available < creditsRequired) {
      return NextResponse.json(
        { error: 'Insufficient credits', details: `You need ${creditsRequired} credits but only have ${userCredits.credits_available}` },
        { status: 403 }
      );
    }
    
    // Generate location queries if using structured location
    let queries: string[] = [];
    
    // Generate only the first query initially - the status route will add more as needed
    if (data.query_type === 'structured' && data.location) {
      // For structured locations, generate just 1-2 initial queries
      if (data.location.city) {
        // If city is specified, use that for the initial query
        queries.push(`${data.query}, ${data.location.city}, ${data.location.state || ''}, ${data.location.country || ''}`);
      } else if (data.location.state) {
        // If only state is specified, use that
        queries.push(`${data.query}, ${data.location.state}, ${data.location.country || ''}`);
        
        // Also store cities for the status route to use later
        const locationCities = data.location.cities || [];
        data.location.cities = locationCities;
      } else if (data.location.country) {
        // If only country is specified
        queries.push(`${data.query}, ${data.location.country}`);
      }
    } else if (data.query_type === 'free_text' && data.locations) {
      // For free text locations, just take the first location initially
      const locations = data.locations.split('\n').filter(Boolean);
      if (locations.length > 0) {
        queries.push(`${data.query}, ${locations[0].trim()}`);
        
        // Store remaining locations for status route to use
        data.remaining_locations = locations.slice(1);
      } else {
        queries.push(data.query);
      }
    } else {
      // Simple query
      queries.push(data.query);
    }
    
    // Make sure we have at least one query
    if (queries.length === 0) {
      queries.push(data.query);
    }
    
    console.log('Initial queries:', queries);

    // Prepare API options
    const apiOptions: any = {
      limit: creditsRequired,
      language: data.language || 'en',
      async: true,
      dropDuplicates: true,
      search_depth: 'high'
    };
    
    // Add enrichment if specified
    if (data.enrichments && data.enrichments.length > 0) {
      apiOptions.enrichment = data.enrichments;
    }
    
    // Set up service
    const outscraperService = getOutscraperService();

    // Make the API call
    const response = await outscraperService.searchGooglePlaces(
      queries[0], // Start with just the first query
      '',
      apiOptions
    );

    if (!response || !response.id) {
      throw new Error('Invalid response from Outscraper API');
    }

    // Create new database record
    const userDatabase = {
      name: data.name,
      user_id: data.userId,
      search_query: data.query,
      query_type: data.query_type || 'simple',
      location: data.location ? JSON.stringify(data.location) : data.locations || '',
      enrichments: data.enrichments || [],
      selected_columns: data.selected_columns || [],
      search_type: data.search_type || 'places',
      language: data.language || 'en',
      credits_per_query: creditsRequired,
      limit_count: data.limit_count || creditsRequired, // Track the target number of contacts
      request_id: response.id,
      status: 'processing',
      queries: queries,
      total_queries: queries.length,
      current_query_index: 0,
      statistics: {
        total: 0,
        completed: 0,
        unique_contacts: 0,
        queries_processed: 0, 
        total_results: 0
      },
      file_paths: {}
    };

    const { data: createdDatabase, error: dbError } = await supabaseAdmin
      .from('user_databases')
      .insert([userDatabase])
      .select()
      .single();

    if (dbError) {
      console.error('Database creation error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create database', details: dbError.message },
        { status: 500 }
      );
    }

    // Deduct credits from user's contact credits
    const { error: updateError } = await supabaseAdmin
      .from('user_contact_credits')
      .update({ 
        credits_available: userCredits.credits_available - creditsRequired,
        credits_used: (userCredits.credits_used || 0) + creditsRequired
      })
      .eq('user_id', data.userId);

    if (updateError) {
      console.error('Failed to update user credits:', updateError);
      // Continue despite error (database was created)
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database creation initiated',
      database: createdDatabase
    });
  } catch (error) {
    console.error('Failed to create database:', error);
    return NextResponse.json(
      { error: 'Failed to create database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 