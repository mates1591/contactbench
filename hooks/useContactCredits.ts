import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export interface ContactCredits {
  id: string;
  user_id: string;
  credits_available: number;
  credits_used: number;
  last_purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactCredits() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<ContactCredits | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: creditsError } = await supabase
        .from('user_contact_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
        setError('Failed to fetch credit information');
        return;
      }
      
      setCredits(data);
    } catch (err) {
      console.error('Error in useContactCredits hook:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get available credits
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Function to check if user has enough credits for a specific count
  const hasEnoughCredits = useCallback(
    (requiredCredits: number): boolean => {
      if (!credits) return false;
      return credits.credits_available >= requiredCredits;
    },
    [credits]
  );

  // Return values from the hook
  return {
    credits,
    isLoading,
    error,
    fetchCredits,
    hasEnoughCredits,
    creditsAvailable: credits?.credits_available || 0,
    creditsUsed: credits?.credits_used || 0
  };
} 