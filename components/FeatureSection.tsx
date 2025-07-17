import { BarChart3, Filter, Database, Download, RefreshCw, BadgeCheck, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    title: "Advanced Targeting",
    description: "Filter contacts by industry, location, company size, revenue, and more to create highly targeted lead lists.",
    icon: <Filter className="h-6 w-6 text-primary" />
  },
  {
    title: "Verified Data",
    description: "Our contact information is regularly verified and updated, ensuring 95%+ accuracy rate across all records.",
    icon: <BadgeCheck className="h-6 w-6 text-primary" />
  },
  {
    title: "Real-time Updates",
    description: "Database continuously updated with fresh contact information, keeping your leads current and reliable.",
    icon: <RefreshCw className="h-6 w-6 text-primary" />
  },
  {
    title: "Multiple Export Formats",
    description: "Export your contact lists in CSV, Excel, JSON formats or integrate directly with popular CRM systems.",
    icon: <Download className="h-6 w-6 text-primary" />
  },
  {
    title: "Detailed Insights",
    description: "Get comprehensive information including job titles, email patterns, company details, and more.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />
  },
  {
    title: "Enterprise Security",
    description: "Your data is protected with enterprise-grade security and compliance with GDPR, CCPA regulations.",
    icon: <Lock className="h-6 w-6 text-primary" />
  },
  {
    title: "Fast Generation",
    description: "Build targeted contact lists in minutes, not hours or days, with our high-performance database engine.",
    icon: <Zap className="h-6 w-6 text-primary" />
  },
  {
    title: "Enriched Records",
    description: "Contact records enriched with company information, social profiles, and business intelligence data.",
    icon: <Database className="h-6 w-6 text-primary" />
  }
];

export function FeatureSection() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">
            {/* Empty heading to match screenshot */}
          </h2>
          <p className="mt-4 text-lg secondary-text max-w-3xl mx-auto">
            {/* Empty description to match screenshot */}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="feature-card bg-neutral-dark border border-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-neutral rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="secondary-text text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 