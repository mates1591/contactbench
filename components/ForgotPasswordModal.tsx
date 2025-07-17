'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password#`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-dark rounded-lg p-6 max-w-md w-full border border-gray-800 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Reset Password</h2>
        
        {success ? (
          <div className="space-y-4">
            <p className="text-green-400">
              Reset link has been sent to your email address. Please check your inbox.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md bg-[#1E2434] border border-gray-700 text-white placeholder-gray-400 focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 bg-neutral border border-gray-700 text-white rounded-full hover:bg-neutral-darker"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="py-2 px-4 gradient-button rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 