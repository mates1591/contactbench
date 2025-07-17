'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import axios from 'axios';

export interface Database {
  id: string;
  user_id: string;
  name: string;
  search_query: string;
  query_type?: 'simple' | 'structured' | 'free_text';
  locations?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    cities?: string[];
  };
  limit_count: number;
  credits_per_query: number;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request_id: string | null;
  tags: string[];
  enrichments?: string[];
  selected_columns?: string[];
  search_type?: string;
  categories?: string[];
  statistics: {
    total: number;
    completed: number;
    unique_contacts?: number;
    queries_processed?: number;
    total_results?: number;
  };
  queries?: string[];
  total_queries?: number;
  current_query_index?: number;
  file_paths?: Record<string, string>;
  formats?: string[];
  selected_format?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseContextType {
  databases: Database[];
  isLoading: boolean;
  error: string | null;
  createDatabase: (params: CreateDatabaseParams) => Promise<Database | null>;
  refreshDatabases: () => Promise<void>;
  deleteDatabase: (databaseId: string) => Promise<boolean>;
  exportDatabase: (databaseId: string, format?: string, skipToast?: boolean) => Promise<any>;
  checkDatabaseStatus: (databaseId: string) => Promise<Database | null>;
  getTotalContacts: () => number;
}

interface CreateDatabaseParams {
  name: string;
  query: string;
  query_type?: 'simple' | 'structured' | 'free_text';
  locations?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    cities?: string[];
  };
  credits?: number;
  limit_count?: number;
  enrichments?: string[];
  selected_columns?: string[];
  search_type?: string;
  categories?: string[];
  language?: string;
}

