'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (message: string, type?: ToastType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto dismiss after duration
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return toast(message, 'success', duration);
  }, [toast]);

  const error = useCallback((message: string, duration?: number) => {
    return toast(message, 'error', duration);
  }, [toast]);

  const info = useCallback((message: string, duration?: number) => {
    return toast(message, 'info', duration);
  }, [toast]);

  const warning = useCallback((message: string, duration?: number) => {
    return toast(message, 'warning', duration);
  }, [toast]);

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        toast, 
        success, 
        error, 
        info, 
        warning, 
        dismiss 
      }}
    >
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
} 