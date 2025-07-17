'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { AccountManagement } from '@/components/AccountManagement';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useContactCredits } from '@/hooks/useContactCredits';
import { motion } from 'framer-motion';
import { CreditCard, Database, Download, User, Clock, Check, Package } from 'lucide-react';
import { StripeBuyButton } from '@/components/StripeBuyButton';

// Define credit packages - use environment variables directly
const creditPackages = [
  {
    id: "light",
    name: "Light",
    price: "$19",
    credits: 2000,
    popular: false,
    buttonEnvVar: "NEXT_PUBLIC_STRIPE_LIGHT_BUTTON_ID",
    buttonId: process.env.NEXT_PUBLIC_STRIPE_LIGHT_BUTTON_ID || "" 
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    credits: 6000,
    popular: true,
    buttonEnvVar: "NEXT_PUBLIC_STRIPE_PRO_BUTTON_ID",
    buttonId: process.env.NEXT_PUBLIC_STRIPE_PRO_BUTTON_ID || ""
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$99",
    credits: 20000,
    popular: false,
    buttonEnvVar: "NEXT_PUBLIC_STRIPE_ULTRA_BUTTON_ID",
    buttonId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_BUTTON_ID || ""
  }
];

// Get Stripe publishable key directly from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Add debug log for environment variables
console.log("Stripe Environment Variables:");
console.log("- Publishable Key:", stripePublishableKey ? "✅ Set" : "❌ Missing");
console.log("- Light Button ID:", process.env.NEXT_PUBLIC_STRIPE_LIGHT_BUTTON_ID ? "✅ Set" : "❌ Missing");
console.log("- Pro Button ID:", process.env.NEXT_PUBLIC_STRIPE_PRO_BUTTON_ID ? "✅ Set" : "❌ Missing");
console.log("- Ultra Button ID:", process.env.NEXT_PUBLIC_STRIPE_ULTRA_BUTTON_ID ? "✅ Set" : "❌ Missing");

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const selectedPlan = searchParams.get('plan');
  const { 
    creditsAvailable, 
    creditsUsed, 
    isLoading: isLoadingCredits, 
    error: creditsError,
    fetchCredits 
  } = useContactCredits();

  // Log when component mounts to verify button IDs
  useEffect(() => {
    console.log("ProfileContent mounted");
    console.log("Credit packages:", creditPackages);
  }, []);

  // Show payment success message if redirected from successful payment
  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log('Payment successful!');
      // Refresh credits after successful payment
      fetchCredits();
    }
  }, [paymentStatus, fetchCredits]);

  // Scroll to pricing section if redirected with a plan parameter
  useEffect(() => {
    if (selectedPlan) {
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [selectedPlan]);

  // Add useEffect for auth check
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {paymentStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
          >
            <p className="text-green-600 dark:text-green-400 font-medium">
              🎉 Thank you for your purchase! Your payment was successful and your contact credits have been added.
            </p>
          </motion.div>
        )}
        
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="block">Your</span>
            <span className="block">Account <span className="gradient-text">Management</span></span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
            Manage your account details and view your current credit balance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Credits Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-neutral-dark rounded-xl shadow-lg p-8 border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-white">Contact Credits</h2>
            </div>

            {isLoadingCredits ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : creditsError ? (
              <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {creditsError}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-neutral rounded-lg p-6 border border-gray-800">
                    <p className="text-sm text-gray-400 mb-1">Available Credits</p>
                    <p className="text-3xl font-bold text-white">{creditsAvailable}</p>
                    <div className="mt-4 h-2 bg-neutral-darker rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full"
                        style={{ width: `${creditsAvailable > 0 ? Math.max((creditsAvailable / (creditsAvailable + creditsUsed)) * 100, 5) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-neutral rounded-lg p-6 border border-gray-800">
                    <p className="text-sm text-gray-400 mb-1">Used Credits</p>
                    <p className="text-3xl font-bold text-white">{creditsUsed}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-400">
                      <Database className="h-4 w-4 mr-1" />
                      <span>Approximately {Math.round(creditsUsed / 100)} databases</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Account Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-dark rounded-xl shadow-lg p-8 border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold text-white">Account</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Email Address</p>
                <p className="font-medium text-white">{user?.email}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Last Sign In</p>
                <p className="font-medium text-white flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(user?.last_sign_in_at || '').toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Account Type</p>
                <p className="font-medium text-white">
                  {user?.app_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                </p>
              </div>

              {user?.app_metadata?.provider !== 'google' && (
                <Link
                  href={`/reset-password?email=${encodeURIComponent(user?.email || '')}`}
                  className="mt-4 block w-full text-center px-4 py-2 bg-neutral border border-gray-700 text-white rounded-full hover:bg-neutral-darker transition-colors"
                >
                  Reset Password
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {/* Credit Packages Section */}
        <motion.div 
          id="pricing-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-neutral-dark rounded-xl shadow-lg p-8 border border-gray-800"
        >
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold text-white">Purchase <span className="gradient-text">Credits</span></h2>
          </div>
          
          <div className="mb-6 text-center">
            <p className="text-gray-400">
              Select a package to purchase additional contact credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (index * 0.1) }}
                className={`pricing-card relative rounded-xl p-6 shadow-lg ${
                  pkg.popular || pkg.id === selectedPlan
                    ? 'transform scale-105' 
                    : 'bg-neutral-dark hover:bg-neutral-darker border border-gray-800'
                }`}
                style={pkg.popular || pkg.id === selectedPlan ? {
                  position: 'relative',
                  background: '#1E1E1E',
                  backgroundClip: 'padding-box',
                  border: 'none',
                  boxShadow: '0 0 20px rgba(255, 138, 0, 0.3)'
                } : {}}
              >
                {(pkg.popular || pkg.id === selectedPlan) && (
                  <div className="absolute top-0 right-4 transform -translate-y-1/2 px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full z-20">
                    {pkg.popular ? 'Popular' : 'Selected'}
                  </div>
                )}
                
                {(pkg.popular || pkg.id === selectedPlan) && (
                  <div style={{
                    content: "",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "0.75rem",
                    padding: "2px",
                    background: "linear-gradient(45deg, #FF8A00, #e53e3e)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    pointerEvents: "none",
                    zIndex: 0
                  }}></div>
                )}
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white">{pkg.name} Package</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">{pkg.price}</span>
                    <span className="ml-1 text-gray-400 text-sm">one-time payment</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{pkg.credits.toLocaleString()} credits</p>
                  
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm text-white">One-time payment</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm text-white">No subscription</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm text-white">Instant activation</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm text-white">CSV/EXCEL/JSON exports</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    {/* Show button status message for debugging */}
                    {!pkg.buttonId && (
                      <div className="text-red-500 text-sm mb-2">
                        Missing button ID for {pkg.name} package.
                      </div>
                    )}
                    {!stripePublishableKey && (
                      <div className="text-red-500 text-sm mb-2">
                        Missing Stripe publishable key.
                      </div>
                    )}
                    
                    {/* Log button details */}
                    <div className="hidden">
                      {(() => {
                        console.log(`Rendering ${pkg.name} button:`, {
                          buttonId: pkg.buttonId,
                          publishableKey: stripePublishableKey
                        });
                        return null;
                      })()}
                    </div>

                    {/* Only render button if we have both IDs */}
                    {pkg.buttonId && stripePublishableKey ? (
                      <StripeBuyButton
                        buyButtonId={pkg.buttonId}
                        publishableKey={stripePublishableKey}
                        className={`w-full ${pkg.popular || pkg.id === selectedPlan ? 'stripe-gradient-button' : 'stripe-neutral-button'}`}
                      />
                    ) : (
                      <div className="w-full p-3 bg-neutral-darker text-center rounded-lg text-gray-400">
                        Button configuration missing
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-red-500">
          Failed to load profile details. Please try refreshing.
        </div>
      }
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileContent />
      </Suspense>
    </ErrorBoundary>
  );
}
