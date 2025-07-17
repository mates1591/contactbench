'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import debounce from 'lodash/debounce';

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user, supabase } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionCache = new Map<string, {data: Subscription | null, timestamp: number}>();
  const CACHE_DURATION = 30000; // 30 seconds

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = subscriptionCache.get(user.id);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      setSubscription(cached.data);
      setLoading(false);
      return;
    }

    try {
      // Try to get subscription data (this may fail if table no longer exists)
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (error) {
          // Gracefully handle missing table after migration
          console.log('Subscription system has been migrated to credits');
          setSubscription(null);
          setLoading(false);
          return;
        }

        const isValid = data && 
          ['active', 'trialing'].includes(data.status) && 
          new Date(data.current_period_end) > new Date();

        const result = isValid ? data : null;
        
        // Update cache
        subscriptionCache.set(user.id, {
          data: result,
          timestamp: now
        });
        
        setSubscription(result);
      } catch (tableError) {
        // If the table query fails, check for credits as fallback
        console.log('Subscription system has been migrated to credits');
        setSubscription(null);
      }
    } catch (err) {
      console.log('Using credits-based system instead of subscriptions');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const checkValidSubscription = useCallback((data: Subscription[]): boolean => {
    return data.some(sub => 
      ['active', 'trialing'].includes(sub.status) &&
      new Date(sub.current_period_end) > new Date()
    );
  }, []);

  const MAX_SYNC_RETRIES = 3;
  const [syncRetries, setSyncRetries] = useState(0);

  const debouncedSyncWithStripe = useCallback(
    debounce(async (subscriptionId: string) => {
      if (syncRetries >= MAX_SYNC_RETRIES) {
        console.log('Max sync retries reached');
        return;
      }

      try {
        // Check if we should still use subscriptions or have migrated to credits
        const { count } = await supabase
          .from('user_contact_credits')
          .select('*', { count: 'exact', head: true });
        
        // If we have credits table with records, we've migrated to the new system
        if (count && count > 0) {
          console.log('System migrated to credits, skipping subscription sync');
          return;
        }

        // Otherwise, proceed with subscription sync
        const response = await fetch('/api/stripe/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        });
        
        if (!response.ok) {
          // Check if API returns that we've migrated systems
          if (response.status === 404) {
            console.log('Subscription API no longer available (migrated to credits)');
            return;
          }
          
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to sync with Stripe');
        }
        
        await fetchSubscription();
        setSyncRetries(0); // Reset retries on success
      } catch (error) {
        if (error instanceof Error && error.message.includes('relation "subscriptions" does not exist')) {
          console.log('Subscription table no longer exists (migrated to credits)');
          return;
        }
        console.log('Stripe sync skipped (system likely migrated to credits)');
        setSyncRetries(prev => prev + 1);
      }
    }, 30000), // 30 second delay between calls
    [fetchSubscription, syncRetries, supabase]
  );

  const syncWithStripe = useCallback((subscriptionId: string) => {
    debouncedSyncWithStripe(subscriptionId);
  }, [debouncedSyncWithStripe]);

  useEffect(() => {
    if (!user) return;

    // Try to set up subscription listener, but handle missing table gracefully
    try {
      const channel = supabase
        .channel('subscription_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            try {
              const isValid = checkValidSubscription([payload.new as Subscription]);
              setSubscription(isValid ? payload.new as Subscription : null);
              if (!isValid) {
                console.log('Subscription expired or invalidated');
              }
            } catch (e) {
              console.log('Error handling subscription update (system may be migrated)');
            }
          }
        )
        .subscribe((status) => {
          // If channel connection fails, likely table no longer exists
          if (status === 'CHANNEL_ERROR') {
            console.log('Subscription system has been migrated to credits');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.log('Could not set up subscription listener (system migrated to credits)');
      return () => {};
    }
  }, [user, supabase, checkValidSubscription]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (subscription?.stripe_subscription_id) {
      // Add a delay before first sync
      timeoutId = setTimeout(() => {
        syncWithStripe(subscription.stripe_subscription_id);
      }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [syncWithStripe, subscription?.stripe_subscription_id]);

  return {
    subscription,
    isLoading: loading,
    error,
    syncWithStripe: useCallback((subscriptionId: string) => {
      debouncedSyncWithStripe(subscriptionId);
    }, [debouncedSyncWithStripe]),
    fetchSubscription // Expose fetch function for manual refresh
  };
} 