import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

// Define all available fields from Outscraper API
export const AVAILABLE_FIELDS = [
  { id: 'query', label: 'Query' },
  { id: 'name', label: 'Business Name' },
  { id: 'name_for_emails', label: 'Name for Emails' },
  { id: 'site', label: 'Website' },
  { id: 'subtypes', label: 'Subtypes' },
  { id: 'category', label: 'Category' },
  { id: 'type', label: 'Business Type' },
  { id: 'phone', label: 'Phone' },
  { id: 'full_address', label: 'Full Address' },
  { id: 'borough', label: 'Borough' },
  { id: 'street', label: 'Street' },
  { id: 'city', label: 'City' },
  { id: 'postal_code', label: 'Postal Code' },
  { id: 'area_service', label: 'Service Area' },
  { id: 'state', label: 'State' },
  { id: 'us_state', label: 'US State' },
  { id: 'country', label: 'Country' },
  { id: 'country_code', label: 'Country Code' },
  { id: 'latitude', label: 'Latitude' },
  { id: 'longitude', label: 'Longitude' },
  { id: 'h3', label: 'H3 Geolocation' },
  { id: 'time_zone', label: 'Time Zone' },
  { id: 'plus_code', label: 'Plus Code' },
  { id: 'rating', label: 'Rating' },
  { id: 'reviews', label: 'Reviews Count' },
  { id: 'reviews_link', label: 'Reviews Link' },
  { id: 'reviews_tags', label: 'Review Tags' },
  { id: 'reviews_per_score', label: 'Reviews per Score' },
  { id: 'reviews_per_score_1', label: 'Reviews Score 1' },
  { id: 'reviews_per_score_2', label: 'Reviews Score 2' },
  { id: 'reviews_per_score_3', label: 'Reviews Score 3' },
  { id: 'reviews_per_score_4', label: 'Reviews Score 4' },
  { id: 'reviews_per_score_5', label: 'Reviews Score 5' },
  { id: 'photos_count', label: 'Photos Count' },
  { id: 'photo', label: 'Photo' },
  { id: 'street_view', label: 'Street View' },
  { id: 'located_in', label: 'Located In' },
  { id: 'working_hours', label: 'Working Hours' },
  { id: 'working_hours_old_format', label: 'Working Hours (Old)' },
  { id: 'other_hours', label: 'Other Hours' },
  { id: 'popular_times', label: 'Popular Times' },
  { id: 'business_status', label: 'Business Status' },
  { id: 'about', label: 'About' },
  { id: 'range', label: 'Range' },
  { id: 'posts', label: 'Posts' },
  { id: 'logo', label: 'Logo' },
  { id: 'description', label: 'Description' },
  { id: 'typical_time_spent', label: 'Typical Time Spent' },
  { id: 'verified', label: 'Verified' },
  { id: 'owner_id', label: 'Owner ID' },
  { id: 'owner_title', label: 'Owner Title' },
  { id: 'owner_link', label: 'Owner Link' },
  { id: 'reservation_links', label: 'Reservation Links' },
  { id: 'booking_appointment_link', label: 'Booking Link' },
  { id: 'menu_link', label: 'Menu Link' },
  { id: 'order_links', label: 'Order Links' },
  { id: 'location_link', label: 'Location Link' },
  { id: 'place_id', label: 'Place ID' },
  { id: 'google_id', label: 'Google ID' },
  { id: 'cid', label: 'CID' },
  { id: 'kgmid', label: 'KGMID' },
  { id: 'reviews_id', label: 'Reviews ID' },
  { id: 'located_google_id', label: 'Located Google ID' },
  // Email fields
  { id: 'email_1', label: 'Email 1' },
  { id: 'email_1_full_name', label: 'Email 1 Full Name' },
  { id: 'email_1_first_name', label: 'Email 1 First Name' },
  { id: 'email_1_last_name', label: 'Email 1 Last Name' },
  { id: 'email_1_title', label: 'Email 1 Title' },
  { id: 'email_1_phone', label: 'Email 1 Phone' },
  { id: 'email_2', label: 'Email 2' },
  { id: 'email_2_full_name', label: 'Email 2 Full Name' },
  { id: 'email_2_first_name', label: 'Email 2 First Name' },
  { id: 'email_2_last_name', label: 'Email 2 Last Name' },
  { id: 'email_2_title', label: 'Email 2 Title' },
  { id: 'email_2_phone', label: 'Email 2 Phone' },
  { id: 'email_3', label: 'Email 3' },
  { id: 'email_3_full_name', label: 'Email 3 Full Name' },
  { id: 'email_3_first_name', label: 'Email 3 First Name' },
  { id: 'email_3_last_name', label: 'Email 3 Last Name' },
  { id: 'email_3_title', label: 'Email 3 Title' },
  { id: 'email_3_phone', label: 'Email 3 Phone' },
  // Phone fields
  { id: 'phone_1', label: 'Phone 1' },
  { id: 'phone_2', label: 'Phone 2' },
  { id: 'phone_3', label: 'Phone 3' },
  // Social media fields
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'medium', label: 'Medium' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'skype', label: 'Skype' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'vimeo', label: 'Vimeo' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'github', label: 'GitHub' },
  { id: 'crunchbase', label: 'Crunchbase' },
  // Website fields
  { id: 'website_title', label: 'Website Title' },
  { id: 'website_generator', label: 'Website Generator' },
  { id: 'website_description', label: 'Website Description' },
  { id: 'website_keywords', label: 'Website Keywords' },
  { id: 'website_has_fb_pixel', label: 'Has Facebook Pixel' },
  { id: 'website_has_google_tag', label: 'Has Google Tag' },
  // Company insights fields
  { id: 'name_company_insights', label: 'Company Name (Insights)' },
  { id: 'country_company_insights', label: 'Company Country' },
  { id: 'state_company_insights', label: 'Company State' },
  { id: 'city_company_insights', label: 'Company City' },
  { id: 'address_company_insights', label: 'Company Address' },
  { id: 'zip_company_insights', label: 'Company ZIP' },
  { id: 'timezone_company_insights', label: 'Company Timezone' },
  { id: 'is_public_company_insights', label: 'Is Public Company' },
  { id: 'founded_year_company_insights', label: 'Founded Year' },
  { id: 'employees_company_insights', label: 'Employee Count' },
  { id: 'revenue_company_insights', label: 'Revenue' },
  { id: 'total_money_raised_company_insights', label: 'Total Money Raised' },
  { id: 'industry_company_insights', label: 'Industry' },
  { id: 'description_company_insights', label: 'Company Description' },
  { id: 'linkedin_bio_company_insights', label: 'LinkedIn Bio' },
  { id: 'phone_company_insights', label: 'Company Phone' },
  { id: 'twitter_handle_company_insights', label: 'Twitter Handle' },
  { id: 'facebook_company_page_company_insights', label: 'Facebook Page' },
  { id: 'linkedin_company_page_company_insights', label: 'LinkedIn Page' },
  // Email verification fields
  { id: 'status_email_address_verifier', label: 'Email Status' },
  { id: 'status_details_email_address_verifier', label: 'Email Status Details' }
];

