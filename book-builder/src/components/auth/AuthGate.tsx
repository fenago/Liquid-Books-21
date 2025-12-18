'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './LoginModal';
import { BookOpen, Lock } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, loading, isConfigured } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // If Supabase isn't configured, allow access (for development without auth)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Liquid Books
            </h1>
          </div>

          {/* Lock Icon */}
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Message */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to continue
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Create an account or sign in to start building your AI-powered books.
          </p>

          {/* Sign In Button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mb-4"
          >
            Sign In
          </button>

          {/* Features List */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              With Liquid Books you can:
            </p>
            <ul className="text-sm text-left space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Generate book content with AI
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Create beautiful table of contents
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Publish to GitHub automatically
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                Save your API keys securely
              </li>
            </ul>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
