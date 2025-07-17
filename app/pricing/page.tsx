'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

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
      { text: "Email addresses", included: false },
      { text: "Websites", included: false },
      { text: "Phone numbers", included: false },
      { text: "Social Media", included: false }
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
    cta: "Get Access",
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
    cta: "Go Pro",
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
    cta: "Get Ultimate",
    popular: false
  }
];

// Define payment links directly
const PAYMENT_LINKS = {
  light: "https://buy.stripe.com/5kA176bA895ggog4gh",
  pro: "https://buy.stripe.com/8wMecMbA8coMb404gh",
  ultra: "https://buy.stripe.com/cN2cEEfa8coMd888gh"
};

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>("light");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  const handleTierClick = (tierId: string) => {
    setSelectedTier(currentTier => currentTier === tierId ? null : tierId);
  };

  const handlePurchase = async (e: React.MouseEvent, tierId: string) => {
    e.stopPropagation();
    
    // Don't do anything for free tier
    if (tierId === 'free') {
      router.push('/dashboard');
      return;
    }
    
    setIsLoading(prev => ({ ...prev, [tierId]: true }));
    
    try {
      // Get the payment link directly from our constant
      const paymentLink = PAYMENT_LINKS[tierId as keyof typeof PAYMENT_LINKS];
      
      if (!paymentLink) {
        console.error(`Payment link not configured for ${tierId} package.`);
        throw new Error(`Payment option temporarily unavailable`);
      }
      
      // Redirect to the Stripe payment link with the user's ID and email as parameters
      if (user) {
        try {
          // Create a URL object to add customer info as query parameters
          const url = new URL(paymentLink);
          url.searchParams.append('client_reference_id', user.id);
          if (user.email) {
            url.searchParams.append('prefilled_email', user.email);
          }
          
          console.log(`Redirecting to payment link for ${tierId} package:`, url.toString());
          
          // Redirect to the Stripe payment page
          window.location.href = url.toString();
        } catch (urlError) {
          console.error('Error creating payment URL:', urlError);
          throw new Error('Invalid payment link format');
        }
      } else {
        // Redirect to login first if no user
        router.push('/login?redirect=pricing');
      }
    } catch (error) {
      console.error('Error handling purchase:', error);
      alert(`We're sorry, but there was a problem processing your request. Please try again later or contact support if the issue persists.`);
    } finally {
      setIsLoading(prev => ({ ...prev, [tierId]: false }));
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
            Choose the plan that fits your business needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleTierClick(tier.id)}
              className={`relative rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 ${
                selectedTier === tier.id
                  ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary transform scale-105'
                  : 'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary/50'
              }`}
            >
              {/* Show Popular badge for popular tier */}
              {tier.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-white rounded-full">
                  Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{tier.price}</span>
                {tier.id !== 'free' && <span className="ml-1 text-slate-500 dark:text-slate-400 text-sm">one-time payment</span>}
              </div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">{tier.description}</p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-center">
                    {feature.included ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-400 mr-3" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handlePurchase(e, tier.id)}
                disabled={isLoading[tier.id]}
                className={`mt-6 w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                  selectedTier === tier.id
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 