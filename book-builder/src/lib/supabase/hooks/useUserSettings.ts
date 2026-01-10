'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../client';
import { useAuth } from '@/hooks/useAuth';

export interface UserSettings {
  id: string;
  user_id: string;
  default_provider: 'openai' | 'claude' | 'gemini';
  default_model: string;
  theme: 'light' | 'dark' | 'system';
  editor_mode: 'rich' | 'raw' | 'split';
  default_github_username: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  default_provider: 'gemini',
  default_model: 'gemini-3-flash-preview', // Gemini 3.0 Flash
  theme: 'dark',
  editor_mode: 'rich',
  default_github_username: null,
};

export function useUserSettings() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();

      const { data, error: fetchError } = await supabase
        .from('lq21_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newSettings, error: insertError } = await supabase
            .from('lq21_user_settings')
            .insert({
              user_id: user.id,
              ...DEFAULT_SETTINGS,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newSettings);
        } else {
          throw fetchError;
        }
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        const supabase = getSupabaseClient();

        const { data, error: updateError } = await supabase
          .from('lq21_user_settings')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setSettings(data);
        return data;
      } catch (err) {
        console.error('Error updating settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to update settings');
        throw err;
      }
    },
    [user]
  );

  // Set default model
  const setDefaultModel = useCallback(
    async (provider: 'openai' | 'claude' | 'gemini', model: string) => {
      return updateSettings({
        default_provider: provider,
        default_model: model,
      });
    },
    [updateSettings]
  );

  // Set theme
  const setTheme = useCallback(
    async (theme: 'light' | 'dark' | 'system') => {
      return updateSettings({ theme });
    },
    [updateSettings]
  );

  // Set editor mode
  const setEditorMode = useCallback(
    async (editor_mode: 'rich' | 'raw' | 'split') => {
      return updateSettings({ editor_mode });
    },
    [updateSettings]
  );

  // Set default GitHub username
  const setDefaultGitHubUsername = useCallback(
    async (username: string | null) => {
      return updateSettings({ default_github_username: username });
    },
    [updateSettings]
  );

  // Fetch settings on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated, fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    setDefaultModel,
    setTheme,
    setEditorMode,
    setDefaultGitHubUsername,
    refetch: fetchSettings,
    // Convenience getters with defaults
    defaultProvider: settings?.default_provider ?? DEFAULT_SETTINGS.default_provider,
    defaultModel: settings?.default_model ?? DEFAULT_SETTINGS.default_model,
    theme: settings?.theme ?? DEFAULT_SETTINGS.theme,
    editorMode: settings?.editor_mode ?? DEFAULT_SETTINGS.editor_mode,
    defaultGitHubUsername: settings?.default_github_username,
  };
}
