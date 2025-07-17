"use client";

import { useAuth } from '@/contexts/AuthContext';
import { PricingSection } from '@/components/PricingSection';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { FeatureSection } from '@/components/FeatureSection';
import { TestimonialSection } from '@/components/TestimonialSection';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

import { 
  Database, Building, Search, Download
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Step data for the process workflow
const workflowSteps = [
  {
    title: "Define Criteria",
    description: "Specify business type, industry, and location",
    preview: <TypewriterEffect text="Setting target criteria..." />
  },
  {
    title: "Set Parameters",
    description: "Choose number of contacts and data points needed",
    preview: <TypewriterEffect text="Configuring data parameters..." />
  },
  {
    title: "Generate Database",
    description: "Our AI builds your targeted contact list",
    preview: <TypewriterEffect text="Generating quality contacts..." />
  },
  {
    title: "Export & Use",
    description: "Download your database in preferred format",
    preview: <TypewriterEffect text="Preparing export file..." />
  }
];

// New sections specifically for the B2B Database Builder
const homePageSections = [
  {
    id: "overview",
    title: "Overview",
    description: "Powerful B2B database generation for targeted lead generation",
    bgColor: "bg-neutral"
  },
  {
    id: "features",
    title: "Features",
    description: "Everything you need for successful B2B lead generation",
    bgColor: "bg-neutral"
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "What our customers are saying about our service",
    bgColor: "bg-neutral"
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Simple, transparent pricing for your needs",
    bgColor: "bg-neutral"
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Answers to commonly asked questions",
    bgColor: "bg-neutral"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const { isInTrial } = useTrialStatus();
  const [activeSection, setActiveSection] = useState("overview");
  
  const router = useRouter();

  const [dashboardRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-neutral relative">
      {/* Hero Section - Overview */}
      <div id="overview" className="relative overflow-hidden bg-neutral">
        <div className="absolute inset-0 bg-neutral" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-20 pb-16 sm:pb-24">
            {/* Header Content */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                <span className="block mb-2">Get Targeted B2B Contacts</span>
                <span className="block mb-2">and Streamline <span className="gradient-text">Outreach</span></span>
                <span className="block">All in One Platform</span>
              </h1>
              <p className="mt-8 max-w-2xl mx-auto text-lg secondary-text">
                Create customized B2B contact databases by specifying business type, location, and desired number of contacts. Get accurate, verified leads that match your exact requirements.
              </p>
              
              {/* CTA Buttons */}
              <div className="mt-10 flex gap-4 justify-center">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gradient-button px-8 py-3 shadow-lg hover:shadow-xl transition-all inline-block"
                >
                  Watch Demo
                </motion.a>
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="px-8 py-3 bg-neutral-dark hover:bg-neutral-darker text-white border border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {user ? "Dashboard" : "Start Free Trial"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features">
        <FeatureSection />
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="bg-neutral">
        <TestimonialSection />
      </div>

      {/* Pricing Section */}
      <motion.section
        id="pricing"
        className="py-20 bg-neutral"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        onViewportEnter={() => setActiveSection("pricing")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="mt-4 text-lg secondary-text">
              Choose the plan that fits your business needs
            </p>
          </div>
          
          <PricingSection />
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        id="faq"
        className="py-20 bg-neutral"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        onViewportEnter={() => setActiveSection("faq")}
      >
        <FAQ />
      </motion.section>

      {/* Enhanced CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="relative py-20 bg-neutral"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-neutral-dark rounded-xl shadow-xl p-12 border border-gray-800">
            <div className="text-center">
              <motion.h2 
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                className="text-3xl font-bold text-white"
              >
                Ready to Build Your <span className="gradient-text">Contact</span> Database?
              </motion.h2>
              <p className="mt-4 text-lg secondary-text">
                Start generating targeted B2B contact lists today
              </p>
              
              <div className="mt-10 flex gap-4 justify-center">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gradient-button px-8 py-3 shadow-lg hover:shadow-xl transition-all inline-block"
                >
                  Watch Demo
                </motion.a>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-neutral hover:bg-neutral-darker text-white border border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {user ? "Dashboard" : "Start Free Trial"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

