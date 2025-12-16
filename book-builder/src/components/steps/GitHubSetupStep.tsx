'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { ArrowLeft, ArrowRight, Github, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function GitHubSetupStep() {
  const { bookConfig, setGitHubConfig, setCurrentStep } = useBookStore();
  const [token, setToken] = useState(bookConfig.github?.token || '');
  const [repoName, setRepoName] = useState(
    bookConfig.github?.repoName ||
    bookConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    'my-book'
  );
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    username?: string;
    error?: string;
  } | null>(null);

  const validateToken = async () => {
    if (!token.trim()) {
      setValidationResult({ valid: false, error: 'Please enter a GitHub token' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const data = await response.json();
      setValidationResult({ valid: true, username: data.login });
      setGitHubConfig({
        token,
        repoName,
        username: data.login,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Invalid GitHub token. Please check and try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('feature-selection');
  };

  const handleContinue = () => {
    if (validationResult?.valid) {
      setGitHubConfig({
        token,
        repoName,
        username: validationResult.username!,
      });
      setCurrentStep('generate-book');
    }
  };

  const isValidRepoName = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(repoName);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          GitHub Setup
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your GitHub account to automatically create a repository and deploy your book to GitHub Pages.
        </p>
      </div>

      {/* GitHub Token Input */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub Personal Access Token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setValidationResult(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="
                w-full px-4 py-3 pr-24 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors
              "
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <button
                type="button"
                onClick={validateToken}
                disabled={isValidating || !token.trim()}
                className="
                  px-3 py-1 text-sm font-medium rounded
                  bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200
                  hover:bg-gray-200 dark:hover:bg-gray-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`
                mt-2 flex items-center gap-2 text-sm
                ${validationResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              `}
            >
              {validationResult.valid ? (
                <>
                  <CheckCircle size={16} />
                  <span>Connected as <strong>{validationResult.username}</strong></span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  <span>{validationResult.error}</span>
                </>
              )}
            </div>
          )}

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Need a token?{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,workflow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create one here
            </a>{' '}
            with <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">repo</code> and{' '}
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">workflow</code> scopes.
          </p>
        </div>

        {/* Repository Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Repository Name
          </label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-awesome-book"
            className={`
              w-full px-4 py-3 rounded-lg border
              ${isValidRepoName ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'}
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
            `}
          />
          {!isValidRepoName && repoName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Repository name must start with a letter or number and can only contain lowercase letters, numbers, and hyphens.
            </p>
          )}
          {validationResult?.valid && isValidRepoName && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your book will be available at:{' '}
              <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                https://{validationResult.username}.github.io/{repoName}
              </code>
            </p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Github className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">
              What happens next?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• A new public repository will be created in your GitHub account</li>
              <li>• All book files (MyST config, chapters, etc.) will be added</li>
              <li>• GitHub Actions workflow will be set up for automatic deployment</li>
              <li>• GitHub Pages will be enabled for hosting your book</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
          "
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!validationResult?.valid || !isValidRepoName}
          className="
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            bg-blue-600 hover:bg-blue-700 text-white transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
