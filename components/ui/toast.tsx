'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Handle dismiss animation
  const handleDismiss = () => {
    setIsVisible(false);
    // Small delay to allow animation to complete
    setTimeout(() => onDismiss(id), 200);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md w-full";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-l-4 border-green-500`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-l-4 border-red-500`;
      case 'warning':
        return `${baseStyles} bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-l-4 border-amber-500`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-l-4 border-blue-500`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.2 }}
      className={getStyles()}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
} 