'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { WizardStep } from '@/types';
import {
  Key,
  BookOpen,
  List,
  Puzzle,
  Github,
  Rocket,
  Edit,
  CheckCircle,
  Library,
  Settings,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'ai-setup', label: 'AI Setup', icon: <Key size={20} /> },
  { id: 'book-description', label: 'Book Details', icon: <BookOpen size={20} /> },
  { id: 'toc-generation', label: 'Table of Contents', icon: <List size={20} /> },
  { id: 'feature-selection', label: 'Features', icon: <Puzzle size={20} /> },
  { id: 'github-setup', label: 'GitHub', icon: <Github size={20} /> },
  { id: 'generate-book', label: 'Generate', icon: <Rocket size={20} /> },
  { id: 'chapter-editor', label: 'Edit Chapters', icon: <Edit size={20} /> },
];

interface WizardContainerProps {
  children: React.ReactNode;
}

export function WizardContainer({ children }: WizardContainerProps) {
  const { currentStep, setCurrentStep } = useBookStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canNavigateTo = (stepIndex: number): boolean => {
    // Can always go back
    if (stepIndex < currentStepIndex) return true;
    // Can only go forward one step at a time (or stay on current)
    return stepIndex <= currentStepIndex;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Liquid Books
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                AI-Powered Book Builder
              </p>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/library"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Library className="h-4 w-4" />
                    <span className="hidden sm:inline">Library</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </Link>
                </div>
              )}
              <UserMenu onOpenAuth={() => setShowLoginModal(true)} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <nav className="mb-8">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = step.id === currentStep;
              const isClickable = canNavigateTo(index);

              return (
                <li key={step.id} className="flex-1 relative">
                  <button
                    onClick={() => isClickable && setCurrentStep(step.id)}
                    disabled={!isClickable}
                    className={`
                      flex flex-col items-center w-full group
                      ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        transition-colors duration-200
                        ${
                          isComplete
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }
                        ${isClickable && !isCurrent ? 'group-hover:bg-blue-400' : ''}
                      `}
                    >
                      {isComplete ? <CheckCircle size={20} /> : step.icon}
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-medium
                        ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </button>

                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        absolute top-5 left-1/2 w-full h-0.5
                        ${
                          index < currentStepIndex
                            ? 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
          {children}
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
