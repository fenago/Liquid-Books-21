'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { MystFeature, BookLevelFeatureCategory } from '@/types';
import { BOOK_LEVEL_FEATURES, BOOK_FEATURE_CATEGORIES } from '@/data/bookLevelFeatures';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Zap,
  Download,
  Palette,
  Check,
  Book,
  BookOpen,
  BookMarked,
  Navigation,
  BarChart3,
  Search,
  Eye,
  GitBranch,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const CATEGORY_INFO = {
  content: {
    icon: <FileText className="h-5 w-5" />,
    title: 'Content Features',
    description: 'Enhance your written content with rich formatting options',
  },
  interactive: {
    icon: <Zap className="h-5 w-5" />,
    title: 'Interactive Features',
    description: 'Add interactivity and live code execution',
  },
  export: {
    icon: <Download className="h-5 w-5" />,
    title: 'Export Options',
    description: 'Additional export formats for your book',
  },
  styling: {
    icon: <Palette className="h-5 w-5" />,
    title: 'Styling & Theming',
    description: 'Customize the look and feel of your book',
  },
};

const BOOK_CATEGORY_ICONS: Record<BookLevelFeatureCategory, React.ReactNode> = {
  'front-matter': <BookOpen className="h-5 w-5" />,
  'back-matter': <BookMarked className="h-5 w-5" />,
  export: <Download className="h-5 w-5" />,
  navigation: <Navigation className="h-5 w-5" />,
  interactivity: <Zap className="h-5 w-5" />,
  analytics: <BarChart3 className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  accessibility: <Eye className="h-5 w-5" />,
  versioning: <GitBranch className="h-5 w-5" />,
};

type TabType = 'chapter' | 'book';

export function FeatureSelectionStep() {
  const { bookConfig, toggleFeature, toggleBookFeature, setCurrentStep, syncChapterFeatures } = useBookStore();
  const [activeTab, setActiveTab] = useState<TabType>('book');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['front-matter', 'back-matter', 'export', 'navigation', 'content', 'interactive']));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const featuresByCategory = bookConfig.features.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, MystFeature[]>
  );

  const bookFeaturesByCategory = (bookConfig.bookFeatures || BOOK_LEVEL_FEATURES).reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, typeof BOOK_LEVEL_FEATURES>
  );

  const handleBack = () => {
    setCurrentStep('toc-generation');
  };

  const handleContinue = () => {
    // Sync enabled chapter features to all chapters before proceeding
    syncChapterFeatures();
    setCurrentStep('github-setup');
  };

  const enabledChapterCount = bookConfig.features.filter((f) => f.enabled).length;
  const enabledBookCount = (bookConfig.bookFeatures || []).filter((f) => f.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure book-wide settings and chapter content features for your publication.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('book')}
          className={`
            flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2
            ${activeTab === 'book'
              ? 'text-purple-700 dark:text-purple-300 border-purple-600 bg-purple-50 dark:bg-purple-900/10'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
            }
          `}
        >
          <Book className="h-4 w-4" />
          Book Settings
          <span className={`
            px-2 py-0.5 text-xs rounded-full
            ${activeTab === 'book'
              ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}>
            {enabledBookCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('chapter')}
          className={`
            flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2
            ${activeTab === 'chapter'
              ? 'text-blue-700 dark:text-blue-300 border-blue-600 bg-blue-50 dark:bg-blue-900/10'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
            }
          `}
        >
          <FileText className="h-4 w-4" />
          Chapter Features
          <span className={`
            px-2 py-0.5 text-xs rounded-full
            ${activeTab === 'chapter'
              ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}>
            {enabledChapterCount}
          </span>
        </button>
      </div>

      {/* Book Settings Tab */}
      {activeTab === 'book' && (
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Book className="h-5 w-5" />
              Book-Wide Settings
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-400">
              These settings apply to your entire book. Features like PDF download, search, navigation,
              and accessibility options are configured here.
            </p>
          </div>

          {(Object.keys(BOOK_FEATURE_CATEGORIES) as BookLevelFeatureCategory[]).map(category => {
            const categoryInfo = BOOK_FEATURE_CATEGORIES[category];
            const features = bookFeaturesByCategory[category] || [];
            const isExpanded = expandedCategories.has(category);
            const enabledInCategory = features.filter(f => f.enabled).length;

            return (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-purple-600 dark:text-purple-400 shadow-sm">
                      {BOOK_CATEGORY_ICONS[category]}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {categoryInfo.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {enabledInCategory}/{features.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-gray-800/50">
                    {features.map(feature => (
                      <button
                        key={feature.id}
                        onClick={() => toggleBookFeature(feature.id)}
                        className={`
                          flex items-start gap-3 p-4 rounded-lg border-2 text-left
                          transition-all
                          ${
                            feature.enabled
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div
                          className={`
                            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                            transition-colors mt-0.5
                            ${
                              feature.enabled
                                ? 'bg-purple-500 border-purple-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {feature.enabled && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Features Tab */}
      {activeTab === 'chapter' && (
        <div className="space-y-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chapter Content Features
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              These features enhance the content within your chapters. Enable MyST Markdown
              directives like admonitions, code blocks, math equations, and interactive elements.
            </p>
          </div>

          {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map(
            (category) => {
              const info = CATEGORY_INFO[category];
              const features = featuresByCategory[category] || [];

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {info.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {info.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {features.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        className={`
                          flex items-start gap-3 p-4 rounded-lg border-2 text-left
                          transition-all
                          ${
                            feature.enabled
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div
                          className={`
                            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                            transition-colors
                            ${
                              feature.enabled
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {feature.enabled && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
          )}

          {/* Recommended Features Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2">
              Recommended for Technical Books:
            </h4>
            <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
              <li>• <strong>Math & Equations</strong> - For formulas and mathematical notation</li>
              <li>• <strong>Syntax Highlighted Code</strong> - Essential for code examples</li>
              <li>• <strong>In-Page Code Execution</strong> - Let readers run code directly in the browser</li>
              <li>• <strong>Tabs</strong> - Show code in multiple languages side by side</li>
              <li>• <strong>Admonitions</strong> - Highlight important notes and warnings</li>
            </ul>
          </div>
        </div>
      )}

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
          className="
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            bg-blue-600 hover:bg-blue-700 text-white transition-colors
          "
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
