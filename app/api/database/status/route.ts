import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOutscraperService } from '@/utils/outscraper';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';
import { Parser } from 'json2csv';

// Helper function to get only the structure of an object for logging
function getObjectStructure(obj: any, maxDepth = 2, currentDepth = 0): any {
  if (currentDepth >= maxDepth) return '...';
  
  if (Array.isArray(obj)) {
    return obj.length > 0 
      ? [`${obj.length} items`, getObjectStructure(obj[0], maxDepth, currentDepth + 1)] 
      : '[]';
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      result[key] = typeof obj[key] === 'object' && obj[key] !== null
        ? getObjectStructure(obj[key], maxDepth, currentDepth + 1)
        : typeof obj[key];
    });
    return result;
  }
  
  return typeof obj;
}

// Helper function to convert JSON to CSV
function convertToCSV(data: any[]) {
  try {
    // Get all possible fields from the data
    const fields = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => fields.add(key));
    });
    
    // Create parser with fields
    const parser = new Parser({
      fields: Array.from(fields),
      defaultValue: ''
    });
    
    return parser.parse(data);
  } catch (error) {
    console.error('Error converting to CSV:', error);
    return '';
  }
}

// Helper function to remove duplicate results based on place_id or other unique identifier
function removeDuplicates(results: any[]): any[] {
  const uniqueResults = new Map();
  
  results.forEach(item => {
    // Use place_id as primary key if available, otherwise use a composite key
    const key = item.place_id || 
                item.google_id || 
                (item.name && item.full_address ? `${item.name}:${item.full_address}` : 
                 (item.name && item.address ? `${item.name}:${item.address}` :
                  JSON.stringify(item)));
                 
    // Only add if we haven't seen this item before
    if (!uniqueResults.has(key)) {
      uniqueResults.set(key, item);
    }
  });
  
  return Array.from(uniqueResults.values());
}

// Helper function to generate additional queries if needed
function generateAdditionalQueries(database: any, currentResults: number, targetLimit: number): string[] {
  // Only generate additional queries if we have a location structure and we're not reaching our target
  if (!database.location || currentResults >= targetLimit * 0.7) {
    return [];
  }
  
  const additionalQueries: string[] = [];
  const baseQuery = database.search_query || database.queries[0];
  
  // If we have a structured location, create additional variations
  if (database.location.country) {
    // Generate variations of the search term
    const variations = [
      'companies',
      'businesses',
      'establishments',
      'services',
      'providers'
    ];
    
    // Find which variations we haven't used yet
    const usedQueries = new Set(database.queries);
    
    for (const variation of variations) {
      const newQuery = `${baseQuery} ${variation}, ${database.location.state || ''}, ${database.location.country}`.trim();
      if (!usedQueries.has(newQuery)) {
        additionalQueries.push(newQuery);
      }
    }
    
    // If we have a state but not city, add queries for major cities in that state
    if (database.location.state && !database.location.city && database.location.cities) {
      // Add up to 5 major cities that haven't been queried yet
      const unusedCities = database.location.cities.filter((city: string) => 
        !database.queries.some((q: string) => q.includes(city))
      ).slice(0, 5);
      
      for (const city of unusedCities) {
        additionalQueries.push(`${baseQuery}, ${city}, ${database.location.state}, ${database.location.country}`);
      }
    }
  }
  
  console.log(`Generated ${additionalQueries.length} additional queries`);
  return additionalQueries;
}

// Update the isSpecificLocation function to properly identify when a user has selected "all states" or "all cities"
function isSpecificLocation(database: any): boolean {
  // Try to determine if this is a specific location query
  try {
    // If location is stored as JSON string, parse it
    let locationData: any = null;
    
    if (database.location && typeof database.location === 'string' && database.location.startsWith('{')) {
      locationData = JSON.parse(database.location);
    } else if (typeof database.location === 'object') {
      locationData = database.location;
    }
    
    // If we successfully parsed location data, check for all_cities or all_states
    if (locationData) {
      // If "all_states" or "all_cities" is selected, it's NOT a specific location
      // We should generate multiple queries in those cases
      if (
        (locationData.state === 'all_states') || 
        (locationData.city === 'all_cities') ||
        (locationData.cities && locationData.cities.length > 0) ||
        (locationData.states && locationData.states.length > 0)
      ) {
        console.log('Non-specific location detected (all_states or all_cities)');
        return false;
      }
      
      // If it has specific city and state, then it's a specific location
      const isSpecific = 
        (locationData.city && locationData.city !== 'all_cities') &&
        (locationData.state && locationData.state !== 'all_states');
      
      return isSpecific;
    }
  } catch (error) {
    console.error('Error checking location specificity:', error);
  }
  
  // Default: if query_type is 'simple' or we can't determine, assume it's specific
  return database.query_type === 'simple' || !database.query_type;
}

