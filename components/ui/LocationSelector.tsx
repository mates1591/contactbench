'use client';

import { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Button } from './button';

interface Location {
  country?: string;
  state?: string;
  city?: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: Location) => void;
}

export function LocationSelector({ onLocationSelect }: LocationSelectorProps) {
  const [open, setOpen] = useState({
    country: false,
    state: false,
    city: false,
  });

  const [selected, setSelected] = useState<Location>({});

  const countries = Country.getAllCountries();
  
  // Get states but limit and sort them
  const getStates = (countryCode: string) => {
    const allStates = State.getStatesOfCountry(countryCode);
    
    // Filter out administrative divisions that don't have cities
    // These are likely not proper states/provinces that users would expect
    const validStates = allStates.filter(state => {
      // Check if this state has any cities
      const citiesCount = City.getCitiesOfState(countryCode, state.isoCode).length;
      // Only include divisions that have cities
      return citiesCount > 0;
    });
    
    // Sort states by number of cities (as a proxy for importance)
    const sortedStates = validStates.sort((a, b) => {
      const aCities = City.getCitiesOfState(countryCode, a.isoCode).length;
      const bCities = City.getCitiesOfState(countryCode, b.isoCode).length;
      return bCities - aCities; // Sort by number of cities (descending)
    });
    
    return sortedStates;
  };
  
  const states = selected.country 
    ? getStates(selected.country) 
    : [];
  
  const cities = selected.state 
    ? City.getCitiesOfState(selected.country!, selected.state) 
    : [];

  const handleSelect = (type: keyof Location, value: string | undefined) => {
    const newSelected = {
      ...selected,
      [type]: value,
    };

    // Clear dependent fields
    if (type === 'country') {
      newSelected.state = undefined;
      newSelected.city = undefined;
    } else if (type === 'state') {
      newSelected.city = undefined;
    }

    setSelected(newSelected);
    onLocationSelect(newSelected);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Country Selector */}
      <Popover open={open.country} onOpenChange={(o) => setOpen({ ...open, country: o })}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open.country}
            className="justify-between"
          >
            {selected.country
              ? countries.find((c) => c.isoCode === selected.country)?.name
              : "Select country..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.isoCode}
                  onSelect={() => {
                    handleSelect('country', country.isoCode);
                    setOpen({ ...open, country: false });
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.country === country.isoCode ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* State Selector */}
      {selected.country && (
        <Popover open={open.state} onOpenChange={(o) => setOpen({ ...open, state: o })}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open.state}
              className="justify-between"
            >
              {selected.state
                ? states.find((s) => s.isoCode === selected.state)?.name
                : "Select state..."}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search state..." />
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {states.map((state) => (
                  <CommandItem
                    key={state.isoCode}
                    onSelect={() => {
                      handleSelect('state', state.isoCode);
                      setOpen({ ...open, state: false });
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.state === state.isoCode ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {state.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* City Selector */}
      {selected.state && (
        <Popover open={open.city} onOpenChange={(o) => setOpen({ ...open, city: o })}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open.city}
              className="justify-between"
            >
              {selected.city
                ? cities.find((c) => c.name === selected.city)?.name
                : "Select city..."}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search city..." />
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {cities.map((city) => (
                  <CommandItem
                    key={city.name}
                    onSelect={() => {
                      handleSelect('city', city.name);
                      setOpen({ ...open, city: false });
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.city === city.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
} 