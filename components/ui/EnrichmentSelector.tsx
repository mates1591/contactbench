'use client';

import { useState } from 'react';
import { Checkbox } from './checkbox';

interface EnrichmentOption {
  id: string;
  label: string;
  description: string;
}

const enrichmentOptions: EnrichmentOption[] = [
  {
    id: 'domains_service',
    label: 'Company Insights',
    description: 'Finds company details such as revenue, size, founding year'
  },
  {
    id: 'emails_validator_service',
    label: 'Emails & Contacts',
    description: 'Finds emails, social links, phones, and other contacts'
  },
  {
    id: 'disposable_email_checker',
    label: 'Email Validation',
    description: 'Validates email addresses and checks for disposable emails'
  },
  {
    id: 'company_insights_service',
    label: 'Business Details',
    description: 'Retrieves detailed business information and metrics'
  },
  {
    id: 'whatsapp_checker',
    label: 'WhatsApp Verification',
    description: 'Checks if phone numbers are registered on WhatsApp'
  },
  {
    id: 'phones_enricher_service',
    label: 'Phone Enrichment',
    description: 'Validates and enriches phone number data'
  },
  {
    id: 'trustpilot_service',
    label: 'Trustpilot Reviews',
    description: 'Fetches Trustpilot ratings and reviews'
  }
];

interface EnrichmentSelectorProps {
  onEnrichmentSelect: (enrichments: string[]) => void;
}

export function EnrichmentSelector({ onEnrichmentSelect }: EnrichmentSelectorProps) {
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>([]);

  const toggleEnrichment = (enrichmentId: string) => {
    setSelectedEnrichments(prev => {
      const newSelected = prev.includes(enrichmentId)
        ? prev.filter(id => id !== enrichmentId)
        : [...prev, enrichmentId];
      
      onEnrichmentSelect(newSelected);
      return newSelected;
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Select data enrichment options
      </div>
      
      <div className="space-y-4">
        {enrichmentOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
            onClick={() => toggleEnrichment(option.id)}
          >
            <Checkbox
              checked={selectedEnrichments.includes(option.id)}
              onCheckedChange={() => toggleEnrichment(option.id)}
            />
            <div className="space-y-1">
              <div className="text-sm font-medium leading-none">
                {option.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 