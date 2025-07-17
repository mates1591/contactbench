import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { parse } from 'json2csv';

// Helper function to flatten JSON object
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = '';
      continue;
    }

    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}_`));
    } else if (Array.isArray(obj[key])) {
      flattened[prefix + key] = obj[key].join(', ');
    } else {
      flattened[prefix + key] = obj[key];
    }
  }

  return flattened;
}

// Helper function to extract fields from Outscraper data
function extractFields(data: any[]): any[] {
  // Define the fields we want to extract and their order
  const fieldMap = {
    // Basic Information
    'site': 'Site',
    'name': 'Name',
    'type': 'Type',
    'category': 'Category',
    'description': 'Description',
    'full_address': 'Full Address',
    'google_id': 'Google ID',
    'place_id': 'Place ID',
    
    // Contact Information
    'phone': 'Phone',
    'phone_1': 'Phone 1',
    'phone_2': 'Phone 2',
    'phone_3': 'Phone 3',
    'telephone': 'Telephone',
    'telephone2': 'Telephone 2',
    'fax': 'Fax',
    'toll_free_number': 'Toll Free Number',
    'owner_phone': 'Owner Phone',
    'email_1': 'Email 1',
    'email_2': 'Email 2',
    'email_3': 'Email 3',
    
    // Phone & Email Enrichment
    'phone.phones_enricher.carrier_type': 'Phone Carrier Type',
    'phone.phones_enricher.carrier_name': 'Phone Carrier Name',
    'phone_1.phones_enricher.carrier_type': 'Phone 1 Carrier Type',
    'phone_1.phones_enricher.carrier_name': 'Phone 1 Carrier Name',
    'phone_2.phones_enricher.carrier_type': 'Phone 2 Carrier Type',
    'phone_2.phones_enricher.carrier_name': 'Phone 2 Carrier Name',
    'phone_3.phones_enricher.carrier_type': 'Phone 3 Carrier Type',
    'phone_3.phones_enricher.carrier_name': 'Phone 3 Carrier Name',
    'email_1.emails_validator.status': 'Email 1 Status',
    'email_1.emails_validator.status_details': 'Email 1 Status Details',
    'email_1_full_name': 'Email 1 Full Name',
    'email_1_first_name': 'Email 1 First Name',
    'email_1_last_name': 'Email 1 Last Name',
    'email_1_title': 'Email 1 Title',
    'email_1_phone': 'Email 1 Phone',
    'email_2.emails_validator.status': 'Email 2 Status',
    'email_2.emails_validator.status_details': 'Email 2 Status Details',
    'email_2_full_name': 'Email 2 Full Name',
    'email_2_first_name': 'Email 2 First Name',
    'email_2_last_name': 'Email 2 Last Name',
    'email_2_title': 'Email 2 Title',
    'email_2_phone': 'Email 2 Phone',
    'email_3.emails_validator.status': 'Email 3 Status',
    'email_3.emails_validator.status_details': 'Email 3 Status Details',
    'email_3_full_name': 'Email 3 Full Name',
    'email_3_first_name': 'Email 3 First Name',
    'email_3_last_name': 'Email 3 Last Name',
    'email_3_title': 'Email 3 Title',
    'email_3_phone': 'Email 3 Phone',
    
    // Location & Rating
    'latitude': 'Latitude',
    'longitude': 'Longitude',
    'rating': 'Rating',
    'reviews': 'Reviews Count',
    'photos_count': 'Photos Count',
    
    // Social Media
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'linkedin': 'LinkedIn',
    'twitter': 'Twitter',
    'youtube': 'YouTube',
    'tiktok': 'TikTok',
    'medium': 'Medium',
    'reddit': 'Reddit',
    'skype': 'Skype',
    'snapchat': 'Snapchat',
    'telegram': 'Telegram',
    'whatsapp': 'WhatsApp',
    'vimeo': 'Vimeo',
    'github': 'GitHub',
    'crunchbase': 'Crunchbase',
    'url': 'URL',
    
    // Company Insights
    'site.company_insights.name': 'Company Name',
    'site.company_insights.description': 'Company Description',
    'site.company_insights.industry': 'Industry',
    'site.company_insights.linkedin_bio': 'LinkedIn Bio',
    'site.company_insights.phone': 'Company Phone',
    'site.company_insights.address': 'Company Address',
    'site.company_insights.city': 'Company City',
    'site.company_insights.state': 'Company State',
    'site.company_insights.zip': 'Company ZIP',
    'site.company_insights.country': 'Company Country',
    'site.company_insights.founded_year': 'Founded Year',
    'site.company_insights.employees': 'Employee Count',
    'site.company_insights.revenue': 'Revenue',
    'site.company_insights.total_money_raised': 'Total Money Raised',
    'site.company_insights.is_public': 'Is Public Company',
    'site.company_insights.timezone': 'Timezone',
    'site.company_insights.facebook_company_page': 'Facebook Company Page',
    
    // Website Data
    'website_title': 'Website Title',
    'website_generator': 'Website Generator',
    'website_description': 'Website Description',
    'website_keywords': 'Website Keywords',
    'website_has_fb_pixel': 'Has Facebook Pixel',
    'website_has_google_tag': 'Has Google Tag',
    
    // TrustPilot Data
    'site.tp_data.query': 'TrustPilot Query URL',
    'site.tp_data.name': 'TrustPilot Name',
    'site.tp_data.rating': 'TrustPilot Rating',
    'site.tp_data.reviews': 'TrustPilot Reviews',
    'site.tp_data.claimed': 'TrustPilot Claimed',
    'site.tp_data.closed': 'TrustPilot Closed',
    'site.tp_data.temporarily_closed': 'TrustPilot Temporarily Closed',
    'site.tp_data.categories': 'TrustPilot Categories',
    'site.tp_data.email': 'TrustPilot Email',
    'site.tp_data.phone': 'TrustPilot Phone',
    'site.tp_data.address': 'TrustPilot Address',
    'site.tp_data.city': 'TrustPilot City',
    'site.tp_data.country': 'TrustPilot Country',
    'site.tp_data.zip_code': 'TrustPilot ZIP',
    'site.tp_data.profile_image': 'TrustPilot Profile Image',
    'site.tp_data.page_url': 'TrustPilot Page URL',
    'site.tp_data.activity_is_claimed': 'TrustPilot Is Claimed',
    'site.tp_data.activity_previously_claimed': 'TrustPilot Previously Claimed',
    'site.tp_data.activity_claimed_date': 'TrustPilot Claimed Date',
    'site.tp_data.activity_is_using_paid_features': 'TrustPilot Using Paid Features',
    'site.tp_data.activity_has_subscription': 'TrustPilot Has Subscription',
    'site.tp_data.activity_is_asking_for_reviews': 'TrustPilot Asking for Reviews',
    'site.tp_data.activity_reply_behavior_average_days_to_reply': 'TrustPilot Avg Days to Reply',
    'site.tp_data.activity_reply_behavior_last_reply_to_negative_review': 'TrustPilot Last Negative Reply',
    'site.tp_data.activity_reply_behavior_negative_reviews_with_replies_count': 'TrustPilot Negative Reviews with Replies',
    'site.tp_data.activity_reply_behavior_reply_percentage': 'TrustPilot Reply Percentage',
    'site.tp_data.activity_reply_behavior_total_negative_reviews_count': 'TrustPilot Total Negative Reviews',
    'site.tp_data.activity_verification_verified_by_google': 'TrustPilot Verified by Google',
    'site.tp_data.activity_verification_verified_business': 'TrustPilot Verified Business',
    'site.tp_data.activity_verification_verified_payment_method': 'TrustPilot Verified Payment',
    'site.tp_data.activity_verification_verified_user_identity': 'TrustPilot Verified Identity',
    'site.tp_data.activity_has_business_unit_merge_history': 'TrustPilot Has Merge History',
    'site.tp_data.activity_basiclink_rate': 'TrustPilot Basic Link Rate',
    'site.tp_data.activity_hide_basic_link_alert': 'TrustPilot Hide Basic Link Alert',
    'site.tp_data.activity_is_using_a_i_responses': 'TrustPilot Using AI Responses',
    
    // Business Information
    'company_name': 'Legal Company Name',
    'legal_name': 'Legal Name',
    'business_type': 'Business Type',
    'company_year_started': 'Company Year Started',
    'naics': 'NAICS Code',
    'naics_desc': 'NAICS Description',
    'sic6code': 'SIC6 Code',
    'sic6desc': 'SIC6 Description',
    'business_specialty': 'Business Specialty',
    'state_where_entity_formed': 'Formation State',
    'ein': 'EIN',
    'public': 'Is Public',
    'chain': 'Is Chain',
    'franchise': 'Is Franchise',
    'home_office': 'Home Office',
    'parent_company': 'Parent Company',
    'ethnicity': 'Ethnicity',
    'sales_volume': 'Sales Volume',
    'sales_code': 'Sales Code',
    'company_sales': 'Company Sales',
    'company_sales_code': 'Company Sales Code',
    'number_of_employees': 'Number of Employees',
    'employee_code': 'Employee Code',
    'company_num_emp': 'Company Employee Count',
    'working_hours': 'Working Hours'
  };

  // Handle case where data is nested in an array
  const records = Array.isArray(data[0]) ? data[0] : data;
  
  return records.map(item => {
    const extractedData: Record<string, any> = {};
    
    // Extract each field if it exists
    for (const [key, label] of Object.entries(fieldMap)) {
      // Handle nested data structure using dot notation
      const value = key.split('.').reduce((obj, k) => obj?.[k], item);
      
      if (value !== undefined && value !== null) {
        // Handle special cases
        if (key === 'working_hours') {
          if (typeof value === 'object') {
            extractedData[label] = Object.entries(value)
              .map(([day, hours]) => `${day}: ${hours}`)
              .join('; ');
          } else if (Array.isArray(value)) {
            extractedData[label] = value.join('; ');
          } else {
            extractedData[label] = value;
          }
        } else if (Array.isArray(value)) {
          extractedData[label] = value.join(', ');
        } else if (typeof value === 'boolean') {
          extractedData[label] = value ? 'Yes' : 'No';
        } else {
          extractedData[label] = value;
        }
      } else {
        // Set empty string for undefined/null values
        extractedData[label] = '';
      }
    }
    
    // Add working hours as a separate field
    if (item.working_hours) {
      extractedData['Working Hours'] = typeof item.working_hours === 'object' 
        ? Object.entries(item.working_hours)
            .map(([day, hours]) => `${day}: ${hours}`)
            .join('; ')
        : '';
    }
    
    return extractedData;
  });
}

// Helper function to convert JSON to CSV
function convertToCSV(data: any[]) {
  try {
    console.log('Converting to CSV, input data:', JSON.stringify(data).slice(0, 200) + '...');
    
    // Extract and format the data
    const formattedData = extractFields(data);
    console.log('Formatted data for CSV:', JSON.stringify(formattedData).slice(0, 200) + '...');
    
    if (formattedData.length === 0) {
      throw new Error('No data available for CSV export');
    }
    
    // Get fields from fieldMap to ensure consistent order
    const fields = Object.values({
      'Site': 'Site',
      'Name': 'Name',
      'Phone': 'Phone',
      'Category': 'Category',
      'Type': 'Type',
      'Full Address': 'Full Address',
      'Google ID': 'Google ID',
      'Rating': 'Rating',
      'Reviews': 'Reviews',
      'Price Level': 'Price Level',
      'Website': 'Website',
      'Email': 'Email',
      'Facebook': 'Facebook',
      'Instagram': 'Instagram',
      'LinkedIn': 'LinkedIn',
      'Twitter': 'Twitter',
      'YouTube': 'YouTube',
      'Description': 'Description',
      'Working Hours': 'Working Hours',
      'Photos Count': 'Photos Count',
      'Latitude': 'Latitude',
      'Longitude': 'Longitude'
    });
    
    console.log('CSV Fields:', fields);
    
    // Create parser with fields
    const parser = new Parser({
      fields,
      header: true
    });
    
    const csvData = parser.parse(formattedData);
    console.log('CSV Data preview:', csvData.slice(0, 200) + '...');
    return csvData;
  } catch (error) {
    console.error('Error converting to CSV:', error);
    throw error;
  }
}

// Helper function to convert JSON to Excel
async function convertToExcel(data: any[]): Promise<Buffer> {
  try {
    console.log('Converting to Excel, input data:', JSON.stringify(data).slice(0, 200) + '...');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    
    // Extract and format the data
    const formattedData = extractFields(data);
    console.log('Formatted data for Excel:', JSON.stringify(formattedData).slice(0, 200) + '...');
    
    if (formattedData.length === 0) {
      throw new Error('No data available for Excel export');
    }

    // Get all headers from the first formatted item
    const fields = Object.keys(formattedData[0]);
    
    console.log('Excel Fields:', fields);
    
    // Define columns first
    worksheet.columns = fields.map(field => ({
      header: field,
      key: field,
      width: 20
    }));
    
    // Add data rows
    formattedData.forEach((item, index) => {
      try {
        const rowData = fields.reduce((acc: Record<string, any>, field: string) => {
          acc[field] = item[field] || '';
          return acc;
        }, {});
        worksheet.addRow(rowData);
      } catch (rowError) {
        console.error(`Error adding row ${index}:`, rowError);
        console.log('Problematic row data:', item);
      }
    });
    
    // Format headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Auto-fit columns
    fields.forEach((field, i) => {
      const column = worksheet.getColumn(i + 1);
      let maxLength = field.length;
      
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellLength = cell.value ? String(cell.value).length : 10;
        maxLength = Math.max(maxLength, cellLength);
      });
      
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    console.log('Generating Excel buffer...');
    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    console.log('Excel buffer generated');
    return buffer;
  } catch (error) {
    console.error('Error converting to Excel:', error);
    throw error;
  }
}

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { databaseId, userId, format = 'json' } = await request.json();
    console.log('Export request received:', { databaseId, userId, format });

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
        { error: 'Database is not ready for export', status: database.status },
        { status: 400 }
      );
    }
    
    // Get the JSON data
    let jsonData: any[] = [];
    
    if (database.file_paths?.json) {
      console.log('Fetching JSON data from:', database.file_paths.json);
      const { data, error: fileError } = await supabaseAdmin.storage
        .from('database_exports')
        .download(database.file_paths.json);
        
      if (fileError) {
        console.error('Error downloading JSON file:', fileError);
        return NextResponse.json(
          { error: 'Failed to access data source', details: fileError.message },
          { status: 500 }
        );
      }
      
      const text = await data.text();
      try {
        jsonData = JSON.parse(text);
        console.log('JSON data loaded, original records count:', jsonData.length);
        
        // Ensure we have a flat array of records
        // Handle different nesting structures that might occur in older exports
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          if (Array.isArray(jsonData[0]) && Array.isArray(jsonData[0][0])) {
            // Triple nested [[[records]]]
            jsonData = jsonData[0][0];
          } else if (Array.isArray(jsonData[0]) && !Array.isArray(jsonData[0][0])) {
            // Double nested [[records]]
            jsonData = jsonData[0];
          }
          // Otherwise already flat [records]
        }
        
        console.log('JSON data flattened, final records count:', jsonData.length);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse data source', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No data source found for this database' },
        { status: 404 }
      );
    }
    
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data available for export' },
        { status: 400 }
      );
    }
    
    // Generate the requested format
    const basePath = `databases/${databaseId}`;
    let filePath = '';
    let contentType = '';
    let fileData: string | Buffer;
    const safeFileName = database.name.replace(/\s+/g, '_').toLowerCase();
    
    console.log('Generating', format, 'format...');
    
    try {
      if (format === 'excel') {
        filePath = `${basePath}/${safeFileName}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileData = await convertToExcel(jsonData);
      } else if (format === 'csv') {
        filePath = `${basePath}/${safeFileName}.csv`;
        contentType = 'text/csv';
        fileData = convertToCSV(jsonData);
      } else {
        filePath = `${basePath}/${safeFileName}.json`;
        contentType = 'application/json';
        fileData = JSON.stringify(jsonData, null, 2);
      }
    } catch (conversionError) {
      console.error(`Error converting to ${format}:`, conversionError);
      return NextResponse.json(
        { error: `Failed to convert to ${format}`, details: conversionError instanceof Error ? conversionError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    if (!fileData) {
      return NextResponse.json(
        { error: `Failed to generate ${format} file - no data produced` },
        { status: 500 }
      );
    }
    
    console.log('Uploading file to storage...');
    
    // Save the file
    const { error: uploadError } = await supabaseAdmin.storage
      .from('database_exports')
      .upload(filePath, fileData, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error(`Error uploading ${format} file:`, uploadError);
      return NextResponse.json(
        { error: `Failed to save ${format} export`, details: uploadError.message },
        { status: 500 }
      );
    }
    
    console.log('File uploaded, generating signed URL...');
    
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
    
    // Update database record
    const updatedFilePaths = { 
      ...(database.file_paths || {}), 
      [format]: filePath 
    };
    
    const updatedFormats = database.formats ? 
      (database.formats.includes(format) ? database.formats : [...database.formats, format]) : 
      [format];
      
    await supabaseAdmin
      .from('user_databases')
      .update({ 
        file_paths: updatedFilePaths,
        formats: updatedFormats,
        selected_format: format
      })
      .eq('id', databaseId);
    
    console.log('Export completed successfully');
    
    return NextResponse.json({
      status: 'success',
      database: {
        ...database,
        selected_format: format,
        file_paths: updatedFilePaths,
        formats: updatedFormats
      },
      downloadUrl: signedUrlData.signedUrl
    });
  } catch (error) {
    console.error('Database export error:', error);
    return NextResponse.json(
      { error: 'Failed to export database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

export const GET = withCors(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const databaseId = searchParams.get('databaseId');
    const format = searchParams.get('format') || 'json';
    
    if (!databaseId) {
      return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
    }
    
    // Get the database and check if it belongs to the user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check user authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the database
    const { data: database, error: dbError } = await supabase
      .from('user_databases')
      .select('*')
      .eq('id', databaseId)
      .eq('user_id', user.id)
      .single();
      
    if (dbError || !database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }
    
    // Get all entries for this database
    const { data: entries, error: entriesError } = await supabase
      .from('database_entries')
      .select('*')
      .eq('database_id', databaseId);
      
    if (entriesError) {
      return NextResponse.json({ error: 'Failed to fetch database entries' }, { status: 500 });
    }
    
    // Handle different export formats
    let fileData: string | Buffer | any;
    let contentType = 'application/json';
    let fileName = `${database.name.replace(/\s+/g, '_')}`;
    
    switch (format) {
      case 'json':
        fileData = JSON.stringify(entries, null, 2);
        fileName += '.json';
        break;
        
      case 'csv':
        if (entries.length === 0) {
          fileData = '';
        } else {
          try {
            fileData = parse(entries);
          } catch (error) {
            console.error('CSV conversion error:', error);
            fileData = '';
          }
        }
        contentType = 'text/csv';
        fileName += '.csv';
        break;
        
      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Database Entries');
        
        if (entries.length > 0) {
          // Add headers
          const headers = Object.keys(entries[0]);
          worksheet.addRow(headers);
          
          // Add data
          entries.forEach(entry => {
            worksheet.addRow(Object.values(entry));
          });
        }
        
        fileData = await workbook.xlsx.writeBuffer();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName += '.xlsx';
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
    
    // Create a new response with the file
    const response = new NextResponse(fileData);
    
    // Set appropriate headers
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return response;
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'An error occurred during export' }, { status: 500 });
  }
}); 