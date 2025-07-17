'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { ScrollArea } from './scroll-area';
import { Button } from './button';
import { Search } from 'lucide-react';

interface Category {
  type: string;
  'number of appearances': number;
}

interface CategorySelectorProps {
  onCategorySelect: (categories: string[]) => void;
}

export function CategorySelector({ onCategorySelect }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/data/categories.json');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const toggleCategory = (type: string) => {
    setSelectedCategories(prev => {
      const newSelected = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];
      onCategorySelect(newSelected);
      return newSelected;
    });
  };

  const selectAll = () => {
    const newSelected = filteredCategories.map(c => c.type);
    setSelectedCategories(newSelected);
    onCategorySelect(newSelected);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    onCategorySelect([]);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {selectedCategories.length} selected
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

      <ScrollArea className="h-[400px] border rounded-md">
        <div className="p-4 space-y-2">
          {filteredCategories.map((category) => (
            <div
              key={category.type}
              className="flex items-center space-x-3 hover:bg-accent rounded-lg p-2 cursor-pointer"
              onClick={() => toggleCategory(category.type)}
            >
              <Checkbox
                checked={selectedCategories.includes(category.type)}
                onCheckedChange={() => toggleCategory(category.type)}
              />
              <div className="flex-1">
                <span className="text-sm">{category.type}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {category['number of appearances'].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 