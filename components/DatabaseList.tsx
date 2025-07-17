'use client';

import { useState, useEffect, useRef } from 'react';
import { useDatabase, Database } from '@/contexts/DatabaseContext';
import { useDatabasePolling } from '@/hooks/useDatabasePolling';
import { motion } from 'framer-motion';
import { 
  CloudDownload, 
  RefreshCw, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from "@/hooks/useToast";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { supabase } from '@/utils/supabase';

interface DatabaseListProps {
  onCreateNew: () => void;
}

export function DatabaseList({ onCreateNew }: DatabaseListProps) {
  const { databases, isLoading, error, deleteDatabase, exportDatabase, checkDatabaseStatus, refreshDatabases } = useDatabase();
  const { pollingErrors, resetPollingErrors } = useDatabasePolling();
  const { success, error: showError } = useToast();
  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({});
  const [refreshLoading, setRefreshLoading] = useState<Record<string, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [openExportMenu, setOpenExportMenu] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // Calculate total pages
  const totalPages = Math.ceil(databases.length / recordsPerPage);
  
  // Get current records
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentDatabases = databases.slice(indexOfFirstRecord, indexOfLastRecord);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if click was outside both the button and the menu
      const isMenuClick = exportMenuRef.current && exportMenuRef.current.contains(event.target as Node);
      const isButtonClick = exportButtonRef.current && exportButtonRef.current.contains(event.target as Node);
      
      if (!isMenuClick && !isButtonClick && openExportMenu !== null) {
        setOpenExportMenu(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExportMenu]);

  // Refresh all databases when component mounts
  useEffect(() => {
    refreshDatabases();
  }, [refreshDatabases]);
  
  // Reset to first page when database count changes
  useEffect(() => {
    if (currentPage > 1 && indexOfFirstRecord >= databases.length) {
      setCurrentPage(Math.max(1, Math.ceil(databases.length / recordsPerPage)));
    }
  }, [databases.length, currentPage, indexOfFirstRecord, recordsPerPage]);

  const handleExportClick = (databaseId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    
    // If menu is being opened, calculate and set position
    if (openExportMenu !== databaseId) {
      const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      
      // Position the menu directly under the button
      setMenuPosition({
        top: buttonRect.bottom + window.scrollY + 5, // 5px below button
        left: buttonRect.left // Left align with the button
      });
    }
    
    setOpenExportMenu(openExportMenu === databaseId ? null : databaseId);
  };

  const handleExport = async (database: Database, format: string) => {
    if (!database || !format) return;
    
    // Flag to track if we should show download started message
    let downloadStarted = false;
    
    setExportLoading(prev => ({ ...prev, [database.id]: true }));
    setOpenExportMenu(null); // Close the menu after selecting an option
    
    try {
      console.log(`Downloading database ${database.id} in format: ${format}`);
      
      // Check if the file path exists for the requested format
      if (database.file_paths && database.file_paths[format]) {
        // Get a signed URL for the existing file
        const response = await axios.post('/api/database/download', {
          databaseId: database.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
          format
        });
        
        if (response.data.status === 'success' && response.data.downloadUrl) {
          // Method 1: Try using fetch API first (more reliable for larger files)
          try {
            // Create a promise to track download progress
            const downloadPromise = new Promise<void>(async (resolve, reject) => {
              try {
                // Use fetch to get the data as a blob
                const fileResponse = await fetch(response.data.downloadUrl);
                
                if (!fileResponse.ok) {
                  throw new Error(`Server responded with ${fileResponse.status}`);
                }
                
                const blob = await fileResponse.blob();
                
                // Create a download link
                const url = window.URL.createObjectURL(blob);
                // Use correct file extension
                const extension = format === 'excel' ? 'xlsx' : format;
                const filename = `${database.name.replace(/\s+/g, '_').toLowerCase()}.${extension}`;
                
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                link.style.display = 'none';
                
                // Add to DOM, click and remove with longer delay
                document.body.appendChild(link);
                link.click();
                
                // Mark as started
                downloadStarted = true;
                
                // Revoke the object URL and remove link after 3 seconds
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(link);
                  resolve();
                }, 3000);
              } catch (error) {
                reject(error);
              }
            });
            
            // Wait for download to complete or error out with a 10 second timeout
            await Promise.race([
              downloadPromise,
              new Promise<void>((_, reject) => {
                setTimeout(() => reject(new Error('Download timed out')), 10000);
              })
            ]);
            
            success(`Database downloaded as ${format.toUpperCase()}`);
          } catch (fetchError) {
            console.error('Error with fetch download, falling back to link method:', fetchError);
            
            // Method 2: Fallback to simpler approach if fetch fails
            const link = document.createElement('a');
            link.href = response.data.downloadUrl;
            // Use correct file extension
            const extension = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `${database.name.replace(/\s+/g, '_').toLowerCase()}.${extension}`);
            link.target = '_blank'; // Open in new tab to avoid navigation issues
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Cleanup after a longer delay to ensure the download starts
            setTimeout(() => {
              document.body.removeChild(link);
            }, 2000);
            
            downloadStarted = true;
            success(`Database download started as ${format.toUpperCase()}`);
          }
        } else {
          console.error('No download URL returned');
          showError(`Failed to download database as ${format.toUpperCase()}`);
        }
      } else {
        console.error(`No ${format} file path found for this database`);
        showError(`This database doesn't have a ${format.toUpperCase()} file available`);
      }
    } catch (err) {
      console.error('Error downloading database:', err);
      showError(`Failed to download: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      // Add a slight delay to ensure loading state doesn't disappear too quickly
      setTimeout(() => {
        setExportLoading(prev => ({ ...prev, [database.id]: false }));
        
        // Show success message if we haven't already
        if (!downloadStarted) {
          showError('Download failed to start. Please try again.');
        }
      }, 1000);
    }
  };

  const handleRefresh = async (database: Database) => {
    setRefreshLoading(prev => ({ ...prev, [database.id]: true }));
    
    try {
      console.log(`Manually refreshing database ${database.id} (${database.name})`);
      
      // Reset polling errors to allow polling again
      resetPollingErrors(database.id);
      
      // Immediately check status
      const updatedDatabase = await checkDatabaseStatus(database.id);
      console.log('Refresh result:', updatedDatabase);
    } catch (error) {
      console.error('Error refreshing database status:', error);
    } finally {
      setRefreshLoading(prev => ({ ...prev, [database.id]: false }));
    }
  };

  const confirmDelete = (database: Database) => {
    setSelectedDatabase(database);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDatabase) return;
    
    setDeleteLoading(prev => ({ ...prev, [selectedDatabase.id]: true }));
    
    try {
      const success = await deleteDatabase(selectedDatabase.id);
      if (success) {
        setModalOpen(false);
        setSelectedDatabase(null);
      }
    } catch (error) {
      console.error('Error deleting database:', error);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [selectedDatabase.id]: false }));
    }
  };

  const getStatusBadge = (database: Database) => {
    const hasPollingErrors = pollingErrors[database.id] && pollingErrors[database.id] > 0;
    
    switch (database.status) {
      case 'pending':
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          <Clock className="w-3 h-3" /> Pending
        </span>;
      case 'processing':
        return (
          <span className={`flex items-center gap-1 px-2 py-1 ${
            hasPollingErrors 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-blue-100 animate-pulse'
          } text-xs rounded-full`}>
            {hasPollingErrors ? <AlertTriangle className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
            {hasPollingErrors ? 'Checking' : 'Processing'}
          </span>
        );
      case 'completed':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>;
      case 'failed':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          <AlertCircle className="w-3 h-3" /> Failed
        </span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          {database.status}
        </span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  // New function to format location in a user-friendly way
  const formatLocation = (database: Database) => {
    // For new databases with query_type field
    if (database.query_type) {
      if (database.query_type === 'structured' && database.location) {
        try {
          // Try to parse the location if it's stored as JSON
          let locationData;
          const locationStr = database.location as string;
          
          if (typeof locationStr === 'string' && locationStr.startsWith('{')) {
            locationData = JSON.parse(locationStr);
          } else if (typeof database.location === 'object') {
            locationData = database.location;
          }

          if (locationData) {
            const country = locationData.country || '';
            const state = locationData.state || '';
            const city = locationData.city || '';
            
            // Handle different combinations of location selections
            if (city && city !== 'all_cities') {
              return `${database.search_query} in ${country}${state ? `, ${state}` : ''}${city ? `, ${city}` : ''}`;
            } else if (state && state !== 'all_states') {
              if (locationData.cities) {
                return `${database.search_query} in ${country}, ${state}, All Cities`;
              } else {
                return `${database.search_query} in ${country}, ${state}`;
              }
            } else {
              if (locationData.states) {
                return `${database.search_query} in ${country}, All States, All Cities`;
              } else {
                return `${database.search_query} in ${country}`;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing location:', e);
        }
      } else if (database.query_type === 'free_text' && database.location) {
        // For free text locations, show first location if multiple
        const locationStr = database.location as string;
        
        if (typeof locationStr === 'string') {
          const locations = locationStr.split('\n').filter(Boolean);
          
          if (locations.length === 1) {
            return `${database.search_query} in ${locations[0]}`;
          } else if (locations.length > 1) {
            return `${database.search_query} in ${locations[0]} + ${locations.length - 1} more`;
          }
        }
      }
    }
    
    // Fallback for older databases or if structured parsing fails
    if (database.location) {
      // Try to show just the beginning if it's too long
      const locationStr = database.location as string;
      
      if (typeof locationStr === 'string') {
        if (locationStr.length > 50) {
          return `${database.search_query} in ${locationStr.substring(0, 50)}...`;
        }
        return `${database.search_query} in ${locationStr}`;
      }
    }
    
    return database.search_query;
  };

  // Render export menu with portal
  const renderExportMenu = (database: Database) => {
    if (openExportMenu !== database.id) return null;
    
    return createPortal(
      <div 
        ref={exportMenuRef} 
        className="fixed z-50 bg-neutral-dark shadow-lg rounded-md p-2 border border-gray-700 flex flex-col gap-1 w-32"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
      >
        <button 
          onClick={() => handleExport(database, 'json')}
          className="text-sm p-2 hover:bg-neutral-darker rounded-md text-center text-white"
          disabled={exportLoading[database.id]}
        >
          {exportLoading[database.id] ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
              Downloading...
            </div>
          ) : 'JSON'}
        </button>
        <button 
          onClick={() => handleExport(database, 'csv')}
          className="text-sm p-2 hover:bg-neutral-darker rounded-md text-center text-white"
          disabled={exportLoading[database.id]}
        >
          {exportLoading[database.id] ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
              Downloading...
            </div>
          ) : 'CSV'}
        </button>
        <button 
          onClick={() => handleExport(database, 'excel')}
          className="text-sm p-2 hover:bg-neutral-darker rounded-md text-center text-white"
          disabled={exportLoading[database.id]}
        >
          {exportLoading[database.id] ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
              Downloading...
            </div>
          ) : 'Excel'}
        </button>
      </div>,
      document.body
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-neutral-dark rounded-lg p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-neutral-dark rounded-lg shadow-md overflow-hidden">
      <div className="bg-neutral-dark p-6 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            My Databases
          </h2>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all flex items-center"
          >
            <span className="mr-2">Create New Database</span> <span className="text-lg">+</span>
          </button>
        </div>
      </div>
      
      {databases.length === 0 ? (
        <div className="bg-neutral-dark rounded-xl p-8 text-center">
          <p className="text-white mb-4">
            You haven't created any databases yet.
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Create Your First Database
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-neutral-dark rounded-xl shadow">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Database
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Statistics
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentDatabases.map((database) => (
                  <motion.tr 
                    key={database.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-200 dark:border-slate-700 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      <div>
                        <div className="font-medium">{database.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatLocation(database)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(database)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      {database.statistics ? (
                        <div className="text-xs">
                          {database.statistics.unique_contacts || database.statistics.completed || 0} contacts
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      <div className="text-xs">{formatDate(database.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        {database.status === 'completed' && (
                          <div className="relative">
                            <button
                              ref={exportButtonRef}
                              onClick={(e) => handleExportClick(database.id, e)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                              title="Export database"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                            {renderExportMenu(database)}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleRefresh(database)}
                          disabled={refreshLoading[database.id]}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 focus:outline-none"
                          title="Refresh status"
                        >
                          {refreshLoading[database.id] ? (
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          ) : (
                            <RefreshCw className="h-5 w-5" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => confirmDelete(database)}
                          disabled={deleteLoading[database.id]}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 focus:outline-none"
                          title="Delete database"
                        >
                          {deleteLoading[database.id] ? (
                            <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center py-6 border-t border-gray-800 mt-6">
              <nav className="flex items-center space-x-3">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-neutral border border-gray-700 hover:bg-neutral-darker text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-3 mx-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all 
                                  ${currentPage === index + 1 
                                    ? 'gradient-button text-white' 
                                    : 'bg-neutral border border-gray-700 hover:bg-neutral-darker text-white'
                                  }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-neutral border border-gray-700 hover:bg-neutral-darker text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {modalOpen && selectedDatabase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Are you sure you want to delete the database "{selectedDatabase.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-neutral border border-gray-700 hover:bg-neutral-darker text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading[selectedDatabase.id]}
                className="px-4 py-2 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {deleteLoading[selectedDatabase.id] ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 