// Update the generateNextQuery function to handle "all_states" or "all_cities" cases
function generateNextQuery(database: any): string | null {
  console.log('Generating next query for database:', database.id);
  
  // If this is a specific location and we've already processed at least one query,
  // don't generate more queries
  if (isSpecificLocation(database) && database.current_query_index > 0) {
    console.log('Specific location query already processed, not generating additional queries');
    return null;
  }
  
  // Base query (the search term)
  const baseQuery = database.search_query;
  
  // Try to get location data from the location string or field
  let locationData: any = null;
  
  try {
    // If location is stored as JSON string, parse it
    if (database.location && typeof database.location === 'string' && database.location.startsWith('{')) {
      locationData = JSON.parse(database.location);
    } else if (typeof database.location === 'object') {
      locationData = database.location;
    }
  } catch (e) {
    console.error('Error parsing location data:', e);
  }
  
  // If we have parsed location data, generate more targeted queries
  if (locationData) {
    const country = locationData.country || '';
    
    // Case 1: If we have cities array, use them one by one
    if (locationData.cities && locationData.cities.length > 0) {
      // Get the next city to query
      const nextCity = locationData.cities[0];
      console.log(`Using next city for query: ${nextCity}`);
      
      // Remove this city from the list for future calls
      locationData.cities = locationData.cities.slice(1);
      
      // Update the database location with the remaining cities
      updateDatabaseLocation(database.id, locationData);
      
      // Use the exact search term with this city
      if (locationData.state && locationData.state !== 'all_states') {
        return `${baseQuery}, ${nextCity}, ${locationData.state}, ${country}`.trim();
      } else {
        return `${baseQuery}, ${nextCity}, ${country}`.trim();
      }
    }
    
    // Case 2: If all_cities is set but we have no cities array, generate state-level queries
    else if (locationData.city === 'all_cities' && locationData.state && locationData.state !== 'all_states') {
      // Use the state-level query if we haven't already
      const stateQuery = `${baseQuery}, ${locationData.state}, ${country}`.trim();
      
      if (!database.queries.includes(stateQuery)) {
        console.log(`Using state-level query for all cities: ${stateQuery}`);
        return stateQuery;
      }
    }
    
    // Case 3: If all_states is set or we have a states array, generate country-level query
    else if (locationData.state === 'all_states' || (locationData.states && locationData.states.length > 0)) {
      // If we have states array, use them one by one
      if (locationData.states && locationData.states.length > 0) {
        const nextState = locationData.states[0];
        console.log(`Using next state for query: ${nextState}`);
        
        // Remove this state from the list for future calls
        locationData.states = locationData.states.slice(1);
        
        // Update the database location with the remaining states
        updateDatabaseLocation(database.id, locationData);
        
        // Use this state in the query
        return `${baseQuery}, ${nextState}, ${country}`.trim();
      }
      
      // Otherwise use the country-level query if we haven't already
      const countryQuery = `${baseQuery}, ${country}`.trim();
      
      if (!database.queries.includes(countryQuery)) {
        console.log(`Using country-level query for all states: ${countryQuery}`);
        return countryQuery;
      }
    }
    
    // Case 4: If we have a specific state but haven't queried it directly yet
    else if (locationData.state && !database.queries.some((q: string) => 
      q.trim() === `${baseQuery}, ${locationData.state}, ${country || ''}`.trim())) {
      console.log(`Using state for query: ${locationData.state}`);
      return `${baseQuery}, ${locationData.state}, ${country || ''}`.trim();
    }
    
    // Case 5: If we have a country but haven't queried it directly yet
    else if (country && !database.queries.some((q: string) => 
      q.trim() === `${baseQuery}, ${country}`.trim())) {
      console.log(`Using country for query: ${country}`);
      return `${baseQuery}, ${country}`.trim();
    }
  }
  
  // If location is stored as multiline text, try to get the next location
  if (typeof database.location === 'string' && !database.location.startsWith('{')) {
    const locations = database.location.split('\n').filter(Boolean);
    
    // If we have already processed some queries, check which locations we've already used
    if (database.queries && database.queries.length > 0) {
      const unusedLocations = locations.filter((loc: string) => 
        !database.queries.some((q: string) => q.includes(loc.trim()))
      );
      
      if (unusedLocations.length > 0) {
        const nextLocation = unusedLocations[0];
        console.log(`Using next location from text: ${nextLocation}`);
        return `${baseQuery}, ${nextLocation.trim()}`;
      }
    } else if (locations.length > 0) {
      // If this is the first query, use the first location
      return `${baseQuery}, ${locations[0].trim()}`;
    }
  }
  
  // Only use variations if we've exhausted location-based options
  // Try variations of the search term
  const variations = ['businesses', 'companies', 'establishments', 'locations', 'providers'];
  for (const variation of variations) {
    // Check if we've already used this variation
    const variationUsed = database.queries.some((q: string) => 
      q.toLowerCase().includes(`${baseQuery} ${variation}`.toLowerCase()));
    
    // If not, create a query with this variation
    if (!variationUsed) {
      console.log(`Using variation for query: ${variation}`);
      
      if (locationData) {
        if (locationData.city && locationData.city !== 'all_cities') {
          return `${baseQuery} ${variation}, ${locationData.city}, ${locationData.state || ''}, ${locationData.country || ''}`.trim();
        } else if (locationData.state && locationData.state !== 'all_states') {
          return `${baseQuery} ${variation}, ${locationData.state}, ${locationData.country || ''}`.trim();
        } else if (locationData.country) {
          return `${baseQuery} ${variation}, ${locationData.country}`.trim();
        }
      }
      
      return `${baseQuery} ${variation}`.trim();
    }
  }
  
  // If we've exhausted all options, try a broader search with the base query
  if (!database.queries.includes(baseQuery)) {
    console.log('Using base query as fallback');
    return baseQuery;
  }
  
  // No more queries to generate
  console.log('No more queries to generate');
  return null;
}

