/**
 * Loading spinner component for Suspense fallback
 * @file components/LoadingSpinner.tsx
 */

import React from 'react';

/**
 * A simple loading spinner component
 */
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-primary"></div>
    </div>
  );
};

export default LoadingSpinner; 