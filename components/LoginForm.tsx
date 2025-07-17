'use client';

import { useState } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import Image from 'next/image';

interface LoginFormProps {
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function LoginForm({ 
  onSubmit, 
  onGoogleSignIn, 
  isLoading, 
  error 
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password, isSignUp);
  };

  return (
    <div className="w-full space-y-8 p-8 bg-neutral-dark rounded-2xl shadow-lg border border-gray-800">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <h2 className="text-2xl font-medium text-white">
            Contact<span className="gradient-text">Bench</span>
          </h2>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-center">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <button
          onClick={onGoogleSignIn}
          className="w-full py-2.5 px-4 border border-gray-700 rounded-full shadow-lg text-white bg-neutral hover:bg-neutral-darker transition-all flex items-center justify-center"
        >
          <Image
            src="/Google-Logo.png"
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-4 text-sm text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          Create an account
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md shadow-sm space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#1E2434] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-[#1E2434] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            Forgot your password?
          </button>
        </div>

        <ForgotPasswordModal 
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-2.5 px-4 gradient-button rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 focus:outline-none transition-all"
        >
          Sign {isSignUp ? 'up' : 'in'} with Email
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
}