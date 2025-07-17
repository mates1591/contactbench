'use client';

import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { ToastProvider } from '@/providers/ToastProvider';
import TopBar from '../components/TopBar';
import ProtectedRoute from '@/contexts/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react"
import { useEffect } from "react";
// import { PostHogProvider } from '@/contexts/PostHogContext';
// import { PostHogErrorBoundary } from '@/components/PostHogErrorBoundary';

const geist = Geist({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dark mode on the document
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-mode', 'dark');
    
    // Add a class to the body when the page loads to help target mobile tap highlight
    document.body.classList.add('no-highlight');
  }, []);

  return (
    <html lang="en" className="dark" data-mode="dark" suppressHydrationWarning style={{ WebkitTapHighlightColor: 'transparent' }}>
      <head>
        <title>ContactBench | B2B Database Builder</title>
        <meta name="description" content="Build powerful B2B contact databases quickly and easily with ContactBench" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#151515" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Global disable of tap highlight */
          html, body, div, button, a, input, select, textarea, span {
            -webkit-tap-highlight-color: transparent !important;
            outline: none !important;
            -webkit-touch-callout: none !important;
            -webkit-highlight: none !important;
          }
          
          /* Explicit mobile browser targeting */
          @media (hover: none) {
            * {
              -webkit-tap-highlight-color: transparent !important;
              -moz-tap-highlight-color: transparent !important;
              -ms-tap-highlight-color: transparent !important;
              outline: none !important;
            }
            
            *:focus, *:active {
              outline: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }
          }
          
          /* Specific target for WebKit */
          @supports (-webkit-tap-highlight-color: transparent) {
            * {
              -webkit-tap-highlight-color: transparent !important;
              outline: none !important;
            }
          }
          
          /* No outline class */
          .no-highlight * {
            -webkit-tap-highlight-color: transparent !important;
            outline: none !important;
            border-color: inherit;
          }
        `}} />
      </head>
      <body className={`${geist.className} bg-neutral text-white no-highlight`} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <Analytics mode="auto" />
        {/* <PostHogErrorBoundary>
          <PostHogProvider> */}
            <AuthProvider>   
                <ToastProvider>
                  <DatabaseProvider>
                      <ProtectedRoute>
                        <TopBar />    
                        <main className="min-h-screen" style={{ WebkitTapHighlightColor: 'transparent' }}>{children}</main>
                      </ProtectedRoute>
                  </DatabaseProvider>
                </ToastProvider>
            </AuthProvider>
          {/* </PostHogProvider>
        </PostHogErrorBoundary> */}
      </body>
    </html>
  );
}
