'use client';

import { useState } from 'react';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

interface ColumnGroup {
  name: string;
  columns: Column[];
}

interface Column {
  id: string;
  label: string;
}

const columnGroups: ColumnGroup[] = [
  {
    name: 'Basic Information',
    columns: [
      { id: 'name', label: 'Business Name' },
      { id: 'address', label: 'Address' },
      { id: 'categories', label: 'Categories' },
      { id: 'description', label: 'Description' },
      { id: 'type', label: 'Business Type' }
    ]
  },
  {
    name: 'Contact Information',
    columns: [
      { id: 'phone', label: 'Phone Number' },
      { id: 'email', label: 'Email' },
      { id: 'website', label: 'Website' },
      { id: 'social_links', label: 'Social Media Links' },
      { id: 'messenger_link', label: 'Messenger Link' }
    ]
  },
  {
    name: 'Business Details',
    columns: [
      { id: 'working_hours', label: 'Working Hours' },
      { id: 'rating', label: 'Rating' },
      { id: 'reviews_count', label: 'Number of Reviews' },
      { id: 'price_level', label: 'Price Level' },
      { id: 'years_in_business', label: 'Years in Business' }
    ]
  },
  {
    name: 'Location',
    columns: [
      { id: 'latitude', label: 'Latitude' },
      { id: 'longitude', label: 'Longitude' },
      { id: 'street_address', label: 'Street Address' },
      { id: 'city', label: 'City' },
      { id: 'state', label: 'State' },
      { id: 'postal_code', label: 'Postal Code' },
      { id: 'country', label: 'Country' }
    ]
  }
];

interface ColumnSelectorProps {
  onColumnSelect: (columns: string[]) => void;
}

export function ColumnSelector({ onColumnSelect }: ColumnSelectorProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev => {
      const newSelected = prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId];
      
      onColumnSelect(newSelected);
      return newSelected;
    });
  };

  const selectAll = () => {
    const allColumns = columnGroups.flatMap(group => 
      group.columns.map(column => column.id)
    );
    setSelectedColumns(allColumns);
    onColumnSelect(allColumns);
  };

  const clearAll = () => {
    setSelectedColumns([]);
    onColumnSelect([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedColumns.length} columns selected
        </span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-6 p-2">
          {columnGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              <div className="font-medium text-sm">{group.name}</div>
              <div className="ml-4 space-y-2">
                {group.columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center space-x-3 hover:bg-accent rounded-lg p-2 cursor-pointer"
                    onClick={() => toggleColumn(column.id)}
                  >
                    <Checkbox
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    />
                    <span className="text-sm">{column.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 