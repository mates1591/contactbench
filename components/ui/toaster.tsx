'use client';

import { useToast } from '@/hooks/useToast';
import { Toast } from './toast';
import { AnimatePresence } from 'framer-motion';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={dismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 