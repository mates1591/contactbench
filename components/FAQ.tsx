import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqItems = [
  {
    question: "How accurate is the contact data?",
    answer: "Our contact data is regularly verified and updated to ensure high accuracy. We employ multiple verification methods including email validation, phone verification, and regular data refreshes. Our database maintains a 95%+ accuracy rate across all records."
  },
  {
    question: "What information is included in each contact record?",
    answer: "Each contact record includes name, job title, company, email address, phone number, location, industry, company size, and verified social media profiles. Pro tier subscribers also receive additional data points such as company revenue, tech stack used, and recent company news."
  },
  {
    question: "Can I target companies by specific criteria?",
    answer: "Yes, our targeting system allows you to filter by industry, location, company size, revenue range, employee count, technology usage, and growth stage. You can combine multiple criteria to create highly specific target audiences for your campaigns."
  },
  {
    question: "How often is the database updated?",
    answer: "Our database is continuously updated, with comprehensive refresh cycles every 30 days. This ensures you always have access to current and accurate contact information. We also immediately process any reported inaccuracies."
  },
  {
    question: "What export formats are supported?",
    answer: "We support exports in CSV, Excel, Google Sheets, and JSON formats. Pro users can also access our API for direct integration with CRM systems like Salesforce, HubSpot, and Zoho CRM. All exports are formatted for easy import into popular marketing and sales tools."
  },
  {
    question: "Is there a limit to how many databases I can build?",
    answer: "There's no limit to the number of databases you can build. The subscription tiers only limit the total number of contacts you can generate per month. You can create as many separate target lists as needed, as long as the total contacts stay within your plan's limits."
  },
  {
    question: "Can I upgrade or downgrade my subscription?",
    answer: "Yes, you can upgrade or downgrade your subscription at any time. Upgrades take effect immediately, giving you instant access to additional contacts and features. Downgrades take effect at the end of your current billing cycle."
  },
  {
    question: "Do you offer a refund if I'm not satisfied?",
    answer: "We offer a 14-day money-back guarantee for all new paid subscriptions. If you're not satisfied with our service, simply contact our support team within 14 days of your purchase for a full refund."
  }
];

export function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Frequently Asked <span className="gradient-text">Questions</span>
      </h2>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div 
            key={index}
            className={`border rounded-lg overflow-hidden ${
              expandedIndex === index
                ? 'border-gray-700 bg-neutral'
                : 'border-gray-800 bg-neutral-dark'
            }`}
          >
            <button
              onClick={() => toggleItem(index)}
              className="flex justify-between items-center w-full p-4 text-left"
            >
              <span className="font-medium text-white">{item.question}</span>
              <ChevronDown 
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  expandedIndex === index ? 'transform rotate-180' : ''
                }`} 
              />
            </button>
            
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 secondary-text">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
} 