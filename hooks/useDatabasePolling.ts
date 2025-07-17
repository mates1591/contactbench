'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDatabase, Database } from '@/contexts/DatabaseContext';
import { useToast } from '@/hooks/useToast';

export function useDatabasePolling(
  pollingInterval: number = 15000, // 15 seconds by default
  maxRetries: number = 10 // Maximum number of attempts before giving up
) {
  const { databases, checkDatabaseStatus } = useDatabase();
  const { warning, error: showError } = useToast();
  const [pollingErrors, setPollingErrors] = useState<Record<string, number>>({});
  const [lastPollTime, setLastPollTime] = useState<Record<string, number>>({});
  const [maxRetryWarningsShown, setMaxRetryWarningsShown] = useState<Record<string, boolean>>({});

  const shouldPollDatabase = useCallback((database: Database): boolean => {
    // Only poll databases that are pending or processing
    if (database.status !== 'pending' && database.status !== 'processing') {
      return false;
    }

    // Check if we've exceeded max retries
    if ((pollingErrors[database.id] || 0) >= maxRetries) {
      console.log(`Exceeded maximum retries (${maxRetries}) for database ${database.id}`);
      return false;
    }

    // Throttle polling
    const now = Date.now();
    const lastPoll = lastPollTime[database.id] || 0;
    return now - lastPoll >= pollingInterval;
  }, [pollingErrors, lastPollTime, pollingInterval, maxRetries]);

  const pollDatabases = useCallback(async () => {
    const databasesToPoll = databases.filter(shouldPollDatabase);
    
    if (databasesToPoll.length === 0) return;
    
    console.log(`Polling ${databasesToPoll.length} databases for status updates`);
    
    // Process one database at a time to avoid overwhelming the API
    for (const database of databasesToPoll) {
      try {
        console.log(`Polling database ${database.id} (${database.name}) - status: ${database.status}`);
        
        // Update last poll time
        setLastPollTime(prev => ({
          ...prev,
          [database.id]: Date.now()
        }));
        
        // Add a small delay to avoid overwhelming the API with requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await checkDatabaseStatus(database.id);
        
        // If the status is completed or failed, add some extra delay before polling the next
        if (result && (result.status === 'completed' || result.status === 'failed')) {
          console.log(`Database ${database.id} polling complete with status: ${result.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // If the result is null, there was an error - increment error count
        if (!result) {
          const newErrorCount = (pollingErrors[database.id] || 0) + 1;
          setPollingErrors(prev => ({
            ...prev,
            [database.id]: newErrorCount
          }));
          console.log(`Polling error for database ${database.id}, error count: ${newErrorCount}`);
          
          // Show a warning when we're about to reach max retries
          if (newErrorCount === maxRetries - 1) {
            warning(`Having trouble checking status for "${database.name}". Will retry one more time.`);
          }
          
          // Show an error when we've reached max retries
          if (newErrorCount >= maxRetries && !maxRetryWarningsShown[database.id]) {
            showError(`Stopped checking status for "${database.name}" after multiple failed attempts. Try manually refreshing.`);
            setMaxRetryWarningsShown(prev => ({
              ...prev,
              [database.id]: true
            }));
          }
        } else {
          // Reset error count on success
          if (pollingErrors[database.id]) {
            setPollingErrors(prev => ({
              ...prev,
              [database.id]: 0
            }));
            
            // Reset max retry warning flag when successful
            if (maxRetryWarningsShown[database.id]) {
              setMaxRetryWarningsShown(prev => ({
                ...prev,
                [database.id]: false
              }));
            }
            
            console.log(`Reset error count for database ${database.id}`);
          }
        }
      } catch (error) {
        console.error(`Error polling database ${database.id}:`, error);
        
        // Increment error count
        const newErrorCount = (pollingErrors[database.id] || 0) + 1;
        setPollingErrors(prev => ({
          ...prev,
          [database.id]: newErrorCount
        }));
        
        console.log(`Polling error for database ${database.id}, error count: ${newErrorCount}`);
        
        // Show a warning when we're about to reach max retries
        if (newErrorCount === maxRetries - 1) {
          warning(`Having trouble checking status for "${database.name}". Will retry one more time.`);
        }
        
        // Show an error when we've reached max retries
        if (newErrorCount >= maxRetries && !maxRetryWarningsShown[database.id]) {
          showError(`Stopped checking status for "${database.name}" after multiple failed attempts. Try manually refreshing.`);
          setMaxRetryWarningsShown(prev => ({
            ...prev,
            [database.id]: true
          }));
        }
      }
    }
  }, [databases, shouldPollDatabase, checkDatabaseStatus, pollingErrors, maxRetries, maxRetryWarningsShown, warning, showError]);

  // Set up polling
  useEffect(() => {
    pollDatabases(); // Initial poll
    
    const intervalId = setInterval(pollDatabases, pollingInterval / 3);
    
    return () => clearInterval(intervalId);
  }, [pollDatabases, pollingInterval]);

  // Reset a database's error count to allow polling again
  const resetPollingErrors = useCallback((databaseId: string) => {
    setPollingErrors(prev => ({
      ...prev,
      [databaseId]: 0
    }));
    
    setLastPollTime(prev => ({
      ...prev,
      [databaseId]: 0 // Reset last poll time to trigger immediate polling
    }));
    
    // Reset max retry warning flag
    setMaxRetryWarningsShown(prev => ({
      ...prev,
      [databaseId]: false
    }));
  }, []);

  return {
    pollingErrors,
    resetPollingErrors
  };
} 