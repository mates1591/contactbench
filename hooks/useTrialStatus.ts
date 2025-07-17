import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { useContactCredits } from './useContactCredits';

export function useTrialStatus() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<{
    isInTrial: boolean;
    trialEndTime: string | null;
  }>({ isInTrial: false, trialEndTime: null });
  const { creditsAvailable, isLoading: isCreditsLoading } = useContactCredits();

  useEffect(() => {
    async function checkAccessStatus() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Always give access to dashboard regardless of credits - 
        // just update the trial status to reflect if they have credits
        setTrialStatus({
          isInTrial: true, // Always allow access now
          trialEndTime: null
        });
        
        // For backward compatibility, set a future date as trial end time
        // This helps with UI displays that might expect this value
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        setTrialStatus({
          isInTrial: true, // Always allow access to dashboard
          trialEndTime: futureDate.toISOString()
        });
      } catch (error) {
        console.error('Error checking access status:', error);
        // Set default state on error - still allow access
        setTrialStatus({
          isInTrial: true, // Default to allowing access on error
          trialEndTime: null
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (!isCreditsLoading) {
      checkAccessStatus();
    }
  }, [user?.id, creditsAvailable, isCreditsLoading]);

  return { ...trialStatus, isLoading: isLoading || isCreditsLoading };
}