interface FieldSelectorProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export function FieldSelector({ selectedFields, onFieldsChange }: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter fields based on search term
  const filteredFields = AVAILABLE_FIELDS.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldToggle = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      onFieldsChange(selectedFields.filter(id => id !== fieldId));
    } else {
      onFieldsChange([...selectedFields, fieldId]);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    onFieldsChange(selectedFields.filter(id => id !== fieldId));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.field-selector-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="field-selector-container">
      <div className="relative">
        {/* Search input */}
        <div className="flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus-within:ring-2 focus-within:ring-primary dark:bg-slate-800">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search fields..."
            className="flex-1 ml-2 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
          />
        </div>

        {/* Selected fields tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFields.map(fieldId => {
            const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
            if (!field) return null;
            return (
              <div
                key={fieldId}
                className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-1 rounded-lg text-sm"
              >
                <span>{field.label}</span>
                <button
                  onClick={() => handleRemoveField(fieldId)}
                  className="hover:text-primary-dark dark:hover:text-primary-light focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Dropdown for field selection */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              {filteredFields.length === 0 ? (
                <div className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm">
                  No fields found
                </div>
              ) : (
                filteredFields.map(field => (
                  <div
                    key={field.id}
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFields.includes(field.id)
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => handleFieldToggle(field.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
                    />
                    <span className="ml-2 text-slate-900 dark:text-white">
                      {field.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 