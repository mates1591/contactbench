import React from 'react';

/**
 * A loading skeleton component that displays a placeholder UI while content is loading
 */
const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-neutral">
      {/* Dashboard Header Skeleton */}
      <div className="bg-neutral-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-neutral-darker rounded-md animate-pulse"></div>
            <div className="h-6 w-24 bg-neutral-darker rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Dashboard Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-dark rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 w-32 bg-neutral-darker rounded-md mb-4"></div>
              <div className="h-8 w-16 bg-neutral-darker rounded-md mb-2"></div>
              <div className="h-4 w-40 bg-neutral-darker rounded-md"></div>
            </div>
          ))}
        </div>

        {/* Database List Skeleton */}
        <div className="bg-neutral-dark rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-neutral-darker rounded-md"></div>
            <div className="h-10 w-32 bg-neutral-darker rounded-md"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 h-6 bg-neutral-darker rounded-md"></div>
                  <div className="col-span-2 h-6 bg-neutral-darker rounded-md"></div>
                  <div className="col-span-2 h-6 bg-neutral-darker rounded-md"></div>
                  <div className="col-span-2 h-6 bg-neutral-darker rounded-md"></div>
                  <div className="col-span-2 h-6 bg-neutral-darker rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton; 