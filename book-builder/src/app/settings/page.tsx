'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/lib/supabase/hooks/useUserSettings';
import { useApiKeys, type ApiKeyProvider } from '@/lib/supabase/hooks/useApiKeys';
import { AuthGate } from '@/components/auth/AuthGate';
import Link from 'next/link';
import {
  ChevronLeft,
  Settings,
  Key,
  Sparkles,
  Palette,
  Edit3,
  Save,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Github,
  Loader2,
} from 'lucide-react';

const AI_PROVIDERS = [
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    description: 'Google AI models including Gemini 3.0 Flash',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'openai' as const,
    name: 'OpenAI',
    description: 'GPT-4 and other OpenAI models',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'claude' as const,
    name: 'Anthropic Claude',
    description: 'Claude 4 and other Anthropic models',
    color: 'from-orange-500 to-amber-500',
  },
];

const DEFAULT_MODELS: Record<string, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (64K output)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  claude: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Recommended)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
};

const EDITOR_MODES = [
  { id: 'rich', name: 'Rich Text', description: 'WYSIWYG editor with toolbar' },
  { id: 'raw', name: 'Raw Markdown', description: 'Plain text editor for MyST syntax' },
  { id: 'split', name: 'Split View', description: 'Editor with live preview' },
];

const THEMES = [
  { id: 'dark', name: 'Dark', description: 'Dark theme (default)' },
  { id: 'light', name: 'Light', description: 'Light theme' },
  { id: 'system', name: 'System', description: 'Follow system preference' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    settings,
    loading: settingsLoading,
    updateSettings,
    defaultProvider,
    defaultModel,
    theme,
    editorMode,
    defaultGitHubUsername,
  } = useUserSettings();

  const { apiKeys, loading: keysLoading, error: keysError, saveApiKey, deleteApiKey } = useApiKeys();

  // Local state for form
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'claude' | 'gemini'>(defaultProvider || 'gemini');
  const [selectedModel, setSelectedModel] = useState(defaultModel || 'gemini-3-flash-preview');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(theme || 'dark');
  const [selectedEditorMode, setSelectedEditorMode] = useState<'rich' | 'raw' | 'split'>(editorMode || 'rich');
  const [githubUsername, setGithubUsername] = useState(defaultGitHubUsername || '');

  // API Key editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.default_provider);
      setSelectedModel(settings.default_model);
      setSelectedTheme(settings.theme);
      setSelectedEditorMode(settings.editor_mode);
      setGithubUsername(settings.default_github_username || '');
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSettings({
        default_provider: selectedProvider,
        default_model: selectedModel,
        theme: selectedTheme,
        editor_mode: selectedEditorMode,
        default_github_username: githubUsername || null,
      });

      // Also save theme to localStorage for immediate effect
      localStorage.setItem('theme', selectedTheme);

      // Apply theme immediately
      if (selectedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (selectedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (selectedTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveKey = async (provider: ApiKeyProvider) => {
    if (!keyValue.trim()) return;

    try {
      setSavingKey(true);
      setKeyError(null);
      const success = await saveApiKey(provider, keyValue.trim());
      if (success) {
        setEditingKey(null);
        setKeyValue('');
        setShowKey(false);
      } else {
        setKeyError('Failed to save API key. Please try again.');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setKeyError('Failed to save API key. Please try again.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async (provider: ApiKeyProvider) => {
    try {
      await deleteApiKey(provider);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const getKeyForProvider = (provider: string) => {
    return apiKeys.find(k => k.provider === provider);
  };

  const loading = settingsLoading || keysLoading;

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back</span>
                </Link>
                <div className="h-6 w-px bg-gray-700" />
                <div className="flex items-center gap-2">
                  <Settings className="h-6 w-6 text-purple-400" />
                  <h1 className="text-xl font-semibold text-white">Settings</h1>
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings || loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors"
              >
                {savingSettings ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              {/* Default AI Model Section */}
              <section className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Default AI Model</h2>
                      <p className="text-sm text-gray-400">
                        Choose your preferred AI provider and model for content generation
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      AI Provider
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {AI_PROVIDERS.map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => {
                            setSelectedProvider(provider.id);
                            // Set first model as default when switching providers
                            setSelectedModel(DEFAULT_MODELS[provider.id][0].id);
                          }}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedProvider === provider.id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${provider.color} mb-3`}
                          />
                          <div className="font-medium text-white">{provider.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {provider.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Default Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {(DEFAULT_MODELS[selectedProvider] || DEFAULT_MODELS.gemini).map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      This model will be pre-selected when creating new books
                    </p>
                  </div>
                </div>
              </section>

              {/* API Keys Section */}
              <section className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Key className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">API Keys</h2>
                      <p className="text-sm text-gray-400">
                        Store your API keys securely to avoid entering them each time
                      </p>
                    </div>
                  </div>
                  {(keyError || keysError) && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{keyError || keysError}</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-gray-700/50">
                  {/* GitHub */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Github className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-white">GitHub Token</div>
                          <div className="text-sm text-gray-400">
                            For deploying books to GitHub Pages
                          </div>
                        </div>
                      </div>
                      {getKeyForProvider('github')?.hasKey ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-400 flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            {getKeyForProvider('github')?.keyHint || 'Configured'}
                          </span>
                          <button
                            onClick={() => handleDeleteKey('github')}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : editingKey === 'github' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingKey(null);
                              setKeyValue('');
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingKey('github')}
                          className="text-sm text-purple-400 hover:text-purple-300"
                        >
                          Add Key
                        </button>
                      )}
                    </div>
                    {editingKey === 'github' && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={keyValue}
                            onChange={e => setKeyValue(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveKey('github')}
                          disabled={savingKey || !keyValue.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          {savingKey ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Provider Keys */}
                  {AI_PROVIDERS.map(provider => {
                    const existingKey = getKeyForProvider(provider.id);
                    return (
                      <div key={provider.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded bg-gradient-to-br ${provider.color}`}
                            />
                            <div>
                              <div className="font-medium text-white">
                                {provider.name} API Key
                              </div>
                              <div className="text-sm text-gray-400">
                                {provider.description}
                              </div>
                            </div>
                          </div>
                          {existingKey?.hasKey ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-400 flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                {existingKey.keyHint || 'Configured'}
                              </span>
                              <button
                                onClick={() => handleDeleteKey(provider.id)}
                                className="text-sm text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          ) : editingKey === provider.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingKey(null);
                                  setKeyValue('');
                                }}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingKey(provider.id)}
                              className="text-sm text-purple-400 hover:text-purple-300"
                            >
                              Add Key
                            </button>
                          )}
                        </div>
                        {editingKey === provider.id && (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showKey ? 'text' : 'password'}
                                value={keyValue}
                                onChange={e => setKeyValue(e.target.value)}
                                placeholder={
                                  provider.id === 'openai'
                                    ? 'sk-...'
                                    : provider.id === 'claude'
                                    ? 'sk-ant-...'
                                    : 'AI...'
                                }
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {showKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => handleSaveKey(provider.id)}
                              disabled={savingKey || !keyValue.trim()}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                              {savingKey ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Editor Preferences */}
              <section className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Edit3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Editor Preferences</h2>
                      <p className="text-sm text-gray-400">
                        Customize your editing experience
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Editor Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Default Editor Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {EDITOR_MODES.map(mode => (
                        <button
                          key={mode.id}
                          onClick={() =>
                            setSelectedEditorMode(mode.id as 'rich' | 'raw' | 'split')
                          }
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedEditorMode === mode.id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="font-medium text-white">{mode.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default GitHub Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default GitHub Username
                    </label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={e => setGithubUsername(e.target.value)}
                      placeholder="your-username"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Pre-fill GitHub username when deploying books
                    </p>
                  </div>
                </div>
              </section>

              {/* Theme */}
              <section className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Palette className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Appearance</h2>
                      <p className="text-sm text-gray-400">Choose your theme preference</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {THEMES.map(themeOption => (
                      <button
                        key={themeOption.id}
                        onClick={() =>
                          setSelectedTheme(themeOption.id as 'light' | 'dark' | 'system')
                        }
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedTheme === themeOption.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-white">{themeOption.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {themeOption.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Account Info */}
              <section className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl font-semibold text-purple-400">
                      {user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{user?.email}</div>
                    <div className="text-sm text-gray-400">
                      Signed in since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
