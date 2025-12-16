// AI Provider Types
export type AIProvider = 'claude' | 'openai' | 'gemini' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

// Per-provider configuration
export interface ProviderConfig {
  apiKey: string;
  selectedModel: string | null;
  availableModels: AIModel[];
  isConfigured: boolean;
}

// Multi-provider AI configuration
export interface AIConfig {
  // Current/default provider for the wizard flow
  provider: AIProvider | null;
  apiKey: string;
  selectedModel: string | null;
  availableModels: AIModel[];
  // Multi-provider support - stores config for each provider
  providers: Partial<Record<AIProvider, ProviderConfig>>;
}

// Book Types
export type ChapterInputMode = 'ai-generate' | 'manual-write';

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  children?: Chapter[];
  // Enhanced chapter properties
  systemPrompt?: string;           // Custom system prompt for AI generation
  selectedProvider?: AIProvider;   // AI provider to use for this chapter
  selectedModel?: string;          // AI model ID to use for this chapter
  selectedFeatures?: string[];     // Array of MyST feature IDs to include
  inputMode?: ChapterInputMode;    // Content input mode
  order?: number;                  // Order index for sorting
  targetWordCount?: number;        // Target word count for AI generation
}

export interface TableOfContents {
  chapters: Chapter[];
}

// MyST Features
export interface MystFeature {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'interactive' | 'export' | 'styling';
  enabled: boolean;
  configKey?: string;
  configValue?: unknown;
}

export const MYST_FEATURES: MystFeature[] = [
  // Content Features
  {
    id: 'admonitions',
    name: 'Admonitions',
    description: 'Callout boxes for notes, warnings, tips, and more',
    category: 'content',
    enabled: true,
  },
  {
    id: 'figures',
    name: 'Figures & Images',
    description: 'Enhanced figure support with captions and cross-references',
    category: 'content',
    enabled: true,
  },
  {
    id: 'math',
    name: 'Math & Equations',
    description: 'LaTeX math support with equation numbering',
    category: 'content',
    enabled: true,
  },
  {
    id: 'citations',
    name: 'Citations & References',
    description: 'Academic citations with BibTeX support',
    category: 'content',
    enabled: false,
  },
  {
    id: 'tables',
    name: 'Enhanced Tables',
    description: 'Tables with captions and cross-references',
    category: 'content',
    enabled: true,
  },
  {
    id: 'code-blocks',
    name: 'Syntax Highlighted Code',
    description: 'Code blocks with syntax highlighting and line numbers',
    category: 'content',
    enabled: true,
  },
  // Interactive Features
  {
    id: 'jupyter-execution',
    name: 'In-Page Code Execution',
    description: 'Run Python code directly in the browser with Thebe/JupyterLite',
    category: 'interactive',
    enabled: false,
    configKey: 'jupyter',
    configValue: { lite: true },
  },
  {
    id: 'pyodide-cells',
    name: 'Pyodide Code Cells',
    description: 'Executable Python cells using WebAssembly - no server required',
    category: 'interactive',
    enabled: false,
    configKey: 'jupyter.pyodide',
    configValue: { enabled: true },
  },
  {
    id: 'binder',
    name: 'Binder Integration',
    description: 'Connect to Binder for live Jupyter notebooks',
    category: 'interactive',
    enabled: false,
    configKey: 'jupyter',
    configValue: { binder: true },
  },
  {
    id: 'colab-cells',
    name: 'Google Colab Cells',
    description: 'Link code cells to open and run in Google Colab',
    category: 'interactive',
    enabled: false,
    configKey: 'jupyter.colab',
    configValue: { enabled: true },
  },
  {
    id: 'interactive-outputs',
    name: 'Interactive Outputs',
    description: 'Support for interactive plots (Plotly, Bokeh, Altair)',
    category: 'interactive',
    enabled: false,
    configKey: 'jupyter.interactive',
    configValue: { plotly: true, bokeh: true, altair: true },
  },
  {
    id: 'tabs',
    name: 'Tabs & Tab Sets',
    description: 'Tabbed content panels for organizing information',
    category: 'interactive',
    enabled: true,
  },
  {
    id: 'dropdowns',
    name: 'Dropdowns & Accordions',
    description: 'Collapsible content sections',
    category: 'interactive',
    enabled: true,
  },
  {
    id: 'cards',
    name: 'Cards & Grids',
    description: 'Card layouts for showcasing content',
    category: 'interactive',
    enabled: true,
  },
  {
    id: 'exercises',
    name: 'Exercises & Solutions',
    description: 'Interactive exercises with hidden solutions that readers can reveal',
    category: 'interactive',
    enabled: false,
  },
  {
    id: 'quizzes',
    name: 'Interactive Quizzes',
    description: 'Multiple choice and fill-in-the-blank quizzes with feedback',
    category: 'interactive',
    enabled: false,
  },
  // Export Features
  {
    id: 'pdf-export',
    name: 'PDF Export',
    description: 'Export to PDF with LaTeX templates',
    category: 'export',
    enabled: false,
  },
  {
    id: 'word-export',
    name: 'Word Export',
    description: 'Export to Microsoft Word format',
    category: 'export',
    enabled: false,
  },
  // Styling Features
  {
    id: 'dark-mode',
    name: 'Dark Mode Support',
    description: 'Automatic dark mode theme switching',
    category: 'styling',
    enabled: true,
  },
  {
    id: 'custom-css',
    name: 'Custom CSS',
    description: 'Add custom styles to your book',
    category: 'styling',
    enabled: false,
  },
];

// Book-Level Feature
export type BookLevelFeatureCategory =
  | 'front-matter'
  | 'back-matter'
  | 'export'
  | 'navigation'
  | 'interactivity'
  | 'analytics'
  | 'search'
  | 'accessibility'
  | 'versioning';

export interface BookLevelFeature {
  id: string;
  name: string;
  description: string;
  category: BookLevelFeatureCategory;
  enabled: boolean;
  configKey?: string;
  configValue?: unknown;
}

// Book Configuration
export interface BookConfig {
  title: string;
  description: string;
  author: string;
  coverImage?: string;  // URL to book cover image
  github?: {
    username: string;
    repoName: string;
    token?: string;
  };
  features: MystFeature[];
  bookFeatures?: BookLevelFeature[];
  tableOfContents: TableOfContents;
}

// Wizard State
export type WizardStep =
  | 'ai-setup'
  | 'book-description'
  | 'toc-generation'
  | 'feature-selection'
  | 'github-setup'
  | 'generate-book'
  | 'chapter-editor';

export interface WizardState {
  currentStep: WizardStep;
  aiConfig: AIConfig;
  bookConfig: BookConfig;
  generatedRepoUrl?: string;
  deployedUrl?: string;
}

// GitHub Types
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

// API Response Types
export interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ModelsResponse {
  models: AIModel[];
  error?: string;
}

export interface GenerationResponse {
  content: string;
  error?: string;
}
