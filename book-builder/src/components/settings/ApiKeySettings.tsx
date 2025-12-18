'use client';

import { useState } from 'react';
import { useApiKeys, ApiKeyProvider } from '@/lib/supabase/hooks/useApiKeys';

const PROVIDER_INFO: Record<
  ApiKeyProvider,
  { name: string; description: string; placeholder: string; docsUrl: string }
> = {
  github: {
    name: 'GitHub',
    description: 'Personal Access Token for deploying books to GitHub Pages',
    placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://github.com/settings/tokens',
  },
  claude: {
    name: 'Anthropic (Claude)',
    description: 'API key for Claude AI content generation',
    placeholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  openai: {
    name: 'OpenAI',
    description: 'API key for GPT content generation',
    placeholder: 'sk-xxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    name: 'Google (Gemini)',
    description: 'API key for Gemini content generation',
    placeholder: 'AIzaxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
};

interface ApiKeyInputProps {
  provider: ApiKeyProvider;
  hasKey: boolean;
  keyHint: string | null;
  isValid: boolean;
  onSave: (key: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

function ApiKeyInput({
  provider,
  hasKey,
  keyHint,
  isValid,
  onSave,
  onDelete,
}: ApiKeyInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const info = PROVIDER_INFO[provider];

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    const success = await onSave(value.trim());
    setSaving(false);
    if (success) {
      setValue('');
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${info.name} API key?`)) return;
    setSaving(true);
    await onDelete();
    setSaving(false);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {info.name}
            </h4>
            {hasKey && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isValid
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {isValid ? 'Active' : 'Invalid'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {info.description}
          </p>
          {hasKey && keyHint && !isEditing && (
            <p className="text-sm font-mono text-gray-600 dark:text-gray-300 mt-2">
              Key: {keyHint}
            </p>
          )}
        </div>

        <a
          href={info.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Get key →
        </a>
      </div>

      {isEditing ? (
        <div className="mt-4">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={info.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setValue('');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium rounded-lg transition-colors"
          >
            {hasKey ? 'Update Key' : 'Add Key'}
          </button>
          {hasKey && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm font-medium rounded-lg transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiKeySettings() {
  const { apiKeys, loading, error, saveApiKey, deleteApiKey } = useApiKeys();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          API Keys
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Save your API keys here so you don&apos;t have to enter them every time.
          Keys are stored securely and never exposed in the browser.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {apiKeys.map((keyInfo) => (
          <ApiKeyInput
            key={keyInfo.provider}
            provider={keyInfo.provider}
            hasKey={keyInfo.hasKey}
            keyHint={keyInfo.keyHint}
            isValid={keyInfo.isValid}
            onSave={(key) => saveApiKey(keyInfo.provider, key)}
            onDelete={() => deleteApiKey(keyInfo.provider)}
          />
        ))}
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Security Note:</strong> Your API keys are stored in the database
          associated with your account. For maximum security, consider using
          environment variables for server-side operations.
        </p>
      </div>
    </div>
  );
}