// Helper function to update location data in the database
async function updateDatabaseLocation(databaseId: string, locationData: any) {
  try {
    await supabaseAdmin
      .from('user_databases')
      .update({
        location: JSON.stringify(locationData)
      })
      .eq('id', databaseId);
  } catch (error) {
    console.error('Error updating database location:', error);
  }
}

// Helper function to update database with new query information
async function addNextQueryToDatabase(database: any, nextQuery: string) {
  // Update the queries array and related fields
  const updatedQueries = [...database.queries, nextQuery];
  
  // Update the total queries count
  const updates: any = {
    queries: updatedQueries,
    total_queries: updatedQueries.length
  };
  
  // Update the database
  const { error } = await supabaseAdmin
    .from('user_databases')
    .update(updates)
    .eq('id', database.id);
    
  if (error) {
    console.error('Error updating database with next query:', error);
    throw error;
  }
  
  console.log(`Added new query to database: ${nextQuery}`);
  return {
    ...database,
    ...updates
  };
}

// Add a helper function to sanitize filenames
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Replace any remaining unsafe chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .trim();
}

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { databaseId, userId } = await request.json();

    if (!databaseId || !userId) {
      return NextResponse.json(
        { error: 'Database ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get the database
    const { data: database, error: dbError } = await supabaseAdmin
      .from('user_databases')
      .select('*')
      .eq('id', databaseId)
      .eq('user_id', userId)
      .single();

    if (dbError) {
      console.error('Database fetch error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch database', details: dbError.message },
        { status: 500 }
      );
    }

    if (!database) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 404 }
      );
    }

    // If the database is already completed or failed, return its status
    if (database.status === 'completed' || database.status === 'failed') {
      return NextResponse.json({
        status: 'success',
        database
      });
    }

    const outscraperService = getOutscraperService();

    try {
      // Check current request status
      const response = await outscraperService.getRequestStatus(database.request_id);
      console.log('Outscraper status response:', { 
        id: response.id, 
        status: response.status, 
        hasData: response.data ? true : false 
      });

      if (response.status === 'Completed' || (response.status === 'Success' && response.data)) {
        // Process the results
        let results;
        if (response.data) {
          results = { data: response.data };
        } else {
          results = await outscraperService.getRequestResults(database.request_id);
        }
        
        if (!results || !results.data || !results.data.length) {
          throw new Error('No results returned from Outscraper');
        }

        // Flatten the data structure to ensure consistent format
        let currentResults: any[] = [];
        if (Array.isArray(results.data)) {
          // Outscraper might return nested arrays like [[[...records]]] or [[...records]]
          // We want a flat array of records
          if (Array.isArray(results.data[0])) {
            // Handle nested array structure
            results.data.forEach(group => {
              if (Array.isArray(group)) {
                if (Array.isArray(group[0])) {
                  // Handle triple-nested arrays [[[...records]]]
                  group.forEach(subgroup => {
                    if (Array.isArray(subgroup)) {
                      currentResults = currentResults.concat(subgroup);
                    } else {
                      currentResults.push(subgroup);
                    }
                  });
                } else {
                  // Handle double-nested arrays [[...records]]
                  currentResults = currentResults.concat(group);
                }
              } else {
                currentResults.push(group);
              }
            });
          } else {
            // Already flat array
            currentResults = results.data;
          }
        }
        
        console.log(`Processed ${currentResults.length} results from current query`);

        // Check if we should recover from previous processing run
        let accumulatedResults: any[] = [];
        let lastProcessedIndex = 0;

        // First check if we have a stored accumulated results array in the database
        const { data: databaseState } = await supabaseAdmin
          .from('user_databases')
          .select('stored_results, last_processed_index')
          .eq('id', database.id)
          .single();

        if (databaseState?.stored_results) {
          try {
            accumulatedResults = JSON.parse(databaseState.stored_results);
            lastProcessedIndex = databaseState.last_processed_index || 0;
            console.log(`Recovered ${accumulatedResults.length} results from database state, last processed index: ${lastProcessedIndex}`);
          } catch (error) {
            console.error('Error parsing stored results from database:', error);
          }
        }
        // If no results in database, try getting from storage as fallback
        else if (database.file_paths?.json && database.current_query_index > 0) {
          try {
            const { data: jsonFile, error: jsonError } = await supabaseAdmin.storage
              .from('database_exports')
              .download(database.file_paths.json);
              
            if (!jsonError && jsonFile) {
              const jsonText = await jsonFile.text();
              accumulatedResults = JSON.parse(jsonText);
              console.log(`Loaded ${accumulatedResults.length} existing results from storage file`);
            }
          } catch (error) {
            console.error('Error loading previous results from storage:', error);
          }
        }

        // Combine current results with accumulated results
        const combinedResults = [...accumulatedResults, ...currentResults];

        // Remove duplicates from the combined results
        const allResults = removeDuplicates(combinedResults);
        console.log(`Total unique results after combining and deduplication: ${allResults.length}`);

        // For large result sets, store in the database for efficient processing
        if (allResults.length > 0) {
          // Store the accumulated results directly in the database for faster recovery
          // This is more efficient than always reading/writing to storage
          try {
            // We'll store the full array for small to medium datasets (<5000 items)
            // For larger datasets, we'll store a checkpoint value
            const shouldStoreInDatabase = allResults.length < 5000;
            
            await supabaseAdmin
              .from('user_databases')
              .update({
                stored_results: shouldStoreInDatabase ? JSON.stringify(allResults) : null,
                last_processed_index: lastProcessedIndex + currentResults.length,
                total_results_count: allResults.length
              })
              .eq('id', database.id);
              
            console.log(`Updated database with state information, stored ${shouldStoreInDatabase ? 'full results' : 'checkpoint only'}`);
          } catch (error) {
            console.error('Error storing results state in database:', error);
          }
        }

        // Add to interim storage file every 500 new records for backup
        if (currentResults.length > 0 && (currentResults.length % 500 === 0 || database.current_query_index % 5 === 0)) {
          try {
            // Save interim results to storage as backup
            const interimJsonPath = `databases/${database.id}/${sanitizeFileName('interim_results')}.json`;
            await supabaseAdmin.storage
              .from('database_exports')
              .upload(interimJsonPath, JSON.stringify(allResults, null, 2), {
                contentType: 'application/json',
                upsert: true
              });
            console.log(`Saved checkpoint to storage after ${currentResults.length} new records`);
          } catch (error) {
            console.error('Error saving checkpoint to storage:', error);
          }
        }

        // Update statistics to track progress
        const currentStats = database.statistics || { 
          total: 0, 
          completed: 0,
          unique_contacts: 0,
          queries_processed: 1, 
          total_results: combinedResults.length
        };
        
        // Update query processing stats
        currentStats.queries_processed = (database.current_query_index || 0) + 1;
        currentStats.total_results = (currentStats.total_results || 0) + currentResults.length;
        currentStats.unique_contacts = allResults.length; // After deduplication
        currentStats.completed = allResults.length; // For backward compatibility
        
        // Keep track of total records expected/requested
        const totalLimitToReach = database.limit_count || database.credits_per_query;
        
        console.log(`Database status: ${allResults.length}/${totalLimitToReach} unique records (query ${database.current_query_index + 1}/${database.total_queries}, current batch: ${currentResults.length} records)`);

        // Determine if we should complete the database
        const reachedTargetContacts = allResults.length >= totalLimitToReach;
        
        // Check if we should mark as completed
        let isCompleted = false;
        
        // Only complete if target is reached - all other cases will continue processing
        if (reachedTargetContacts) {
          console.log(`Completing database: Reached target of ${totalLimitToReach} contacts (${allResults.length} found)`);
          isCompleted = true;
        }
        
        if (isCompleted) {
          // All queries completed or we've reached target, prepare final data
          console.log(`Database completed: ${allResults.length} total unique records found. Target was ${totalLimitToReach}.`);
          const filePaths: Record<string, string> = {};
          const formats = ['json', 'csv', 'excel'];
          const basePath = `databases/${database.id}`;
          const safeFileName = sanitizeFileName(database.name.replace(/\s+/g, '_').toLowerCase());
          console.log(`Sanitized filename: ${database.name} -> ${safeFileName}`);

          // STEP 1: Save JSON data with optimized handling for large datasets
          const jsonPath = `${basePath}/${safeFileName}.json`;

          // For very large datasets (>5000 records), use streaming upload approach
          if (allResults.length > 5000) {
            console.log(`Processing large dataset with ${allResults.length} records using optimized approach`);
            
            // Break into batches of 1000 for processing
            const batchSize = 1000;
            
            // Create a temporary file for the large JSON
            const chunks = [];
            chunks.push('['); // Start JSON array
            
            for (let i = 0; i < allResults.length; i += batchSize) {
              const batch = allResults.slice(i, Math.min(i + batchSize, allResults.length));
              console.log(`Processing JSON batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allResults.length / batchSize)}`);
              
              // Add this chunk to the JSON string (with proper commas between items)
              if (i > 0) chunks.push(',');
              chunks.push(batch.map((item, idx) => {
                const json = JSON.stringify(item);
                return idx === 0 && i === 0 ? json : (idx === 0 ? ' ' + json : json);
              }).join(','));
              
              // Update progress in database
              await supabaseAdmin
                .from('user_databases')
                .update({
                  export_progress: Math.min(Math.round((i + batch.length) / allResults.length * 100), 99)
                })
                .eq('id', database.id);
            }
            
            chunks.push(']'); // End JSON array
            
            // Upload the JSON file in one operation
            const { error: uploadError } = await supabaseAdmin.storage
              .from('database_exports')
              .upload(jsonPath, chunks.join(''), {
                contentType: 'application/json',
                upsert: true
              });

            if (uploadError) {
              console.error('Error uploading large JSON file:', uploadError);
              throw uploadError;
            }
          } else {
            // For smaller datasets, use the normal approach
            const jsonData = JSON.stringify(allResults, null, 2);

          const { error: uploadError } = await supabaseAdmin.storage
            .from('database_exports')
            .upload(jsonPath, jsonData, {
              contentType: 'application/json',
              upsert: true
            });

          if (uploadError) {
              console.error('Error uploading JSON file:', typeof uploadError === 'object' ? getObjectStructure(uploadError) : uploadError);
            throw uploadError;
            }
          }

          filePaths.json = jsonPath;

          // STEP 2: Generate and save CSV file with optimized handling for large datasets
          try {
            const csvPath = `${basePath}/${safeFileName}.csv`;
            
            // For very large datasets, process CSV in batches
            if (allResults.length > 5000) {
              console.log(`Processing large CSV with ${allResults.length} records`);
              
              // Get all possible fields from the first 100 records to establish headers
              const fields = new Set<string>();
              allResults.slice(0, 100).forEach(item => {
                Object.keys(item).forEach(key => fields.add(key));
              });
              
              // Create the headers
              const headers = Array.from(fields).join(',') + '\n';
              
              // Upload headers first
              await supabaseAdmin.storage
                .from('database_exports')
                .upload(csvPath, headers, {
                  contentType: 'text/csv',
                  upsert: true
                });
              
              // Process in batches of 1000
              const batchSize = 1000;
              for (let i = 0; i < allResults.length; i += batchSize) {
                const batch = allResults.slice(i, Math.min(i + batchSize, allResults.length));
                console.log(`Processing CSV batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allResults.length / batchSize)}`);
                
                // Convert batch to CSV rows
                const parser = new Parser({
                  fields: Array.from(fields),
                  header: false, // No header for batches after the first
                  defaultValue: ''
                });
                
                const batchContent = parser.parse(batch);
                
                // Append to the existing CSV
                const batchPath = `${basePath}/batch_${i}.csv`;
                await supabaseAdmin.storage
                  .from('database_exports')
                  .upload(batchPath, batchContent, {
                    contentType: 'text/csv',
                    upsert: true
                  });
                
                // Append this batch to the main file (this would be replaced with a more efficient solution in production)
                const { data: batchData } = await supabaseAdmin.storage
                  .from('database_exports')
                  .download(batchPath);
                  
                if (batchData) {
                  const batchText = await batchData.text();
                  
                  // Append to main file
                  await supabaseAdmin.storage
                    .from('database_exports')
                    .upload(`${csvPath}_tmp`, batchText, {
                      contentType: 'text/csv',
                      upsert: true
                    });
                    
                  // Delete the batch file
                  await supabaseAdmin.storage
                    .from('database_exports')
                    .remove([batchPath]);
                }
                
                // Update progress in database
                await supabaseAdmin
                  .from('user_databases')
                  .update({
                    export_progress: Math.min(Math.round((i + batch.length) / allResults.length * 100), 99)
                  })
                  .eq('id', database.id);
              }
              
              filePaths.csv = csvPath;
            } else {
              // For smaller datasets, use the normal approach
              const csvContent = convertToCSV(allResults);
              
              const { error: csvError } = await supabaseAdmin.storage
                .from('database_exports')
                .upload(csvPath, csvContent, {
                  contentType: 'text/csv',
                  upsert: true
                });
                
              if (!csvError) {
                filePaths.csv = csvPath;
              } else {
                console.error('Error uploading CSV file:', typeof csvError === 'object' ? getObjectStructure(csvError) : csvError);
              }
            }
          } catch (csvError) {
            console.error('Error generating CSV:', csvError);
          }
          
          // STEP 3: Generate and save Excel file
          try {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data');
            
            // Get all field names
            const allFields = new Set<string>();
            allResults.forEach((item: any) => {
              Object.keys(item).forEach(key => allFields.add(key));
            });
            
            // Set up columns
            worksheet.columns = Array.from(allFields).map(field => ({
              header: field,
              key: field,
              width: 20
            }));
            
            // Add rows
            worksheet.addRows(allResults);
            
            // Generate file
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const excelPath = `${basePath}/${safeFileName}.xlsx`;
            
            const { error: excelError } = await supabaseAdmin.storage
              .from('database_exports')
              .upload(excelPath, excelBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                upsert: true
              });
              
            if (!excelError) {
              filePaths.excel = excelPath;
            } else {
              console.error('Error generating Excel:', typeof excelError === 'object' ? getObjectStructure(excelError) : excelError);
            }
          } catch (excelError) {
            console.error('Error generating Excel:', excelError);
          }

          console.log(`Stored ${allResults.length} entries in export files.`);

          // Update the database record as completed
          await supabaseAdmin
            .from('user_databases')
            .update({
              status: 'completed',
              file_paths: filePaths,
              formats: formats,
              statistics: currentStats
            })
            .eq('id', database.id);

          return NextResponse.json({
            status: 'success',
            database: {
              ...database,
              status: 'completed',
              file_paths: filePaths,
              formats: formats,
              statistics: currentStats
            }
          });
        } else {
          // Target not reached - check if we need more queries
          
          // Save interim results to storage
          const interimJsonPath = `databases/${database.id}/${sanitizeFileName('interim_results')}.json`;
          await supabaseAdmin.storage
            .from('database_exports')
            .upload(interimJsonPath, JSON.stringify(allResults, null, 2), {
              contentType: 'application/json',
              upsert: true
            });

          // Check if this is a specific location query - regardless of whether it's been processed
          const specificLocationComplete = isSpecificLocation(database);

          if (specificLocationComplete) {
            // For specific locations, don't generate more queries - complete the database
            console.log(`Specific location database completed with ${allResults.length}/${totalLimitToReach} contacts.`);
            
            // We need to generate all file formats before completing
            const filePaths: Record<string, string> = { ...database.file_paths };
            const formats = ['json', 'csv', 'excel'];
            const basePath = `databases/${database.id}`;
            const safeFileName = sanitizeFileName(database.name.replace(/\s+/g, '_').toLowerCase());
            
            // 1. Save the JSON file
            const jsonPath = `${basePath}/${safeFileName}.json`;
            await supabaseAdmin.storage
              .from('database_exports')
              .upload(jsonPath, JSON.stringify(allResults, null, 2), {
                contentType: 'application/json',
                upsert: true
              });
            filePaths.json = jsonPath;
            
            // 2. Generate and save CSV
            try {
              const csvPath = `${basePath}/${safeFileName}.csv`;
              const csvContent = convertToCSV(allResults);
              
              await supabaseAdmin.storage
                .from('database_exports')
                .upload(csvPath, csvContent, {
                  contentType: 'text/csv',
                  upsert: true
                });
                
              filePaths.csv = csvPath;
            } catch (csvError) {
              console.error('Error generating CSV for specific location:', csvError);
            }
            
            // 3. Generate and save Excel
            try {
              const ExcelJS = require('exceljs');
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet('Data');
              
              // Get all field names
              const allFields = new Set<string>();
              allResults.forEach((item: any) => {
                Object.keys(item).forEach(key => allFields.add(key));
              });
              
              // Set up columns
              worksheet.columns = Array.from(allFields).map(field => ({
                header: field,
                key: field,
                width: 20
              }));
              
              // Add rows
              worksheet.addRows(allResults);
              
              // Generate file
              const excelBuffer = await workbook.xlsx.writeBuffer();
              const excelPath = `${basePath}/${safeFileName}.xlsx`;
              
              await supabaseAdmin.storage
                .from('database_exports')
                .upload(excelPath, excelBuffer, {
                  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  upsert: true
                });
                
              filePaths.excel = excelPath;
            } catch (excelError) {
              console.error('Error generating Excel for specific location:', excelError);
            }
            
            // Update the database record as completed
            await supabaseAdmin
              .from('user_databases')
              .update({
                status: 'completed',
                statistics: currentStats,
                file_paths: filePaths,
                formats: formats
              })
              .eq('id', database.id);
            
            return NextResponse.json({
              status: 'success',
              message: `Database completed with ${allResults.length} contacts (target was ${totalLimitToReach}, specific location)`,
              database: {
                ...database,
                status: 'completed',
                statistics: currentStats,
                file_paths: filePaths,
                formats: formats
              }
            });
          }

          // For all cities/states, generate next query
          const nextQuery = generateNextQuery(database);
          let updatedDatabase = database;
          
          if (nextQuery) {
            // Add the new query to the database
            updatedDatabase = await addNextQueryToDatabase(database, nextQuery);
            
            // Prepare API options for the next query
            const apiOptions: any = {
              limit: database.credits_per_query,
              language: database.language,
              async: true,
              dropDuplicates: true,
              search_depth: 'high'
            };
            
            // Add enrichment if specified
            if (database.enrichments && database.enrichments.length > 0) {
              apiOptions.enrichment = database.enrichments;
            }
  
            // Make the API call for the next query
            console.log(`Making API call for next query: ${nextQuery}`);
            const nextResponse = await outscraperService.searchGooglePlaces(
              nextQuery,
              '',
              apiOptions
            );
            
            if (!nextResponse || !nextResponse.id) {
              throw new Error(`Invalid response from Outscraper API for new query: missing request ID`);
            }
            
            // Update the database with new request ID and incremented query index
            const nextQueryIndex = database.current_query_index + 1;
            await supabaseAdmin
              .from('user_databases')
              .update({
                request_id: nextResponse.id,
                current_query_index: nextQueryIndex,
                statistics: currentStats,
                file_paths: { 
                  ...database.file_paths,
                  json: interimJsonPath
                }
              })
              .eq('id', database.id);
              
            return NextResponse.json({
              status: 'processing',
              message: `Processing next query for more results (${allResults.length}/${totalLimitToReach} contacts so far)`,
              database: {
                ...updatedDatabase,
                status: 'processing',
                request_id: nextResponse.id,
                current_query_index: nextQueryIndex,
                statistics: currentStats,
                file_paths: { 
                  ...database.file_paths,
                  json: interimJsonPath
                }
              }
            });
          } else {
            // No more queries to generate, mark as completed
            console.log(`No more queries to generate. Completing with ${allResults.length}/${totalLimitToReach} contacts.`);
            
            // Update the database record as completed
            await supabaseAdmin
              .from('user_databases')
              .update({
                status: 'completed',
                statistics: currentStats,
                file_paths: { 
                  ...database.file_paths,
                  json: interimJsonPath
                }
              })
              .eq('id', database.id);
            
            return NextResponse.json({
              status: 'success',
              message: `Database completed with ${allResults.length} contacts (target was ${totalLimitToReach})`,
              database: {
                ...database,
                status: 'completed',
                statistics: currentStats,
                file_paths: { 
                  ...database.file_paths,
                  json: interimJsonPath
                }
              }
            });
          }
        }
      } else if (response.status === 'Failed' || response.status === 'Error') {
        // Error with current request - try to generate a new query instead
        console.log(`Current query failed, trying to generate a new one`);
        
        // Generate next query
        const nextQuery = generateNextQuery(database);
        
        if (nextQuery) {
          // Add the new query to the database
          const updatedDatabase = await addNextQueryToDatabase(database, nextQuery);
          
          // Prepare API options for the next query
          const apiOptions: any = {
            limit: database.credits_per_query,
            language: database.language,
            async: true,
            dropDuplicates: true,
            search_depth: 'high'
          };
          
          // Add enrichment if specified
          if (database.enrichments && database.enrichments.length > 0) {
            apiOptions.enrichment = database.enrichments;
          }

          // Make the API call for the next query
          const nextResponse = await outscraperService.searchGooglePlaces(
            nextQuery,
            '',
            apiOptions
          );

          if (!nextResponse || !nextResponse.id) {
            throw new Error(`Invalid response from Outscraper API for new query: missing request ID`);
          }

          // Update the database with new request ID and query index
          const nextQueryIndex = database.current_query_index + 1;
          await supabaseAdmin
            .from('user_databases')
            .update({
              request_id: nextResponse.id,
              current_query_index: nextQueryIndex
            })
            .eq('id', database.id);

          return NextResponse.json({
            status: 'processing',
            message: `Previous query failed, trying with a new query`,
            database: {
              ...updatedDatabase,
              status: 'processing',
              request_id: nextResponse.id,
              current_query_index: nextQueryIndex
            }
          });
        } else {
          // No more queries to generate and current one failed
        await supabaseAdmin
          .from('user_databases')
          .update({
            status: 'failed'
          })
          .eq('id', database.id);

        return NextResponse.json({
            status: 'error',
            error: response.message || 'Outscraper request failed and no more queries available',
          database: {
            ...database,
            status: 'failed'
          }
        });
      }
      } else {
        // Still processing current query
      return NextResponse.json({
          status: 'processing',
          message: response.message || 'Still processing',
          database
        });
      }
    } catch (error) {
      console.error('Error checking database status:', typeof error === 'object' ? getObjectStructure(error) : error);
      
      // Don't update to failed automatically, we want to retry
      return NextResponse.json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        database
      });
    }
  } catch (error) {
    console.error('Failed to process database status check:', error);
    return NextResponse.json(
      { error: 'Failed to check database status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 