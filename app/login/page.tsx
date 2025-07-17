'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  useEffect(() => {
    // Check for redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
      // Store the redirect path to use after login
      setRedirectPath(`/${redirect}`);
    }
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(redirectPath);
    } else {
      setIsLoading(false);
    }
  }, [user, router, redirectPath]);

  const handleSubmit = async (email: string, password: string, isSignUp: boolean) => {
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        
        // Check if the user needs to verify their email
        if (data?.user && !data.user.email_confirmed_at) {
          router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        
        router.replace(redirectPath);
      } else {
        await signInWithEmail(email, password);
        router.replace(redirectPath);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex mt-20 justify-center bg-neutral px-4">
      <div className="w-full max-w-md">
        {/* <h1 className="text-4xl font-bold text-center mb-8 text-primary dark:text-white">
          NextTemp
        </h1> */}
        <LoginForm
          onSubmit={handleSubmit}
          onGoogleSignIn={signInWithGoogle}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
} 