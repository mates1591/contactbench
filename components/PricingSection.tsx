// File: /components/PricingSection.tsx

// import Link from 'next/link';
// import { StripeBuyButton } from './StripeBuyButton';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// interface PricingSectionProps {
//   showFullDetails?: boolean;
// }

const pricingTiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "",
    description: "Perfect for testing the waters",
    features: [
      { text: "Generate up to 20 contacts", included: true },
      { text: "CSV export format", included: true },
      { text: "Email addresses", included: true },
      { text: "Websites", included: true },
      { text: "Phone numbers", included: true },
      { text: "Social Media", included: true }
    ],
    cta: "Get Started",
    popular: false
  },
  {
    id: "light",
    name: "Light",
    price: "$19",
    interval: "",
    description: "For growing businesses",
    features: [
      { text: "Generate up to 2,000 contacts", included: true },
      { text: "CSV/EXCEL/JSON exports", included: true },
      { text: "Email addresses", included: true },
      { text: "Websites", included: true },
      { text: "Phone numbers", included: true },
      { text: "Social Media", included: true }
    ],
    cta: "Get Started",
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    interval: "",
    description: "For serious prospectors",
    features: [
      { text: "Generate up to 6,000 contacts", included: true },
      { text: "CSV/EXCEL/JSON exports", included: true },
      { text: "Email addresses", included: true },
      { text: "Websites", included: true },
      { text: "Phone numbers", included: true },
      { text: "Social Media", included: true }
    ],
    cta: "Get Started",
    popular: false
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$99",
    interval: "",
    description: "For power users and teams",
    features: [
      { text: "Generate up to 20,000 contacts", included: true },
      { text: "CSV/EXCEL/JSON exports", included: true },
      { text: "Email addresses", included: true },
      { text: "Websites", included: true },
      { text: "Phone numbers", included: true },
      { text: "Social Media", included: true }
    ],
    cta: "Get Started",
    popular: false
  }
];

// Define payment links directly
const PAYMENT_LINKS = {
  light: "https://buy.stripe.com/5kA176bA895ggog4gh",
  pro: "https://buy.stripe.com/8wMecMbA8coMb404gh",
  ultra: "https://buy.stripe.com/cN2cEEfa8coMd888gh"
};

export function PricingSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>("light");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleTierClick = (tierId: string) => {
    setSelectedTier(currentTier => currentTier === tierId ? null : tierId);
  };

  const handleCTAClick = async (e: React.MouseEvent, tierId: string) => {
    e.stopPropagation(); // Prevent row click event
    
    // If free tier, redirect to dashboard
    if (tierId === 'free') {
      router.push('/dashboard');
      return;
    }
    
    // If user not logged in, redirect to login page with redirect parameter
    if (!user) {
      router.push(`/login?redirect=profile`);
      return;
    }
    
    // For paid plans, redirect to profile page with the selected package
    router.push(`/profile?plan=${tierId}`);
  };

  // Updated selected card style with rounded corners for the gradient
  const selectedCardStyle = {
    position: 'relative' as const,
    backgroundClip: 'padding-box' as const,
    border: 'none' as const,
    boxShadow: '0 0 20px rgba(255, 138, 0, 0.3)' as const
  };

  const outlineNoneStyle = { outline: 'none' as const };

  // Gradient border overlay style
  const gradientBorderStyle = {
    content: "" as const,
    position: "absolute" as const,
    top: 0 as const,
    left: 0 as const,
    right: 0 as const,
    bottom: 0 as const,
    borderRadius: "1rem" as const, /* matches rounded-2xl */
    padding: "2px" as const,
    background: "linear-gradient(45deg, #FF8A00, #e53e3e)" as const,
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)" as const,
    WebkitMaskComposite: "xor" as const,
    maskComposite: "exclude" as const,
    pointerEvents: "none" as const,
    zIndex: 0 as const
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      {pricingTiers.map((tier, i) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => handleTierClick(tier.id)}
          className={`pricing-card relative rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 ${
            selectedTier === tier.id
              ? 'bg-neutral transform scale-105'
              : 'bg-neutral-dark hover:bg-neutral-darker'
          }`}
          style={selectedTier === tier.id ? selectedCardStyle : outlineNoneStyle}
        >
          {selectedTier === tier.id && (
            <div style={gradientBorderStyle}></div>
          )}

          {/* Show Popular badge for Light tier */}
          {tier.popular && (
            <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-white rounded-full z-10">
              Popular
            </span>
          )}
          
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-white">{tier.price}</span>
              {tier.id !== 'free' && <span className="ml-1 text-gray-400 text-sm">one-time payment</span>}
            </div>
            <p className="mt-4 text-gray-400">{tier.description}</p>
            <ul className="mt-6 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature.text} className="flex items-center">
                  {feature.included ? (
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-600 mr-3" />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-white' : 'text-gray-500'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => handleCTAClick(e, tier.id)}
              disabled={isLoading[tier.id]}
              className={`mt-6 w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                selectedTier === tier.id
                  ? 'gradient-button text-white hover:opacity-90'
                  : 'bg-neutral border border-gray-700 text-white hover:bg-neutral-darker'
              } ${isLoading[tier.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading[tier.id] ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : tier.cta}
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}