const DatabaseContext = createContext<DatabaseContextType>({} as DatabaseContextType);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDatabases = useCallback(async () => {
    if (!user?.id) {
      setDatabases([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/database/list', {
        userId: user.id
      });

      if (response.data.status === 'success') {
        setDatabases(response.data.databases);
      } else {
        setError('Failed to fetch databases');
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to fetch databases');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load databases on mount or when user changes
  useEffect(() => {
    refreshDatabases();
  }, [refreshDatabases]);

  const createDatabase = async (params: CreateDatabaseParams): Promise<Database | null> => {
    if (!user?.id) {
      setError('You must be logged in to create a database');
      showError('You must be logged in to create a database');
      return null;
    }

    setError(null);
    
    try {
      // Validate required fields
      if (!params.name || !params.query) {
        setError('Database name and search query are required');
        showError('Database name and search query are required');
        return null;
      }

      const response = await axios.post('/api/database/create', {
        ...params,
        userId: user.id
      });

      if (response.data.status === 'success') {
        // Add the new database to the list
        setDatabases(prev => [response.data.database, ...prev]);
        success(`Database "${params.name}" created successfully`);
        return response.data.database;
      } else {
        const errorMsg = response.data.error || 'Failed to create database';
        setError(errorMsg);
        showError(errorMsg);
        return null;
      }
    } catch (error) {
      console.error('Error creating database:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create database';
      setError(errorMsg);
      showError(`Failed to create database: ${errorMsg}`);
      return null;
    }
  };

  const deleteDatabase = async (databaseId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('You must be logged in to delete a database');
      showError('You must be logged in to delete a database');
      return false;
    }

    setError(null);
    
    try {
      const response = await axios.post('/api/database/delete', {
        databaseId,
        userId: user.id
      });

      if (response.data.status === 'success') {
        // Remove the database from the list
        const deletedDb = databases.find(db => db.id === databaseId);
        setDatabases(prev => prev.filter(db => db.id !== databaseId));
        if (deletedDb) {
          success(`Database "${deletedDb.name}" deleted successfully`);
        } else {
          success('Database deleted successfully');
        }
        return true;
      } else {
        const errorMsg = response.data.error || 'Failed to delete database';
        setError(errorMsg);
        showError(errorMsg);
        return false;
      }
    } catch (error) {
      console.error('Error deleting database:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete database';
      setError(errorMsg);
      showError(errorMsg);
      return false;
    }
  };

  const exportDatabase = async (databaseId: string, format: string = 'json', skipToast: boolean = true) => {
    if (!user?.id) {
      setError('You must be logged in to export a database');
      showError('You must be logged in to export a database');
      return null;
    }

    setError(null);
    
    try {
      const response = await axios.post('/api/database/export', {
        databaseId,
        userId: user.id,
        format
      });

      if (response.data.status === 'success') {
        const db = databases.find(db => db.id === databaseId);
        // Only show the toast if skipToast is false (component will handle its own toast)
        if (!skipToast && db) {
          success(`Database "${db.name}" exported as ${format.toUpperCase()}`);
        }
        return response.data;
      } else {
        const errorMsg = response.data.error || 'Failed to export database';
        setError(errorMsg);
        showError(errorMsg);
        return null;
      }
    } catch (error) {
      console.error('Error exporting database:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to export database';
      setError(errorMsg);
      showError(errorMsg);
      return null;
    }
  };

  const checkDatabaseStatus = async (databaseId: string): Promise<Database | null> => {
    if (!user?.id) {
      setError('You must be logged in to check database status');
      showError('You must be logged in to check database status');
      return null;
    }

    setError(null);
    
    try {
      console.log(`Sending status check request for database ID: ${databaseId}`);
      const response = await axios.post('/api/database/status', {
        databaseId,
        userId: user.id
      });

      console.log(`Status check response for ${databaseId}:`, response.data);

      if (response.data.status === 'success') {
        console.log(`Database ${databaseId} completed successfully`);
        const updatedDatabase = response.data.database;
        setDatabases(prev => 
          prev.map(db => 
            db.id === updatedDatabase.id ? updatedDatabase : db
          )
        );
        
        // Show success toast if the database just completed
        const prevDb = databases.find(db => db.id === databaseId);
        if (prevDb && prevDb.status !== 'completed' && updatedDatabase.status === 'completed') {
          success(`Database "${updatedDatabase.name}" is ready!`);
        }
        
        return updatedDatabase;
      } else if (response.data.status === 'processing') {
        console.log(`Database ${databaseId} is still processing`);
        setDatabases(prev => 
          prev.map(db => 
            db.id === response.data.database.id ? response.data.database : db
          )
        );
        return response.data.database;
      } else if (response.data.status === 'error') {
        const errorDetails = response.data.error || {};
        let errorMsg = '';
        
        // Check for specific error types we can provide better messages for
        if (typeof errorDetails === 'string') {
          errorMsg = errorDetails;
        } else if (errorDetails.message && errorDetails.message.includes('Invalid key')) {
          errorMsg = 'Filename contains invalid characters. Please use only English letters, numbers and simple symbols.';
        } else if (errorDetails.statusCode === '400' && errorDetails.error) {
          errorMsg = `${errorDetails.error}: ${errorDetails.message || ''}`;
        } else {
          errorMsg = 'Failed to check database status';
        }
        
        console.error(`Database ${databaseId} status check error:`, errorMsg);
        setError(errorMsg);
        showError(errorMsg);
        
        // Update the database status to failed
        setDatabases(prev => 
          prev.map(db => 
            db.id === response.data.database.id ? { ...db, status: 'failed' } : db
          )
        );
        return null;
      } else {
        const errorMsg = response.data.error || 'Failed to check database status';
        console.error('Status check error:', errorMsg);
        setError(errorMsg);
        showError(errorMsg);
        return null;
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check database status';
      setError(errorMessage);
      showError(errorMessage);
      
      // Don't update the status on error - we'll retry later
      return null;
    }
  };

  const getTotalContacts = useCallback(() => {
    return databases.reduce((total, db) => {
      // Only count completed databases
      if (db.status === 'completed' && db.statistics?.completed) {
        return total + db.statistics.completed;
      }
      return total;
    }, 0);
  }, [databases]);

  const value = {
    databases,
    isLoading,
    error,
    createDatabase,
    refreshDatabases,
    deleteDatabase,
    exportDatabase,
    checkDatabaseStatus,
    getTotalContacts
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => useContext(DatabaseContext); 