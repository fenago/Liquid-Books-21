'use client';

import { useState, useEffect } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { AIProvider, AIModel } from '@/types';
import { Key, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApiKeys } from '@/lib/supabase/hooks/useApiKeys';
import { useUserSettings } from '@/lib/supabase/hooks/useUserSettings';
import Link from 'next/link';

const PROVIDERS: { id: AIProvider; name: string; description: string }[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI models',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Advanced reasoning and writing capabilities',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    description: 'GPT-4 and GPT-3.5 models',
  },
];

export function AISetupStep() {
  const {
    aiConfig,
    setAIProvider,
    setAIApiKey,
    setSelectedModel,
    setAvailableModels,
    setCurrentStep,
  } = useBookStore();

  // Auth and saved settings hooks
  const { isAuthenticated } = useAuth();
  const { apiKeys, loading: keysLoading, getApiKey } = useApiKeys();
  const { settings, loading: settingsLoading, defaultProvider, defaultModel } = useUserSettings();

  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [usingSavedSettings, setUsingSavedSettings] = useState(false);
  const [loadingSavedKey, setLoadingSavedKey] = useState(false);

  // Check if user has saved API key for the default provider
  const hasSavedKeyForDefaultProvider = apiKeys.some(
    k => k.provider === defaultProvider && k.hasKey && k.isValid
  );
  const hasSavedSettings = isAuthenticated && hasSavedKeyForDefaultProvider && settings;

  // Auto-load saved settings if user is authenticated and has saved keys
  useEffect(() => {
    if (hasSavedSettings && !aiConfig.apiKey && !usingSavedSettings) {
      // Don't auto-load, let user click the button
    }
  }, [hasSavedSettings, aiConfig.apiKey, usingSavedSettings]);

  const handleUseSavedSettings = async () => {
    if (!hasSavedSettings) return;

    setLoadingSavedKey(true);
    setError(null);

    try {
      // Get the saved API key for the default provider
      const savedKey = await getApiKey(defaultProvider as 'claude' | 'openai' | 'gemini');

      if (!savedKey) {
        throw new Error('Could not retrieve saved API key');
      }

      // Set the provider, API key
      setAIProvider(defaultProvider as AIProvider);
      setAIApiKey(savedKey);
      setUsingSavedSettings(true);

      // Now validate the key and fetch models
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: defaultProvider,
          apiKey: savedKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate API key');
      }

      setAvailableModels(data.models);
      setIsValidated(true);

      // Try to select the default model, or first available
      const modelExists = data.models.some((m: AIModel) => m.id === defaultModel);
      if (modelExists) {
        setSelectedModel(defaultModel);
      } else if (data.models.length > 0) {
        setSelectedModel(data.models[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved settings');
      setUsingSavedSettings(false);
    } finally {
      setLoadingSavedKey(false);
    }
  };

  const handleProviderSelect = (provider: AIProvider) => {
    setAIProvider(provider);
    setError(null);
    setIsValidated(false);
    setUsingSavedSettings(false);
  };

  const handleValidateKey = async () => {
    if (!aiConfig.provider || !aiConfig.apiKey) {
      setError('Please select a provider and enter an API key');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate API key');
      }

      setAvailableModels(data.models);
      setIsValidated(true);

      // Auto-select first model if none selected
      if (data.models.length > 0 && !aiConfig.selectedModel) {
        setSelectedModel(data.models[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
      setIsValidated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (isValidated && aiConfig.selectedModel) {
      setCurrentStep('book-description');
    }
  };

  const canContinue = isValidated && aiConfig.selectedModel;

  // Get provider name for display
  const getProviderName = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    return provider?.name || providerId;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your AI provider to generate book content and table of contents.
        </p>
      </div>

      {/* Use Saved Settings Banner */}
      {hasSavedSettings && !usingSavedSettings && !isValidated && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Use Your Saved Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You have saved API keys and preferences. Use your default settings to get started quickly.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleUseSavedSettings}
                  disabled={loadingSavedKey}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors"
                >
                  {loadingSavedKey ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Use {getProviderName(defaultProvider)} ({defaultModel.split('-').slice(0, 2).join(' ')})
                    </>
                  )}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  or configure manually below
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Already using saved settings indicator */}
      {usingSavedSettings && isValidated && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700 dark:text-green-400 font-medium">
            Using saved settings: {getProviderName(aiConfig.provider || '')} with {aiConfig.selectedModel}
          </span>
        </div>
      )}

      {/* No saved settings - prompt to save */}
      {isAuthenticated && !hasSavedSettings && !keysLoading && !settingsLoading && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Settings className="h-5 w-5 text-blue-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Save your API keys in{' '}
            <Link href="/settings" className="text-blue-500 hover:text-blue-400 font-medium">
              Settings
            </Link>{' '}
            to skip this step next time.
          </span>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select AI Provider
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  aiConfig.provider === provider.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {provider.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {provider.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* API Key Input */}
      {aiConfig.provider && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={aiConfig.apiKey}
              onChange={(e) => {
                setAIApiKey(e.target.value);
                setIsValidated(false);
              }}
              placeholder={`Enter your ${aiConfig.provider} API key`}
              className="
                block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600
                rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showKey ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          <button
            onClick={handleValidateKey}
            disabled={isLoading || !aiConfig.apiKey}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              transition-colors
              ${
                isLoading || !aiConfig.apiKey
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : isValidated ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Validated
              </>
            ) : (
              'Validate & Fetch Models'
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Model Selection */}
      {isValidated && aiConfig.availableModels.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Model
          </label>
          <select
            value={aiConfig.selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="
              block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
              rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          >
            <option value="">Select a model...</option>
            {aiConfig.availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            transition-colors
            ${
              canContinue
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
