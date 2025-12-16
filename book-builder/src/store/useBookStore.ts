import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WizardStep,
  AIConfig,
  BookConfig,
  AIProvider,
  AIModel,
  Chapter,
  ChapterInputMode,
  MystFeature,
  MYST_FEATURES,
  BookLevelFeature,
  ProviderConfig,
} from '@/types';
import { BOOK_LEVEL_FEATURES } from '@/data/bookLevelFeatures';

// Session storage helpers for API keys (secure - clears when tab closes, but persists across refreshes)
const API_KEY_SESSION_PREFIX = 'book-builder-api-key-';

const getSessionApiKey = (provider?: AIProvider | null): string => {
  if (typeof window === 'undefined') return '';
  try {
    if (provider) {
      return sessionStorage.getItem(`${API_KEY_SESSION_PREFIX}${provider}`) || '';
    }
    // Legacy fallback for old single key
    return sessionStorage.getItem('book-builder-api-key') || '';
  } catch {
    return '';
  }
};

const setSessionApiKey = (key: string, provider?: AIProvider | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (provider) {
      if (key) {
        sessionStorage.setItem(`${API_KEY_SESSION_PREFIX}${provider}`, key);
      } else {
        sessionStorage.removeItem(`${API_KEY_SESSION_PREFIX}${provider}`);
      }
    } else {
      // Legacy single key support
      if (key) {
        sessionStorage.setItem('book-builder-api-key', key);
      } else {
        sessionStorage.removeItem('book-builder-api-key');
      }
    }
  } catch {
    // Ignore storage errors
  }
};

const getAllSessionApiKeys = (): Partial<Record<AIProvider, string>> => {
  if (typeof window === 'undefined') return {};
  const keys: Partial<Record<AIProvider, string>> = {};
  const providers: AIProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];
  try {
    for (const provider of providers) {
      const key = sessionStorage.getItem(`${API_KEY_SESSION_PREFIX}${provider}`);
      if (key) {
        keys[provider] = key;
      }
    }
  } catch {
    // Ignore errors
  }
  return keys;
};

const clearAllSessionApiKeys = (): void => {
  if (typeof window === 'undefined') return;
  const providers: AIProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];
  try {
    for (const provider of providers) {
      sessionStorage.removeItem(`${API_KEY_SESSION_PREFIX}${provider}`);
    }
    sessionStorage.removeItem('book-builder-api-key');
  } catch {
    // Ignore errors
  }
};

interface BookStore {
  // Wizard State
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;

  // AI Configuration
  aiConfig: AIConfig;
  setAIProvider: (provider: AIProvider) => void;
  setAIApiKey: (key: string) => void;
  setSelectedModel: (modelId: string) => void;
  setAvailableModels: (models: AIModel[]) => void;
  clearAIConfig: () => void;

  // Multi-provider support
  setProviderConfig: (provider: AIProvider, config: Partial<ProviderConfig>) => void;
  getProviderConfig: (provider: AIProvider) => ProviderConfig | undefined;
  configureProvider: (provider: AIProvider, apiKey: string) => void;

  // Book Configuration
  bookConfig: BookConfig;
  setBookTitle: (title: string) => void;
  setBookDescription: (description: string) => void;
  setBookAuthor: (author: string) => void;
  setTableOfContents: (chapters: Chapter[]) => void;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  updateChapterContent: (chapterId: string, content: string) => void;
  addChapter: (chapter: Chapter, parentId?: string) => void;
  removeChapter: (chapterId: string) => void;
  setFeatures: (features: MystFeature[]) => void;
  toggleFeature: (featureId: string) => void;
  setBookFeatures: (features: BookLevelFeature[]) => void;
  toggleBookFeature: (featureId: string) => void;

  // Chapter Reordering
  moveChapterUp: (chapterId: string, parentId?: string) => void;
  moveChapterDown: (chapterId: string, parentId?: string) => void;
  reorderChapters: (chapters: Chapter[], parentId?: string) => void;

  // Chapter Enhanced Properties
  updateChapterSystemPrompt: (chapterId: string, systemPrompt: string) => void;
  updateChapterProvider: (chapterId: string, provider: AIProvider | undefined) => void;
  updateChapterModel: (chapterId: string, modelId: string) => void;
  updateChapterFeatures: (chapterId: string, featureIds: string[]) => void;
  toggleChapterFeature: (chapterId: string, featureId: string) => void;
  updateChapterInputMode: (chapterId: string, mode: ChapterInputMode) => void;
  updateChapterWordCount: (chapterId: string, wordCount: number) => void;

