"use client";

// import { useWebSocket } from '@/contexts/WebSocketContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
// import { OnboardingTour } from '@/components/OnboardingTour';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Settings,
  PlusCircle,
  Clock,
  TrendingUp,
  Activity,
  Database,
  Plus
} from 'lucide-react';
import { DatabaseList } from '@/components/DatabaseList';
import { CreateDatabaseForm } from '@/components/CreateDatabaseForm';
import { useContactCredits } from '@/hooks/useContactCredits';
import LoadingSkeleton from '@/components/ui/loading-skeleton';

const AUTH_TIMEOUT = 15000; // 15 seconds

// Dashboard metrics data
const dashboardMetrics = [
  {
    title: "Total Users",
    value: "1,234",
    change: "+12.3%",
    icon: <Users className="h-6 w-6 text-primary" />,
    trend: "up"
  },
  {
    title: "Revenue",
    value: "$12.4k",
    change: "+8.2%",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
    trend: "up"
  },
  {
    title: "Active Sessions",
    value: "432",
    change: "-3.1%",
    icon: <Activity className="h-6 w-6 text-primary" />,
    trend: "down"
  },
  {
    title: "Growth Rate",
    value: "18.2%",
    change: "+2.4%",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    trend: "up"
  }
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    action: "New user signup",
    timestamp: "2 minutes ago",
    icon: <Plus className="h-4 w-4" />
  },
  {
    id: 2,
    action: "Payment processed",
    timestamp: "15 minutes ago",
    icon: <CreditCard className="h-4 w-4" />
  },
  {
    id: 3,
    action: "Settings updated",
    timestamp: "1 hour ago",
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 4,
    action: "Session completed",
    timestamp: "2 hours ago",
    icon: <Clock className="h-4 w-4" />
  }
];

// Stats Card component
function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  actionButton
}: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  description: string,
  actionButton?: React.ReactNode
}) {
  return (
    <div className="bg-neutral-dark rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-white font-semibold ml-2">{title}</h3>
        </div>
        {actionButton}
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

// Recent activity item component
function ActivityItem({ action, timestamp, icon }: { action: string, timestamp: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center py-3 border-b border-slate-800">
      <div className="bg-slate-800 p-2 rounded-full mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">{action}</p>
        <p className="text-slate-400 text-xs">{timestamp}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // const { isConnected } = useWebSocket();
  // const [fullResponse, setFullResponse] = useState('');
  const { user, isSubscriber, isLoading: isAuthLoading } = useAuth();
  const { databases, getTotalContacts } = useDatabase();
  const router = useRouter();
  const { subscription, isLoading: isSubLoading, fetchSubscription } = useSubscription();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { isInTrial, isLoading: isTrialLoading } = useTrialStatus();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { creditsAvailable, creditsUsed } = useContactCredits();

  // Mock usage data - in a real app, this would come from an API
  const totalContactsQuota = 3000;
  const contactsUsed = getTotalContacts();
  const contactsRemaining = Math.max(0, totalContactsQuota - contactsUsed);
  const usagePercentage = Math.min(100, Math.round((contactsUsed / totalContactsQuota) * 100));

  // Check if we should redirect due to no access
  const isLoading = isTrialLoading || isSubLoading || isAuthLoading;
  
  useEffect(() => {
    // Only show a loader while checking auth
    if (isLoading) return;
    
    // If the user isn't logged in at all, redirect to login
    if (!user) {
      console.log('No user, redirecting to login');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      // Check if user has completed onboarding
      const checkOnboarding = async () => {
        const { data } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();
        
        setHasCompletedOnboarding(!!data?.has_completed_onboarding);
      };
      
      checkOnboarding();
    }
  }, [user?.id]);

  // Add auth timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Auth timeout reached, forcing render');
        setAuthTimeout(true);
      }
    }, AUTH_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // If we're still loading but the timeout was reached, force render the dashboard
  // This ensures users don't get stuck on the loading screen
  const shouldShowLoading = isLoading && !authTimeout;

  return (
    <div className="min-h-screen bg-neutral">
      {shouldShowLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Databases</h1>
            <div className="text-slate-300">
              {creditsAvailable !== null && (
                <span className="bg-neutral-dark px-4 py-2 rounded-full text-sm">
                  {creditsAvailable} Credits Available
                </span>
              )}
            </div>
          </div>

          {showCreateForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CreateDatabaseForm 
                onComplete={(success) => {
                  setShowCreateForm(false);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Total Databases"
                  value={databases.length.toString()}
                  icon={<Database className="h-5 w-5 text-primary" />}
                  description="All of your created databases"
                />
                
                <StatsCard
                  title="Total Contacts"
                  value={getTotalContacts().toString()}
                  icon={<Users className="h-5 w-5 text-primary" />}
                  description="Contacts in your completed databases"
                />
                
                <StatsCard
                  title="Contact Credits"
                  value={creditsAvailable?.toString() || "0"}
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  description={`${creditsUsed} credits used`}
                  actionButton={
                    <button 
                      className="px-3 py-1 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all text-white text-xs"
                      onClick={() => {
                        // Handle credits purchase here
                        console.log('Buy credits clicked');
                      }}
                    >
                      Buy Credits
                    </button>
                  }
                />
              </div>
              
              {/* Database list */}
              <DatabaseList onCreateNew={() => setShowCreateForm(true)} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}