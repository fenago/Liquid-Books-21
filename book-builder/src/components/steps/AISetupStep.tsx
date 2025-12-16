'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { AIProvider, AIModel } from '@/types';
import { Key, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const PROVIDERS: { id: AIProvider; name: string; description: string }[] = [
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
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI models',
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

  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleProviderSelect = (provider: AIProvider) => {
    setAIProvider(provider);
    setError(null);
    setIsValidated(false);
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
