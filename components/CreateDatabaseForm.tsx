'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { motion } from 'framer-motion';
import { AlertCircle, Globe, MapPin, Search, List, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Country, State, City } from 'country-state-city';
import { FieldSelector, AVAILABLE_FIELDS } from './ui/FieldSelector';

// Available enrichment options
const ENRICHMENT_OPTIONS = [
  { id: 'domains_service', label: 'Email & Contact Discovery', description: 'Find email addresses and contact information' },
  { id: 'emails_validator_service', label: 'Email Validation', description: 'Verify discovered email addresses' },
  { id: 'company_insights_service', label: 'Company Insights', description: 'Get detailed company information' },
  { id: 'phones_enricher_service', label: 'Phone Number Enrichment', description: 'Validate and enrich phone numbers' }
];

// Add language options constant at the top of the file after ENRICHMENT_OPTIONS
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'es-419', name: 'Spanish (Latin America)' },
  { code: 'fr', name: 'French' },
  { code: 'hr', name: 'Croatian' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'th', name: 'Thai' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ach', name: 'Acholi' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'ak', name: 'Akan' },
  { code: 'ig', name: 'Igbo' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'ban', name: 'Balinese' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'br', name: 'Breton' },
  { code: 'ca', name: 'Catalan' },
  { code: 'cs', name: 'Czech' },
  { code: 'sn', name: 'Shona' },
  { code: 'co', name: 'Corsican' },
  { code: 'cy', name: 'Welsh' },
  { code: 'da', name: 'Danish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'et', name: 'Estonian' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'eu', name: 'Basque' },
  { code: 'ee', name: 'Ewe' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'fil', name: 'Filipino' },
  { code: 'fo', name: 'Faroese' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gaa', name: 'Ga' },
  { code: 'ga', name: 'Irish' },
  { code: 'gd', name: 'Scottish Gaelic' },
  { code: 'gl', name: 'Galician' },
  { code: 'gn', name: 'Guarani' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'bem', name: 'Bemba' },
  { code: 'rn', name: 'Kirundi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ia', name: 'Interlingua' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'zu', name: 'Zulu' },
  { code: 'is', name: 'Icelandic' },
  { code: 'jw', name: 'Javanese' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'sw', name: 'Swahili' },
  { code: 'tlh', name: 'Klingon' },
  { code: 'kg', name: 'Kongo' },
  { code: 'mfe', name: 'Mauritian Creole' },
  { code: 'kri', name: 'Krio' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'to', name: 'Tongan' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ln', name: 'Lingala' },
  { code: 'loz', name: 'Lozi' },
  { code: 'lua', name: 'Luba-Lulua' },
  { code: 'lg', name: 'Ganda' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'ms', name: 'Malay' },
  { code: 'pcm', name: 'Nigerian Pidgin' },
  { code: 'no', name: 'Norwegian' },
  { code: 'nso', name: 'Northern Sotho' },
  { code: 'ny', name: 'Nyanja' },
  { code: 'nn', name: 'Norwegian Nynorsk' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'oc', name: 'Occitan' },
  { code: 'om', name: 'Oromo' },
  { code: 'ro', name: 'Romanian' },
  { code: 'rm', name: 'Romansh' },
  { code: 'qu', name: 'Quechua' },
  { code: 'nyn', name: 'Nyankole' },
  { code: 'crs', name: 'Seychellois Creole' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'st', name: 'Southern Sotho' },
  { code: 'sr-ME', name: 'Serbian (Montenegro)' },
  { code: 'sr-Latn', name: 'Serbian (Latin)' },
  { code: 'su', name: 'Sundanese' },
  { code: 'fi', name: 'Finnish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tn', name: 'Tswana' },
  { code: 'tum', name: 'Tumbuka' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'tw', name: 'Twi' },
  { code: 'wo', name: 'Wolof' },
  { code: 'el', name: 'Greek' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'tt', name: 'Tatar' },
  { code: 'tg', name: 'Tajik' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ka', name: 'Georgian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ps', name: 'Pashto' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'fa', name: 'Persian' },
  { code: 'ckb', name: 'Kurdish (Sorani)' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'am', name: 'Amharic' },
  { code: 'ne', name: 'Nepali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'or', name: 'Odia' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'si', name: 'Sinhala' },
  { code: 'lo', name: 'Lao' },
  { code: 'my', name: 'Burmese' },
  { code: 'km', name: 'Khmer' },
  { code: 'chr', name: 'Cherokee' }
];

interface Category {
  type: string;
  "number of appearances": number;
}

interface CreateDatabaseFormProps {
  onComplete?: (success: boolean) => void;
  onCancel?: () => void;
}

export function CreateDatabaseForm({ onComplete, onCancel }: CreateDatabaseFormProps) {
  const { createDatabase, error } = useDatabase();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditsAvailable, setCreditsAvailable] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  
  // Search type toggle
  const [useCategory, setUseCategory] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    query: '',
    location: '',
    limit: 20,
    language: 'en'
  });

  // Location input method toggle
  const [useStructuredLocation, setUseStructuredLocation] = useState(true);
  const [freeTextLocation, setFreeTextLocation] = useState('');

  // Location selection state
  const [countries, setCountries] = useState(Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [useAllStates, setUseAllStates] = useState(false);
  const [useAllCities, setUseAllCities] = useState(false);

  // State for enrichments
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>([]);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/data/categories.json');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
    loadCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categorySearch
    ? categories.filter(cat => 
        cat.type.toLowerCase().includes(categorySearch.toLowerCase())
      )
    : categories;

  // Initialize countries on component mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update query when category changes
  useEffect(() => {
    if (useCategory && selectedCategory) {
      setFormData(prev => ({ ...prev, query: selectedCategory.type }));
    }
  }, [selectedCategory, useCategory]);

  // Fetch available credits when component mounts
  useEffect(() => {
    async function fetchCredits() {
      if (!user?.id) return;
      
      try {
        setIsLoadingCredits(true);
        const { data, error } = await supabase
          .from('user_contact_credits')
          .select('credits_available')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        setCreditsAvailable(data.credits_available);
      } catch (err) {
        console.error('Error fetching credits:', err);
        setCreditsError('Unable to fetch available credits');
      } finally {
        setIsLoadingCredits(false);
      }
    }
    
    fetchCredits();
  }, [user?.id]);

  // Update location string when country/state/city changes
  useEffect(() => {
    if (!useStructuredLocation) {
      // When using free text mode, update formData location from freeTextLocation
      setFormData(prev => ({ ...prev, location: freeTextLocation }));
      return;
    }

    let locationString = '';
    
    if (selectedCity && !useAllCities) {
      locationString = selectedCity;
    }
    
    if (selectedState && !useAllStates) {
      locationString = selectedCity && !useAllCities
        ? `${selectedCity}, ${selectedState.name}` 
        : selectedState.name;
    } else if (useAllStates && selectedCountry) {
      locationString = selectedCity && !useAllCities
        ? `${selectedCity}, All States, ${selectedCountry.name}` 
        : `All States, ${selectedCountry.name}`;
    }
    
    if (selectedCountry) {
      if (useAllStates) {
        locationString = selectedCity && !useAllCities
          ? `${selectedCity}, ${selectedCountry.name}` 
          : (locationString || selectedCountry.name);
      } else {
        locationString = locationString 
          ? `${locationString}, ${selectedCountry.name}` 
          : selectedCountry.name;
      }
    }

    // Handle "All Cities" case
    if (useAllCities && selectedState && !useAllStates) {
      locationString = `All Cities, ${selectedState.name}, ${selectedCountry.name}`;
    } else if (useAllCities && useAllStates && selectedCountry) {
      locationString = `All Cities, All States, ${selectedCountry.name}`;
    }
    
    setFormData(prev => ({ ...prev, location: locationString }));
  }, [selectedCountry, selectedState, selectedCity, useAllStates, useAllCities, useStructuredLocation, freeTextLocation]);

  const handleLocationToggleChange = () => {
    setUseStructuredLocation(!useStructuredLocation);
    if (useStructuredLocation) {
      // Switching to free text mode
      setFreeTextLocation(formData.location);
    }
  };

  const handleFreeTextLocationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFreeTextLocation(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    if (!countryCode) {
      setSelectedCountry(null);
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity('');
      setUseAllStates(false);
      setUseAllCities(false);
      return;
    }
    
    const country = countries.find(c => c.isoCode === countryCode);
    setSelectedCountry(country);
    
    // Get all states and filter out divisions that don't have cities
    const allStates = State.getStatesOfCountry(countryCode);
    
    // Filter out administrative divisions that don't have cities
    // These are likely not proper states/provinces that users would expect
    const validStates = allStates.filter(state => {
      // Check if this state has any cities
      const citiesCount = City.getCitiesOfState(countryCode, state.isoCode).length;
      // Only include divisions that have cities
      return citiesCount > 0;
    });
    
    // Sort states from most to least cities (as a proxy for importance)
    const sortedStates = validStates.sort((a, b) => {
      const aCities = City.getCitiesOfState(countryCode, a.isoCode).length;
      const bCities = City.getCitiesOfState(countryCode, b.isoCode).length;
      return bCities - aCities;
    });
    
    setStates(sortedStates);
    setCities([]);
    setSelectedState(null);
    setSelectedCity('');
    setUseAllCities(false);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    
    if (stateCode === 'all_states') {
      setUseAllStates(true);
      setSelectedState(null);
      setCities([]);
      setSelectedCity('');
      setUseAllCities(false);
      return;
    }
    
    setUseAllStates(false);
    
    if (!stateCode || !selectedCountry) {
      setSelectedState(null);
      setCities([]);
      setSelectedCity('');
      setUseAllCities(false);
      return;
    }
    
    const state = states.find(s => s.isoCode === stateCode);
    setSelectedState(state);
    setCities(City.getCitiesOfState(selectedCountry.isoCode, stateCode));
    setSelectedCity('');
    setUseAllCities(false);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityValue = e.target.value;
    
    if (cityValue === 'all_cities') {
      setUseAllCities(true);
      setSelectedCity('');
      return;
    }
    
    setUseAllCities(false);
    setSelectedCity(cityValue);
  };

  const handleSearchTypeToggle = () => {
    setUseCategory(!useCategory);
    if (!useCategory) {
      // Switching to category mode
      setFormData(prev => ({ ...prev, query: selectedCategory?.type || '' }));
    }
  };

  const handleCategorySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCategorySearch(category.type);
    setShowCategoryDropdown(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (useCategory && name === 'query') {
      // Don't allow direct query editing in category mode
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle enrichment selection
  const handleEnrichmentToggle = (enrichmentId: string) => {
    setSelectedEnrichments(prev => 
      prev.includes(enrichmentId) 
        ? prev.filter(id => id !== enrichmentId)
        : [...prev, enrichmentId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare location data based on selection type
      let locationData: {
        country?: string;
        state?: string;
        city?: string;
        cities?: string[];
        states?: string[];
      } = {};
      
      let queryType: 'simple' | 'structured' | 'free_text';
      let locations;
      
      if (useStructuredLocation) {
        queryType = 'structured';
        locationData = {
          country: selectedCountry?.name || undefined,
          state: selectedState?.name || undefined,
          city: selectedCity || undefined
        };
        
        // Properly handle "All Cities" selection
        if (useAllCities) {
          if (selectedState) {
            // Get all cities for the selected state
            const citiesInState = cities.map(city => city.name);
            locationData.cities = citiesInState;
            
            console.log(`Including ${citiesInState.length} cities for ${selectedState.name}`);
            
            // Mark as all cities
            locationData.city = 'all_cities';
          }
        }
        
        // Properly handle "All States" selection
        if (useAllStates && selectedCountry) {
          // Get all states for the selected country
          const statesInCountry = states.map(state => state.name);
          locationData.states = statesInCountry;
          
          console.log(`Including ${statesInCountry.length} states for ${selectedCountry.name}`);
          
          // Mark as all states
          locationData.state = 'all_states';
        }
      } else {
        queryType = 'free_text';
        locations = freeTextLocation;
      }
      
      // Set the search type and categories
      let searchType = 'places';
      let categories: string[] = [];
      
      if (useCategory && selectedCategory) {
        searchType = 'places';
        categories = [selectedCategory.type];
      }
      
      console.log(`Creating database with query "${formData.query}" and location:`, locationData);
      
      // Create database with new parameter structure
      const success = await createDatabase({
        name: formData.name,
        query: formData.query,
        query_type: queryType,
        location: useStructuredLocation ? locationData : undefined,
        locations: !useStructuredLocation ? locations : undefined,
        credits: Number(formData.limit),
        limit_count: Number(formData.limit),
        enrichments: selectedEnrichments,
        language: formData.language,
        search_type: searchType,
      });
      
      if (success) {
        onComplete?.(true);
      }
    } catch (error) {
      console.error('Error creating database:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const notEnoughCredits = creditsAvailable !== null && Number(formData.limit) > creditsAvailable;

  return (
    <div className="bg-neutral-dark rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Create New Database
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <div className="p-6 bg-neutral-dark">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Name */}
            <div className="col-span-2 bg-neutral p-5 rounded-xl shadow-md">
              <label className="block text-sm font-medium text-white mb-1">
                Database Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="My Business Database"
                required
              />
            </div>

            {/* Search Type and Query */}
            <div className="col-span-2 bg-neutral p-5 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-white">
                  Search Type
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {useCategory ? 'Category' : 'Query'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSearchTypeToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      !useCategory ? 'bg-primary' : 'bg-neutral-dark'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !useCategory ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {useCategory ? (
                <div className="relative">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={handleCategorySearch}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Search categories..."
                    className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-neutral-dark border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCategories.map((category) => (
                        <div
                          key={category.type}
                          className="px-4 py-2 hover:bg-neutral text-white cursor-pointer"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category.type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  name="query"
                  value={formData.query}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="restaurants, coffee shops, etc."
                />
              )}
            </div>

            {/* Location Selection */}
            <div className="col-span-2 bg-neutral p-5 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-white">
                  Location
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {useStructuredLocation ? 'Structured' : 'Free Text'}
                  </span>
                  <button
                    type="button"
                    onClick={handleLocationToggleChange}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      !useStructuredLocation ? 'bg-primary' : 'bg-neutral-dark'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !useStructuredLocation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {useStructuredLocation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <select
                    value={selectedCountry?.isoCode || ''}
                    onChange={handleCountryChange}
                    className="px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedState?.isoCode || (useAllStates ? 'all_states' : '')}
                    onChange={handleStateChange}
                    disabled={!selectedCountry}
                    className="px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Select State/Province</option>
                    {selectedCountry && <option value="all_states">All States</option>}
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedCity || (useAllCities ? 'all_cities' : '')}
                    onChange={handleCityChange}
                    disabled={!selectedState && !useAllStates}
                    className="px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {(selectedState || useAllStates) && (
                      <option value="all_cities">All Cities</option>
                    )}
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <textarea
                  value={freeTextLocation}
                  onChange={handleFreeTextLocationChange}
                  className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent mt-3"
                  placeholder="Enter location(s), one per line"
                  rows={3}
                />
              )}
            </div>

            {/* Data Enrichment Options */}
            <div className="col-span-2 bg-neutral p-5 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-white mb-3">Data Enrichment Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ENRICHMENT_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`relative flex items-start p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedEnrichments.includes(option.id)
                        ? 'border-primary bg-neutral-dark'
                        : 'border-gray-700 bg-neutral-darker hover:border-primary/50'
                    }`}
                    onClick={() => handleEnrichmentToggle(option.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <label className="font-medium text-white">
                        {option.label}
                      </label>
                      <p className="text-sm text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    <div className="ml-3 flex h-5 items-center">
                      <input
                        type="checkbox"
                        checked={selectedEnrichments.includes(option.id)}
                        onChange={() => handleEnrichmentToggle(option.id)}
                        className="h-4 w-4 text-primary border-gray-700 rounded focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Result Limit and Language in a two-column layout */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Result Limit */}
              <div className="bg-neutral p-5 rounded-xl shadow-md">
                <label className="block text-sm font-medium text-white mb-1">
                  Result Limit (Credits to Use)
                </label>
                <input
                  type="number"
                  name="limit"
                  value={formData.limit}
                  onChange={handleChange}
                  min="1"
                  max={creditsAvailable || undefined}
                  className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Uses 1 credit per contact. You have {creditsAvailable} credits available.
                </p>
                {creditsError && (
                  <p className="mt-1 text-sm text-red-500">
                    {creditsError}
                  </p>
                )}
              </div>

              {/* Language */}
              <div className="bg-neutral p-5 rounded-xl shadow-md">
                <label className="block text-sm font-medium text-white mb-1">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-neutral-dark border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 p-4 border-t border-gray-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-neutral border border-gray-700 hover:bg-neutral-darker text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 