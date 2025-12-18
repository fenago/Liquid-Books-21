'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../client';
import { useAuth } from '../auth-context';

export type ApiKeyProvider = 'claude' | 'openai' | 'gemini' | 'github';

interface ApiKeyInfo {
  provider: ApiKeyProvider;
  hasKey: boolean;
  keyHint: string | null;
  isValid: boolean;
  lastUsed: string | null;
}

interface ApiKeyDbRow {
  provider: string;
  key_hint: string | null;
  is_valid: boolean;
  last_used_at: string | null;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('lq21_api_keys')
      .select('provider, key_hint, is_valid, last_used_at')
      .eq('user_id', user.id);

    if (fetchError) {
      setError(fetchError.message);
      setApiKeys([]);
    } else {
      // Create a map of existing keys
      const rows = (data || []) as ApiKeyDbRow[];
      const keyMap = new Map(
        rows.map((k) => [k.provider, k])
      );

      // Return info for all providers
      const allProviders: ApiKeyProvider[] = ['claude', 'openai', 'gemini', 'github'];
      const keys = allProviders.map((provider) => {
        const existing = keyMap.get(provider) as ApiKeyDbRow | undefined;
        return {
          provider,
          hasKey: !!existing,
          keyHint: existing?.key_hint ?? null,
          isValid: existing?.is_valid ?? false,
          lastUsed: existing?.last_used_at ?? null,
        };
      });

      setApiKeys(keys);
    }

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const saveApiKey = async (
    provider: ApiKeyProvider,
    apiKey: string
  ): Promise<boolean> => {
    if (!user || !apiKey) return false;

    // Create hint from last 4 characters
    const keyHint = `...${apiKey.slice(-4)}`;

    // For now, we store the key directly (in production, use encryption)
    // The encrypted_key field stores the actual key
    const { error } = await supabase
      .from('lq21_api_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: apiKey, // In production, encrypt this
          key_hint: keyHint,
          is_valid: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      );

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchApiKeys();
    return true;
  };

  const deleteApiKey = async (provider: ApiKeyProvider): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('lq21_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchApiKeys();
    return true;
  };

  const getApiKey = async (provider: ApiKeyProvider): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('lq21_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return null;
    }

    // Update last used timestamp
    await supabase
      .from('lq21_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('provider', provider);

    return data.encrypted_key;
  };

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    saveApiKey,
    deleteApiKey,
    getApiKey,
  };
}