  // GitHub Configuration
  setGitHubConfig: (config: { username: string; repoName: string; token?: string }) => void;
  generatedRepoUrl: string | null;
  setGeneratedRepoUrl: (url: string) => void;
  deployedUrl: string | null;
  setDeployedUrl: (url: string) => void;

  // Reset
  resetStore: () => void;
}

const initialAIConfig: AIConfig = {
  provider: null,
  apiKey: '',
  selectedModel: null,
  availableModels: [],
  providers: {},
};

const initialBookConfig: BookConfig = {
  title: '',
  description: '',
  author: '',
  github: undefined,
  features: MYST_FEATURES,
  bookFeatures: BOOK_LEVEL_FEATURES,
  tableOfContents: { chapters: [] },
};

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      // Wizard State
      currentStep: 'ai-setup',
      setCurrentStep: (step) => set({ currentStep: step }),

      // AI Configuration
      aiConfig: initialAIConfig,
      setAIProvider: (provider) =>
        set((state) => ({
          aiConfig: {
            ...state.aiConfig,
            provider,
            selectedModel: null,
            availableModels: [],
          },
        })),
      setAIApiKey: (apiKey) => {
        const state = get();
        const provider = state.aiConfig.provider;

        // Persist to sessionStorage (both legacy and provider-specific)
        setSessionApiKey(apiKey);
        if (provider) {
          setSessionApiKey(apiKey, provider);
        }

        set((state) => {
          const updates: Partial<AIConfig> = { apiKey };

          // Also update the provider config if provider is set
          if (provider) {
            const existingProviderConfig = state.aiConfig.providers[provider] || {
              apiKey: '',
              selectedModel: null,
              availableModels: [],
              isConfigured: false,
            };
            updates.providers = {
              ...state.aiConfig.providers,
              [provider]: {
                ...existingProviderConfig,
                apiKey,
                isConfigured: !!apiKey,
              },
            };
          }

          return {
            aiConfig: { ...state.aiConfig, ...updates },
          };
        });
      },
      setSelectedModel: (modelId) =>
        set((state) => ({
          aiConfig: { ...state.aiConfig, selectedModel: modelId },
        })),
      setAvailableModels: (models) =>
        set((state) => ({
          aiConfig: { ...state.aiConfig, availableModels: models },
        })),
      clearAIConfig: () => {
        clearAllSessionApiKeys(); // Clear all provider keys from sessionStorage
        set({ aiConfig: initialAIConfig });
      },

      // Multi-provider support
      setProviderConfig: (provider, config) =>
        set((state) => {
          const existingConfig = state.aiConfig.providers[provider] || {
            apiKey: '',
            selectedModel: null,
            availableModels: [],
            isConfigured: false,
          };
          const newConfig = { ...existingConfig, ...config };

          // If apiKey is being updated, save to sessionStorage
          if (config.apiKey !== undefined) {
            setSessionApiKey(config.apiKey, provider);
            newConfig.isConfigured = !!config.apiKey;
          }

          return {
            aiConfig: {
              ...state.aiConfig,
              providers: {
                ...state.aiConfig.providers,
                [provider]: newConfig,
              },
            },
          };
        }),

      getProviderConfig: (provider) => {
        const state = get();
        return state.aiConfig.providers[provider];
      },

      configureProvider: (provider, apiKey) => {
        const { setProviderConfig } = get();
        setProviderConfig(provider, {
          apiKey,
          isConfigured: !!apiKey,
        });
      },

      // Book Configuration
      bookConfig: initialBookConfig,
      setBookTitle: (title) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, title },
        })),
      setBookDescription: (description) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, description },
        })),
      setBookAuthor: (author) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, author },
        })),
      setTableOfContents: (chapters) =>
        set((state) => ({
          bookConfig: {
            ...state.bookConfig,
            tableOfContents: { chapters },
          },
        })),
      updateChapter: (chapterId, updates) =>
        set((state) => {
          const updateChapterInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, ...updates };
              }
              if (chapter.children) {
                return {
                  ...chapter,
                  children: updateChapterInList(chapter.children),
                };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateChapterInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),
      updateChapterContent: (chapterId, content) =>
        set((state) => {
          const updateContentInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, content };
              }
              if (chapter.children) {
                return {
                  ...chapter,
                  children: updateContentInList(chapter.children),
                };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateContentInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),
      addChapter: (chapter, parentId) =>
        set((state) => {
          if (!parentId) {
            return {
              bookConfig: {
                ...state.bookConfig,
                tableOfContents: {
                  chapters: [...state.bookConfig.tableOfContents.chapters, chapter],
                },
              },
            };
          }
          const addToParent = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((ch) => {
              if (ch.id === parentId) {
                return {
                  ...ch,
                  children: [...(ch.children || []), chapter],
                };
              }
              if (ch.children) {
                return { ...ch, children: addToParent(ch.children) };
              }
              return ch;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: addToParent(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),
      removeChapter: (chapterId) =>
        set((state) => {
          const removeFromList = (chapters: Chapter[]): Chapter[] => {
            return chapters
              .filter((ch) => ch.id !== chapterId)
              .map((ch) => ({
                ...ch,
                children: ch.children ? removeFromList(ch.children) : undefined,
              }));
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: removeFromList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),
      setFeatures: (features) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, features },
        })),
      toggleFeature: (featureId) =>
        set((state) => ({
          bookConfig: {
            ...state.bookConfig,
            features: state.bookConfig.features.map((f) =>
              f.id === featureId ? { ...f, enabled: !f.enabled } : f
            ),
          },
        })),
      setBookFeatures: (features) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, bookFeatures: features },
        })),
      toggleBookFeature: (featureId) =>
        set((state) => ({
          bookConfig: {
            ...state.bookConfig,
            bookFeatures: (state.bookConfig.bookFeatures || BOOK_LEVEL_FEATURES).map((f) =>
              f.id === featureId ? { ...f, enabled: !f.enabled } : f
            ),
          },
        })),

      // Chapter Reordering
      moveChapterUp: (chapterId, parentId) =>
        set((state) => {
          const moveUp = (chapters: Chapter[]): Chapter[] => {
            const index = chapters.findIndex((ch) => ch.id === chapterId);
            if (index > 0) {
              const newChapters = [...chapters];
              [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
              return newChapters;
            }
            return chapters.map((ch) => ({
              ...ch,
              children: ch.children ? moveUp(ch.children) : undefined,
            }));
          };

          if (parentId) {
            const moveInParent = (chapters: Chapter[]): Chapter[] => {
              return chapters.map((ch) => {
                if (ch.id === parentId && ch.children) {
                  return { ...ch, children: moveUp(ch.children) };
                }
                if (ch.children) {
                  return { ...ch, children: moveInParent(ch.children) };
                }
                return ch;
              });
            };
            return {
              bookConfig: {
                ...state.bookConfig,
                tableOfContents: {
                  chapters: moveInParent(state.bookConfig.tableOfContents.chapters),
                },
              },
            };
          }

          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: moveUp(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      moveChapterDown: (chapterId, parentId) =>
        set((state) => {
          const moveDown = (chapters: Chapter[]): Chapter[] => {
            const index = chapters.findIndex((ch) => ch.id === chapterId);
            if (index >= 0 && index < chapters.length - 1) {
              const newChapters = [...chapters];
              [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
              return newChapters;
            }
            return chapters.map((ch) => ({
              ...ch,
              children: ch.children ? moveDown(ch.children) : undefined,
            }));
          };

          if (parentId) {
            const moveInParent = (chapters: Chapter[]): Chapter[] => {
              return chapters.map((ch) => {
                if (ch.id === parentId && ch.children) {
                  return { ...ch, children: moveDown(ch.children) };
                }
                if (ch.children) {
                  return { ...ch, children: moveInParent(ch.children) };
                }
                return ch;
              });
            };
            return {
              bookConfig: {
                ...state.bookConfig,
                tableOfContents: {
                  chapters: moveInParent(state.bookConfig.tableOfContents.chapters),
                },
              },
            };
          }

          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: moveDown(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      reorderChapters: (newChapters, parentId) =>
        set((state) => {
          if (!parentId) {
            return {
              bookConfig: {
                ...state.bookConfig,
                tableOfContents: { chapters: newChapters },
              },
            };
          }

          const reorderInParent = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((ch) => {
              if (ch.id === parentId) {
                return { ...ch, children: newChapters };
              }
              if (ch.children) {
                return { ...ch, children: reorderInParent(ch.children) };
              }
              return ch;
            });
          };

          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: reorderInParent(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      // Chapter Enhanced Properties
      updateChapterSystemPrompt: (chapterId, systemPrompt) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, systemPrompt };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      updateChapterProvider: (chapterId, provider) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, selectedProvider: provider };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      updateChapterModel: (chapterId, modelId) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, selectedModel: modelId };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      updateChapterFeatures: (chapterId, featureIds) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, selectedFeatures: featureIds };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      toggleChapterFeature: (chapterId, featureId) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                const currentFeatures = chapter.selectedFeatures || [];
                const hasFeature = currentFeatures.includes(featureId);
                return {
                  ...chapter,
                  selectedFeatures: hasFeature
                    ? currentFeatures.filter((id) => id !== featureId)
                    : [...currentFeatures, featureId],
                };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      updateChapterInputMode: (chapterId, mode) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, inputMode: mode };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      updateChapterWordCount: (chapterId, wordCount) =>
        set((state) => {
          const updateInList = (chapters: Chapter[]): Chapter[] => {
            return chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, targetWordCount: wordCount };
              }
              if (chapter.children) {
                return { ...chapter, children: updateInList(chapter.children) };
              }
              return chapter;
            });
          };
          return {
            bookConfig: {
              ...state.bookConfig,
              tableOfContents: {
                chapters: updateInList(state.bookConfig.tableOfContents.chapters),
              },
            },
          };
        }),

      // GitHub Configuration
      setGitHubConfig: (config) =>
        set((state) => ({
          bookConfig: { ...state.bookConfig, github: config },
        })),
      generatedRepoUrl: null,
      setGeneratedRepoUrl: (url) => set({ generatedRepoUrl: url }),
      deployedUrl: null,
      setDeployedUrl: (url) => set({ deployedUrl: url }),

      // Reset
      resetStore: () =>
        set({
          currentStep: 'ai-setup',
          aiConfig: initialAIConfig,
          bookConfig: initialBookConfig,
          generatedRepoUrl: null,
          deployedUrl: null,
        }),
    }),
    {
      name: 'book-builder-storage',
      partialize: (state) => {
        // Persist provider settings without API keys
        const persistedProviders: Partial<Record<AIProvider, Omit<ProviderConfig, 'apiKey'>>> = {};
        const providers: AIProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];
        for (const provider of providers) {
          const config = state.aiConfig.providers[provider];
          if (config) {
            persistedProviders[provider] = {
              selectedModel: config.selectedModel,
              availableModels: [], // Don't persist models - they need to be fetched fresh
              isConfigured: config.isConfigured,
            };
          }
        }

        return {
          currentStep: state.currentStep,
          aiConfig: {
            provider: state.aiConfig.provider,
            selectedModel: state.aiConfig.selectedModel,
            providers: persistedProviders,
            // Don't persist API keys for security
          },
          bookConfig: state.bookConfig,
          generatedRepoUrl: state.generatedRepoUrl,
          deployedUrl: state.deployedUrl,
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<BookStore>;

        // Restore provider API keys from sessionStorage
        const sessionKeys = getAllSessionApiKeys();
        const providers: AIProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];
        const restoredProviders: Partial<Record<AIProvider, ProviderConfig>> = {};

        for (const provider of providers) {
          const persistedConfig = (persisted.aiConfig as Partial<AIConfig>)?.providers?.[provider];
          const sessionKey = sessionKeys[provider];

          if (persistedConfig || sessionKey) {
            restoredProviders[provider] = {
              apiKey: sessionKey || '',
              selectedModel: persistedConfig?.selectedModel || null,
              availableModels: [], // Reset models - they need to be fetched fresh
              isConfigured: !!sessionKey,
            };
          }
        }

        // Determine the current provider's API key for backward compatibility
        const currentProvider = (persisted.aiConfig as Partial<AIConfig>)?.provider;
        const legacyApiKey = getSessionApiKey(); // Legacy single key
        const currentApiKey = currentProvider
          ? sessionKeys[currentProvider] || legacyApiKey
          : legacyApiKey;

        return {
          ...currentState,
          ...persisted,
          // Ensure aiConfig always has all required fields with defaults
          aiConfig: {
            ...initialAIConfig,
            ...persisted.aiConfig,
            apiKey: currentApiKey, // Restore from sessionStorage
            availableModels: [], // Reset models - they need to be fetched fresh
            providers: restoredProviders,
          },
          // Ensure bookConfig has all required fields with defaults
          bookConfig: {
            ...initialBookConfig,
            ...persisted.bookConfig,
            // Always ensure bookFeatures is initialized from defaults if missing
            bookFeatures: persisted.bookConfig?.bookFeatures?.length
              ? persisted.bookConfig.bookFeatures
              : BOOK_LEVEL_FEATURES,
            // Always ensure features is initialized from defaults if missing
            features: persisted.bookConfig?.features?.length
              ? persisted.bookConfig.features
              : MYST_FEATURES,
          },
        };
      },
    }
  )
);
