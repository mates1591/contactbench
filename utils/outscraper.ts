import axios from 'axios';

// OutscraperResponse is our main interface for API responses
interface OutscraperResponse {
  id?: string;
  status?: string;
  data?: any[];
  results?: any[];
  error?: string;
  message?: string;
}

// Define region codes for Outscraper
type RegionCode = 'US' | 'GB' | 'CA' | 'DE' | 'FR' | 'IT' | 'ES' | 'JP' | 'AU' | 'CN' | string;

// Complete options interface for Google Places search
interface GooglePlacesSearchOptions {
  limit?: number;
  language?: string;
  enrichment?: string[];
  fields?: string;
  async?: boolean;
  dropDuplicates?: boolean;
  region?: RegionCode;
  coordinates?: string;
  skipPlaces?: number;
  search_depth?: 'high' | 'low' | 'medium';
  webhook?: string;
}

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

export class OutscraperService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = 'https://api.app.outscraper.com';
    this.apiKey = apiKey;
  }

  /**
   * Search Google Maps for places based on query
   */
  async searchGooglePlaces(
    query: string | string[], 
    location: string, 
    options: GooglePlacesSearchOptions = {}
  ): Promise<OutscraperResponse> {
    try {
      // If location is provided but not included in query, append it
      const formattedQuery = typeof query === 'string' && location 
        ? `${query}, ${location}`
        : query;
        
      console.log(`Sending Outscraper request for: "${formattedQuery}"`);
      
      // Build params object
      const params: any = {
        query: Array.isArray(formattedQuery) ? formattedQuery : [formattedQuery],
        limit: options.limit || 20,
        language: options.language || 'en',
        async: options.async !== undefined ? options.async : true,
        dropDuplicates: options.dropDuplicates !== undefined ? options.dropDuplicates : true
      };

      // If limit is very high, ensure we get enough results
      if (options.limit && options.limit > 20) {
        // For large limits, set search_depth to high to get more comprehensive results
        params.search_depth = options.search_depth || 'high';
      }

      // Add region if specified
      if (options.region) {
        params.region = options.region;
      }

      // Add coordinates if specified
      if (options.coordinates) {
        params.coordinates = options.coordinates;
      }

      // Add skipPlaces if specified
      if (options.skipPlaces) {
        params.skipPlaces = options.skipPlaces;
      }

      // Add enrichment if specified
      if (options.enrichment && options.enrichment.length > 0) {
        params.enrichment = options.enrichment;
      }

      // Add fields if specified
      if (options.fields) {
        params.fields = options.fields;
      }

      // Add webhook if specified
      if (options.webhook) {
        params.webhook = options.webhook;
      }

      console.log('Outscraper API request params:', params);

      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/maps/search-v3`,
        params: params,
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.apiKey
        },
        maxRedirects: 5,
        timeout: 60000, // Increased timeout for larger requests
      });

      const data = response.data;
      console.log('Response from Outscraper API:', { status: data.status, id: data.id });
      
      if (data.error) {
        throw new Error(`Outscraper API returned error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('Outscraper search error:', error);
      throw error;
    }
  }

  /**
   * Get region code from country name
   * This is a utility method to get the ISO region code from country name
   */
  getRegionFromCountry(countryName: string): RegionCode | undefined {
    const countryMap: Record<string, RegionCode> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Japan': 'JP',
      'Australia': 'AU',
      'China': 'CN',
      // Add more countries as needed
    };
    
    // Try direct match
    if (countryMap[countryName]) {
      return countryMap[countryName];
    }
    
    // Try partial match
    const key = Object.keys(countryMap).find(k => 
      countryName.toLowerCase().includes(k.toLowerCase()));
    
    return key ? countryMap[key] : undefined;
  }

  /**
   * Check the status of a previously submitted async task
   */
  async getRequestStatus(requestId: string): Promise<OutscraperResponse> {
    try {
      console.log(`Checking Outscraper status for request ID: ${requestId}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/requests/${requestId}`,
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.apiKey
        },
        maxRedirects: 5,
        timeout: 30000,
      });

      const data = response.data;
      console.log('Request status from Outscraper API:', { status: data.status, id: data.id });
      
      // Map 'Success' status to 'Completed'
      let status = data.status;
      if (status === 'Success' && data.data && data.data.length > 0) {
        status = 'Completed';
      }
      
      return {
        id: data.id || requestId,
        status: status || 'Unknown',
        message: data.message || data.description,
        data: data.data // Include data if available
      };
    } catch (error) {
      console.error(`Error checking Outscraper status for request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get the results of a completed async task
   */
  async getRequestResults(requestId: string): Promise<OutscraperResponse> {
    try {
      console.log(`Getting Outscraper results for request ID: ${requestId}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/requests/${requestId}/results`,
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.apiKey
        },
        maxRedirects: 5,
        timeout: 30000,
      });

      const data = response.data;
      console.log('Request results from Outscraper API:', { status: 'Completed', id: data.id, count: data.data?.length || 0 });
      
      // Normalize response structure
      return {
        id: data.id || requestId,
        status: 'Completed',
        data: data.data || data.results || [],
      };
    } catch (error) {
      console.error(`Error getting Outscraper results for request ${requestId}:`, error);
      throw error;
    }
  }
}

let outscraperService: OutscraperService | null = null;

export function getOutscraperService(): OutscraperService {
  if (!outscraperService) {
    const apiKey = process.env.NEXT_PUBLIC_OUTSCRAPER_API_KEY || '';
    outscraperService = new OutscraperService(apiKey);
  }
  return outscraperService;
}

export default OutscraperService; 