'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { Chapter, AIProvider, BookLevelFeature, BookLevelFeatureCategory } from '@/types';
import { MYST_FEATURES_DATA, getFeaturesByCategory, MystFeatureCategory } from '@/data/mystFeatures';
import { BOOK_LEVEL_FEATURES } from '@/data/bookLevelFeatures';
import { MystPreview } from '@/components/MystPreview';
import { ForwardRefEditor, type MDXEditorMethods } from '@/components/editor/ForwardRefEditor';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  Loader2,
  Save,
  Check,
  CheckCircle,
  RefreshCw,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Settings,
  Layers,
  X,
  GripVertical,
  Wand2,
  Pencil,
  MessageSquare,
  BarChart3,
  BookOpen,
  Hash,
  Info,
  Play,
  ExternalLink,
  AlertTriangle,
  Image,
  Maximize2,
  Minimize2,
} from 'lucide-react';

type EditorTab = 'ai-generate' | 'manual-write';
type ModalType = 'none' | 'features' | 'book-features' | 'system-prompt' | 'add-chapter' | 'analytics' | 'cover-image';

interface ChapterRowProps {
  chapter: Chapter;
  depth: number;
  index: number;
  totalSiblings: number;
  parentId?: string;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: (chapter: Chapter) => void;
  onToggleExpand: (id: string) => void;
  onMoveUp: (id: string, parentId?: string) => void;
  onMoveDown: (id: string, parentId?: string) => void;
  onDelete: (id: string) => void;
  onAddSubChapter: (parentId: string) => void;
  onOpenFeatures: (chapter: Chapter) => void;
  onOpenSystemPrompt: (chapter: Chapter) => void;
}

function ChapterRow({
  chapter,
  depth,
  index,
  totalSiblings,
  parentId,
  isExpanded,
  isSelected,
  onSelect,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddSubChapter,
  onOpenFeatures,
  onOpenSystemPrompt,
}: ChapterRowProps) {
  const hasChildren = chapter.children && chapter.children.length > 0;
  const hasContent = !!chapter.content;
  const hasFeatures = chapter.selectedFeatures && chapter.selectedFeatures.length > 0;
  const hasSystemPrompt = !!chapter.systemPrompt;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
        transition-colors
      `}
      style={{ paddingLeft: `${12 + depth * 24}px` }}
    >
      {/* Drag Handle */}
      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab flex-shrink-0" />

      {/* Expand/Collapse */}
      {hasChildren ? (
        <button
          onClick={() => onToggleExpand(chapter.id)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>
      ) : (
        <div className="w-6" />
      )}

      {/* Chapter Icon & Title */}
      <button
        onClick={() => onSelect(chapter)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <FileText className={`h-4 w-4 flex-shrink-0 ${hasContent ? 'text-green-500' : 'text-gray-400'}`} />
        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {chapter.title}
        </span>
      </button>

      {/* Status Indicators */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {hasContent && (
          <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
            Content
          </span>
        )}
        {hasFeatures && (
          <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
            {chapter.selectedFeatures?.length} features
          </span>
        )}
        {hasSystemPrompt && (
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Move Up */}
        <button
          onClick={() => onMoveUp(chapter.id, parentId)}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <ChevronUp className="h-4 w-4 text-gray-500" />
        </button>

        {/* Move Down */}
        <button
          onClick={() => onMoveDown(chapter.id, parentId)}
          disabled={index === totalSiblings - 1}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {/* Features */}
        <button
          onClick={() => onOpenFeatures(chapter)}
          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
          title="Select features"
        >
          <Layers className="h-4 w-4 text-purple-500" />
        </button>

        {/* System Prompt */}
        <button
          onClick={() => onOpenSystemPrompt(chapter)}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
          title="Edit system prompt"
        >
          <Settings className="h-4 w-4 text-blue-500" />
        </button>

        {/* Add Sub-chapter */}
        <button
          onClick={() => onAddSubChapter(chapter.id)}
          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
          title="Add sub-chapter"
        >
          <Plus className="h-4 w-4 text-green-500" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(chapter.id)}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="Delete chapter"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export function ChapterEditorStep() {
  const {
    bookConfig,
    aiConfig,
    updateChapterContent,
    updateChapter,
    setCurrentStep,
    moveChapterUp,
    moveChapterDown,
    addChapter,
    removeChapter,
    updateChapterSystemPrompt,
    toggleChapterFeature,
    updateChapterFeatures,
    updateChapterInputMode,
    updateChapterWordCount,
    updateChapterModel,
    updateChapterProvider,
    setProviderConfig,
    getProviderConfig,
    setBookCoverImage,
    toggleBookFeature,
  } = useBookStore();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'verified' | 'unverified' | 'error'>('idle');
  const [saveDetails, setSaveDetails] = useState<{
    commitUrl?: string;
    fileUrl?: string;
    commitSha?: string;
    verified?: boolean;
    message?: string;
    error?: string;
    actionsUrl?: string;
    workflowTriggered?: boolean;
    workflowRunUrl?: string;
  } | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [editorTab, setEditorTab] = useState<EditorTab>('ai-generate');
  const [chapterDescription, setChapterDescription] = useState('');
  const [targetWordCount, setTargetWordCount] = useState<number>(2000);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [modalChapter, setModalChapter] = useState<Chapter | null>(null);
  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [showDefaultPrompt, setShowDefaultPrompt] = useState(false);
  const [tempSelectedModel, setTempSelectedModel] = useState<string | null>(null);
  const [tempSelectedProvider, setTempSelectedProvider] = useState<AIProvider | undefined>(undefined);
  const [tempProviderApiKey, setTempProviderApiKey] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [providerModels, setProviderModels] = useState<Array<{ id: string; name: string; provider: AIProvider }>>([]);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addChapterParentId, setAddChapterParentId] = useState<string | null>(null);
  const [tempCoverImageUrl, setTempCoverImageUrl] = useState('');
  const [generationMetadata, setGenerationMetadata] = useState<{
    stopReason?: string;
    inputTokens?: number;
    outputTokens?: number;
    wordCount?: number;
  } | null>(null);
  const [featureAudit, setFeatureAudit] = useState<{
    selectedFeatures: string[];
    foundFeatures: string[];
    missingFeatures: string[];
  } | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [continuationAttempts, setContinuationAttempts] = useState(0);
  const MAX_CONTINUATION_ATTEMPTS = 5; // Max times to auto-continue
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [isContentEditorFullscreen, setIsContentEditorFullscreen] = useState(false);
  const [useRawEditor, setUseRawEditor] = useState(false); // Fallback to textarea when MDXEditor fails

  // Build status polling
  const [buildStatus, setBuildStatus] = useState<'idle' | 'polling' | 'building' | 'success' | 'failed'>('idle');
  const [buildPollCount, setBuildPollCount] = useState(0);
  const MAX_BUILD_POLLS = 40; // 40 polls * 5 seconds = ~3 minutes max

  // MDXEditor ref for programmatic control
  const editorRef = useRef<MDXEditorMethods>(null);

  // Image upload hook for the editor
  // Use github repo name or sanitized book title as the book ID for image storage
  const bookId = bookConfig.github?.repoName || bookConfig.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'draft';
  const { uploadImage, isUploading: isUploadingImage, error: uploadError } = useImageUpload({
    bookId,
  });

  // Handle Escape key to close expanded editors
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isContentEditorFullscreen) {
          setIsContentEditorFullscreen(false);
        } else if (isEditorExpanded) {
          setIsEditorExpanded(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditorExpanded, isContentEditorFullscreen]);

  // Helper function to detect MyST-specific syntax that MDXEditor can't parse
  const hasMystSyntax = useCallback((content: string): boolean => {
    if (!content) return false;
    // MyST directive patterns that MDXEditor can't handle
    const mystPatterns = [
      /^:::\{/m,           // Admonitions like :::{note}, :::{warning}
      /^::::\{/m,          // Nested directives like ::::{tab-set}
      /^```\{/m,           // Code directives like ```{mermaid}, ```{code}
      /^\{[a-z-]+\}/m,     // Inline roles like {math}`x^2`
      /:::{[a-z-]+}/,      // Inline admonitions
      /:::$/m,             // Closing directive markers
    ];
    return mystPatterns.some(pattern => pattern.test(content));
  }, []);

  // Auto-detect MyST syntax and switch to Raw mode when needed
  useEffect(() => {
    if (editedContent && hasMystSyntax(editedContent) && !useRawEditor) {
      setUseRawEditor(true);
    }
  }, [editedContent, hasMystSyntax, useRawEditor]);

  // Helper function to update editor content (both state and MDXEditor ref)
  const updateEditorContent = useCallback((content: string) => {
    setEditedContent(content);
    // If content has MyST syntax, don't try to update MDXEditor (it will fail)
    if (hasMystSyntax(content)) {
      setUseRawEditor(true);
      return;
    }
    // MDXEditor is not fully controlled, so we need to use setMarkdown via ref
    // Use setTimeout to ensure the state update happens first
    setTimeout(() => {
      editorRef.current?.setMarkdown(content);
    }, 0);
  }, [hasMystSyntax]);

  // Initialize all chapters' features from book-level selections on mount
  useEffect(() => {
    // Map book-level features to MYST_FEATURES_DATA categories/IDs
    const featureMapping: Record<string, string[]> = {
      'admonitions': ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso', 'admonition-dropdown', 'admonition-custom'],
      'figures': ['figure', 'image'],
      'math': ['inline-math', 'equation-block', 'dollar-math', 'align-env', 'matrix'],
      'citations': ['citation', 'footnote'],
      'tables': ['table', 'list-table', 'csv-table', 'table-caption'],
      'code-blocks': ['code-block', 'code-caption', 'code-linenos', 'code-emphasize', 'literalinclude'],
      'tabs': ['tab-set'],
      'dropdowns': ['dropdown', 'admonition-dropdown'],
      'cards': ['card', 'card-link', 'grid'],
      'exercises': ['exercise', 'solution', 'exercise-dropdown'],
      'quizzes': ['quiz', 'mcq', 'fill-blank'],
      'jupyter-execution': ['jupyter-cell', 'output-cell', 'thebe-button'],
      'pyodide-cells': ['pyodide'],
      'binder': ['binder-link'],
      'colab-cells': ['colab'],
      'interactive-outputs': ['plotly', 'bokeh', 'altair'],
    };

    // Get enabled feature IDs from bookConfig.features
    const enabledBookFeatures = bookConfig.features
      .filter(f => f.enabled)
      .map(f => f.id);

    // Map to MYST_FEATURES_DATA feature IDs
    const defaultFeatures: string[] = [];
    for (const bookFeatureId of enabledBookFeatures) {
      const mappedFeatures = featureMapping[bookFeatureId];
      if (mappedFeatures) {
        defaultFeatures.push(...mappedFeatures);
      }
    }

    // Also add common features
    const commonFeatures = ['code-block', 'inline-math', 'mermaid-flowchart'];
    for (const feature of commonFeatures) {
      if (!defaultFeatures.includes(feature)) {
        defaultFeatures.push(feature);
      }
    }

    const uniqueFeatures = [...new Set(defaultFeatures)];

    // Helper to initialize features for a chapter and its children
    const initializeChapterFeatures = (chapters: Chapter[]) => {
      for (const chapter of chapters) {
        if (!chapter.selectedFeatures || chapter.selectedFeatures.length === 0) {
          updateChapterFeatures(chapter.id, uniqueFeatures);
        }
        if (chapter.children && chapter.children.length > 0) {
          initializeChapterFeatures(chapter.children);
        }
      }
    };

    if (uniqueFeatures.length > 0) {
      initializeChapterFeatures(bookConfig.tableOfContents.chapters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const toggleExpanded = useCallback((chapterId: string) => {
    setExpandedChapters(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(chapterId)) {
        newExpanded.delete(chapterId);
      } else {
        newExpanded.add(chapterId);
      }
      return newExpanded;
    });
  }, []);

  // Generate the default system prompt for a chapter
  const getDefaultSystemPrompt = useCallback((chapter: Chapter): string => {
    const wordCountRequirement = chapter.targetWordCount
      ? `\n\nCRITICAL WORD COUNT REQUIREMENT: You MUST write approximately ${chapter.targetWordCount} words. This is NON-NEGOTIABLE. Do NOT stop until you reach this target. Count your words as you write. If you finish the main topics before reaching the word count, add more examples, exercises, detailed explanations, and practical applications.`
      : '';

    return `You are an expert technical writer creating content for the book "${bookConfig.title}".

Book Description: ${bookConfig.description}

You are writing the chapter: "${chapter.title}"

CRITICAL INSTRUCTION: The chapter title defines ALL topics you MUST cover. If the title contains multiple topics (separated by "and", commas, or listed), you MUST write comprehensive sections for EACH topic. DO NOT stop after covering only the first topic.

For example:
- "Univariate, Bivariate, and Multivariate Analysis" = You MUST cover ALL THREE types
- "Data Cleaning and Preprocessing" = You MUST cover BOTH cleaning AND preprocessing
- "Introduction to Python and Pandas" = You MUST cover BOTH Python AND Pandas

Guidelines:
- Write in MyST Markdown format
- Use appropriate headings (## for main sections, ### for subsections)
- Include code examples with proper syntax highlighting using triple backticks and language identifiers
- Use admonitions for important notes:
  \`\`\`{note}
  Important information here
  \`\`\`
- Include practical examples and explanations
- Use cross-references where appropriate
- Add figures and diagrams descriptions where helpful
- Make content accessible and educational
- Include exercises or practice sections where appropriate
${wordCountRequirement}

IMPORTANT: Write the COMPLETE chapter covering ALL topics in the title. Do NOT stop early. Do NOT truncate. Continue writing until you have thoroughly covered every topic mentioned in the chapter title with equal depth and detail.`;
  }, [bookConfig.title, bookConfig.description]);

  // Feature audit function - checks which selected features are present in the content
  const auditFeatures = useCallback((content: string, selectedFeatureIds: string[]) => {
    if (!selectedFeatureIds || selectedFeatureIds.length === 0) {
      setFeatureAudit(null);
      return;
    }

    const foundFeatures: string[] = [];
    const missingFeatures: string[] = [];

    for (const featureId of selectedFeatureIds) {
      const feature = MYST_FEATURES_DATA.find(f => f.id === featureId);
      if (!feature) continue;

      // Check for various patterns that indicate the feature is used
      let isFound = false;

      // Check based on feature category and type
      switch (feature.id) {
        // Admonitions - check for :::{type} or ```{type}
        case 'note':
        case 'tip':
        case 'hint':
        case 'important':
        case 'warning':
        case 'caution':
        case 'attention':
        case 'danger':
        case 'error':
        case 'seealso':
          isFound = content.includes(`:::{${feature.id}}`) || content.includes(`\`\`\`{${feature.id}}`);
          break;

        // Dropdown admonition
        case 'admonition-dropdown':
          isFound = content.includes(':class: dropdown');
          break;

        // Custom admonition
        case 'admonition-custom':
          isFound = content.includes(':::{admonition}');
          break;

        // UI Components
        case 'dropdown':
          isFound = content.includes(':::{dropdown}');
          break;
        case 'card':
        case 'card-link':
          isFound = content.includes(':::{card}') || content.includes('```{card}');
          break;
        case 'grid':
          isFound = content.includes('::::{grid}') || content.includes(':::{grid}');
          break;
        case 'tab-set':
          isFound = content.includes('::::{tab-set}') || content.includes(':::{tab-item}');
          break;
        case 'button':
          isFound = content.includes('{button}');
          break;

        // Code features
        case 'code-block':
          isFound = /```\w+\n/.test(content);
          break;
        case 'code-caption':
        case 'code-linenos':
        case 'code-emphasize':
        case 'code-filename':
          isFound = content.includes('```{code}');
          break;
        case 'code-cell':
          isFound = content.includes('```{code-cell}');
          break;

        // Math
        case 'inline-math':
          isFound = /\$[^$]+\$/.test(content) && !content.includes('$$');
          break;
        case 'equation-block':
        case 'dollar-math':
          isFound = content.includes('$$') || content.includes('```{math}');
          break;

        // Diagrams
        case 'mermaid-flowchart':
        case 'mermaid-sequence':
        case 'mermaid-class':
        case 'mermaid-state':
        case 'mermaid-gantt':
        case 'mermaid-pie':
          isFound = content.includes('```{mermaid}') || content.includes('```mermaid');
          break;

        // Exercises
        case 'exercise':
          isFound = content.includes('```{exercise}');
          break;
        case 'solution':
          isFound = content.includes('```{solution}') || content.includes('````{solution}');
          break;

        // Figures
        case 'figure':
          isFound = content.includes('```{figure}') || content.includes(':::{figure}');
          break;
        case 'image':
          isFound = content.includes('```{image}') || content.includes('![');
          break;

        // Tables
        case 'markdown-table':
          isFound = /\|.*\|.*\n\|[-:]+\|/.test(content);
          break;
        case 'list-table':
          isFound = content.includes('```{list-table}');
          break;
        case 'csv-table':
          isFound = content.includes('```{csv-table}');
          break;

        // References
        case 'cross-reference':
          isFound = content.includes('[](#') || content.includes('{ref}');
          break;
        case 'footnote':
          isFound = /\[\^\w+\]/.test(content);
          break;

        // Proofs and theorems
        case 'theorem':
        case 'proof':
        case 'lemma':
        case 'definition':
        case 'corollary':
        case 'proposition':
        case 'axiom':
        case 'algorithm':
          isFound = content.includes(`:::{prf:${feature.id}}`);
          break;

        // Interactive code
        case 'jupyterlite':
          isFound = content.includes('[jupyterlite]');
          break;
        case 'pyodide':
          isFound = content.includes('[pyodide]');
          break;
        case 'thebe':
          isFound = content.includes('[thebe');
          break;

        // Default: check if syntax pattern appears in content
        default:
          // Try to extract a key pattern from the syntax
          const syntaxParts = feature.syntax.split('\n')[0];
          if (syntaxParts.includes(':::')) {
            const match = syntaxParts.match(/:::{?(\w+)/);
            if (match) {
              isFound = content.toLowerCase().includes(match[0].toLowerCase());
            }
          } else if (syntaxParts.includes('```')) {
            const match = syntaxParts.match(/```{?(\w+)/);
            if (match) {
              isFound = content.toLowerCase().includes(match[0].toLowerCase());
            }
          } else if (syntaxParts.includes('{')) {
            const match = syntaxParts.match(/{(\w+)}/);
            if (match) {
              isFound = content.includes(`{${match[1]}`);
            }
          }
          break;
      }

      if (isFound) {
        foundFeatures.push(featureId);
      } else {
        missingFeatures.push(featureId);
      }
    }

    setFeatureAudit({
      selectedFeatures: selectedFeatureIds,
      foundFeatures,
      missingFeatures,
    });
  }, []);

  const selectChapter = useCallback((chapter: Chapter) => {
    setSelectedChapter(chapter);
    updateEditorContent(chapter.content || '');
    setChapterDescription(chapter.description || '');
    setTargetWordCount(chapter.targetWordCount || 2000);
    setSaveStatus('idle');
    setEditorTab(chapter.inputMode === 'manual-write' ? 'manual-write' : 'ai-generate');
  }, [updateEditorContent]);

  const handleMoveUp = useCallback((chapterId: string, parentId?: string) => {
    moveChapterUp(chapterId, parentId);
  }, [moveChapterUp]);

  const handleMoveDown = useCallback((chapterId: string, parentId?: string) => {
    moveChapterDown(chapterId, parentId);
  }, [moveChapterDown]);

  const handleDelete = useCallback((chapterId: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      removeChapter(chapterId);
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
        updateEditorContent('');
      }
    }
  }, [removeChapter, selectedChapter, updateEditorContent]);

  const handleAddSubChapter = useCallback((parentId: string) => {
    setAddChapterParentId(parentId);
    setNewChapterTitle('');
    setModalType('add-chapter');
  }, []);

  const handleOpenFeatures = useCallback((chapter: Chapter) => {
    // If chapter doesn't have features set, initialize from book-level enabled features
    if (!chapter.selectedFeatures || chapter.selectedFeatures.length === 0) {
      // Map book-level features to MYST_FEATURES_DATA categories/IDs
      const featureMapping: Record<string, string[]> = {
        'admonitions': ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso', 'admonition-dropdown', 'admonition-custom'],
        'figures': ['figure', 'image'],
        'math': ['inline-math', 'equation-block', 'dollar-math', 'align-env', 'matrix'],
        'citations': ['citation', 'footnote'],
        'tables': ['table', 'list-table', 'csv-table', 'table-caption'],
        'code-blocks': ['code-block', 'code-caption', 'code-linenos', 'code-emphasize', 'literalinclude'],
        'tabs': ['tab-set'],
        'dropdowns': ['dropdown', 'admonition-dropdown'],
        'cards': ['card', 'card-link', 'grid'],
        'exercises': ['exercise', 'solution', 'exercise-dropdown'],
        'quizzes': ['quiz', 'mcq', 'fill-blank'],
        'jupyter-execution': ['jupyter-cell', 'output-cell', 'thebe-button'],
        'pyodide-cells': ['pyodide'],
        'binder': ['binder-link'],
        'colab-cells': ['colab'],
        'interactive-outputs': ['plotly', 'bokeh', 'altair'],
      };

      // Get enabled feature IDs from bookConfig.features
      const enabledBookFeatures = bookConfig.features
        .filter(f => f.enabled)
        .map(f => f.id);

      // Map to MYST_FEATURES_DATA feature IDs
      const initialFeatures: string[] = [];
      for (const bookFeatureId of enabledBookFeatures) {
        const mappedFeatures = featureMapping[bookFeatureId];
        if (mappedFeatures) {
          initialFeatures.push(...mappedFeatures);
        }
      }

      // Also add some common features that are always useful
      const commonFeatures = ['code-block', 'inline-math', 'mermaid-flowchart'];
      for (const feature of commonFeatures) {
        if (!initialFeatures.includes(feature)) {
          initialFeatures.push(feature);
        }
      }

      // Remove duplicates
      const uniqueFeatures = [...new Set(initialFeatures)];

      // Update the store with inherited features
      if (uniqueFeatures.length > 0) {
        updateChapterFeatures(chapter.id, uniqueFeatures);
        // Update the chapter object for the modal
        chapter = { ...chapter, selectedFeatures: uniqueFeatures };
      }
    }
    setModalChapter(chapter);
    setModalType('features');
  }, [bookConfig.features, updateChapterFeatures]);

  const handleOpenSystemPrompt = useCallback((chapter: Chapter) => {
    setModalChapter(chapter);
    setTempSystemPrompt(chapter.systemPrompt || '');
    setTempSelectedModel(chapter.selectedModel || null);
    setTempSelectedProvider(chapter.selectedProvider || undefined);

    // Load API key for the selected provider if available
    const selectedProv = chapter.selectedProvider || aiConfig.provider;
    if (selectedProv) {
      const provConfig = getProviderConfig(selectedProv);
      setTempProviderApiKey(provConfig?.apiKey || '');
      setProviderModels(provConfig?.availableModels || aiConfig.availableModels || []);
    } else {
      setTempProviderApiKey('');
      setProviderModels(aiConfig.availableModels || []);
    }

    setModalType('system-prompt');
  }, [aiConfig.provider, aiConfig.availableModels, getProviderConfig]);

  const handleSaveSystemPrompt = useCallback(() => {
    if (modalChapter) {
      updateChapterSystemPrompt(modalChapter.id, tempSystemPrompt);
      if (tempSelectedModel) {
        updateChapterModel(modalChapter.id, tempSelectedModel);
      }
      // Save provider selection
      updateChapterProvider(modalChapter.id, tempSelectedProvider);

      // Save provider API key if set
      if (tempSelectedProvider && tempProviderApiKey) {
        setProviderConfig(tempSelectedProvider, {
          apiKey: tempProviderApiKey,
          availableModels: providerModels,
          isConfigured: true,
        });
      }

      // Update selectedChapter local state to reflect the changes
      // This ensures generateChapterContent uses the updated provider
      if (selectedChapter && selectedChapter.id === modalChapter.id) {
        setSelectedChapter({
          ...selectedChapter,
          systemPrompt: tempSystemPrompt,
          selectedModel: tempSelectedModel || selectedChapter.selectedModel,
          selectedProvider: tempSelectedProvider,
        });
      }

      setModalType('none');
      setModalChapter(null);
    }
  }, [modalChapter, tempSystemPrompt, tempSelectedModel, tempSelectedProvider, tempProviderApiKey, providerModels, updateChapterSystemPrompt, updateChapterModel, updateChapterProvider, setProviderConfig, selectedChapter]);

  // Load models for a provider with given API key
  const loadModelsForProvider = useCallback(async (provider: AIProvider, apiKey: string) => {
    if (!apiKey) {
      setProviderModels([]);
      return;
    }

    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      const data = await response.json();
      if (response.ok && data.models) {
        setProviderModels(data.models);
        // Also update the provider config in the store
        setProviderConfig(provider, {
          apiKey,
          availableModels: data.models,
          isConfigured: true,
        });
      } else {
        console.error('Failed to load models:', data.error);
        setProviderModels([]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setProviderModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [setProviderConfig]);

  // Handle provider change in modal
  const handleProviderChange = useCallback((provider: AIProvider | undefined) => {
    setTempSelectedProvider(provider);
    setTempSelectedModel(null);

    if (provider) {
      // Try to load existing config for this provider
      const provConfig = getProviderConfig(provider);
      if (provConfig?.apiKey) {
        setTempProviderApiKey(provConfig.apiKey);
        if (provConfig.availableModels.length > 0) {
          setProviderModels(provConfig.availableModels);
        } else {
          // Fetch models if not loaded
          loadModelsForProvider(provider, provConfig.apiKey);
        }
      } else {
        setTempProviderApiKey('');
        setProviderModels([]);
      }
    } else {
      // Use default config
      setTempProviderApiKey(aiConfig.apiKey);
      setProviderModels(aiConfig.availableModels || []);
    }
  }, [aiConfig.apiKey, aiConfig.availableModels, getProviderConfig, loadModelsForProvider]);

  const handleAddNewChapter = useCallback(() => {
    if (!newChapterTitle.trim()) return;

    const slug = newChapterTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: newChapterTitle,
      slug,
      inputMode: 'ai-generate',
    };

    addChapter(newChapter, addChapterParentId || undefined);
    setModalType('none');
    setNewChapterTitle('');
    setAddChapterParentId(null);

    // Expand parent if adding sub-chapter
    if (addChapterParentId) {
      setExpandedChapters(prev => new Set([...prev, addChapterParentId]));
    }
  }, [newChapterTitle, addChapterParentId, addChapter]);

  const handleToggleFeature = useCallback((featureId: string) => {
    if (modalChapter) {
      toggleChapterFeature(modalChapter.id, featureId);
      // Update modal chapter state to reflect change
      setModalChapter(prev => {
        if (!prev) return null;
        const currentFeatures = prev.selectedFeatures || [];
        const hasFeature = currentFeatures.includes(featureId);
        return {
          ...prev,
          selectedFeatures: hasFeature
            ? currentFeatures.filter(id => id !== featureId)
            : [...currentFeatures, featureId],
        };
      });
    }
  }, [modalChapter, toggleChapterFeature]);

  const generateChapterContent = async () => {
    console.log('generateChapterContent called');
    console.log('selectedChapter:', selectedChapter);

    if (!selectedChapter) {
      console.error('No chapter selected!');
      alert('Please select a chapter first');
      return;
    }

    // Determine which provider and API key to use
    const chapterProvider = selectedChapter.selectedProvider || aiConfig.provider;
    let effectiveApiKey = aiConfig.apiKey;

    // If chapter has a specific provider, use that provider's API key
    if (selectedChapter.selectedProvider) {
      const provConfig = getProviderConfig(selectedChapter.selectedProvider);
      if (provConfig?.apiKey) {
        effectiveApiKey = provConfig.apiKey;
      }
    }

    console.log('Using provider:', chapterProvider);
    console.log('API key present:', effectiveApiKey ? 'yes' : 'no');
    console.log('aiConfig.selectedModel:', aiConfig.selectedModel);

    if (!effectiveApiKey) {
      console.error('No API key!');
      const providerName = chapterProvider || 'AI';
      alert(`API key is missing for ${providerName}. Please configure the API key in Chapter Settings or go back to AI Setup.`);
      return;
    }

    if (!chapterProvider) {
      console.error('No provider selected!');
      alert('No AI provider selected. Please select a provider in AI Setup or Chapter Settings.');
      return;
    }

    setIsGenerating(true);
    setEditedContent(''); // Clear content for streaming
    setGenerationMetadata(null); // Reset metadata
    setFeatureAudit(null); // Reset audit
    console.log('Starting generation...');

    try {
      // Build features context
      const featuresContext = selectedChapter.selectedFeatures?.length
        ? `\n\nInclude these MyST features in your output where appropriate:\n${
            selectedChapter.selectedFeatures
              .map(id => {
                const feature = MYST_FEATURES_DATA.find(f => f.id === id);
                return feature ? `- ${feature.name}: ${feature.syntax}` : null;
              })
              .filter(Boolean)
              .join('\n')
          }`
        : '';

      const wordCountInstruction = `\n\nTarget word count: approximately ${targetWordCount} words. Ensure the content is comprehensive and detailed to meet this target.`;

      const systemPromptOverride = selectedChapter.systemPrompt || '';

      // Determine which model to use - chapter's selected model, or provider's default, or global default
      let effectiveModel = selectedChapter.selectedModel || aiConfig.selectedModel;
      if (selectedChapter.selectedProvider && !selectedChapter.selectedModel) {
        // If chapter has a provider but no specific model, check if provider config has a default
        const provConfig = getProviderConfig(selectedChapter.selectedProvider);
        if (provConfig?.selectedModel) {
          effectiveModel = provConfig.selectedModel;
        }
      }

      // Use native Netlify Edge Function for longer timeout (40s vs 30s)
      console.log('Making API request to /api/edge/generate...');
      console.log('Using model:', effectiveModel);

      const response = await fetch('/api/edge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: chapterProvider,
          apiKey: effectiveApiKey,
          model: effectiveModel,
          prompt: `Write comprehensive content for the chapter "${selectedChapter.title}"${
            chapterDescription ? `: ${chapterDescription}` : selectedChapter.description ? `: ${selectedChapter.description}` : ''
          }${featuresContext}${wordCountInstruction}`,
          type: 'chapter',
          context: {
            bookTitle: bookConfig.title,
            bookDescription: bookConfig.description,
            chapterTitle: selectedChapter.title,
            systemPromptOverride,
            targetWordCount,
          },
        }),
      });

      console.log('API response status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      // Check if it's a streaming response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        console.log('Starting to read stream...');
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let chunkCount = 0;
        let buffer = ''; // Buffer for incomplete lines
        let receivedComplete = false; // Track if we got the final "done" message

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream done, total chunks:', chunkCount);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                if (!jsonStr.trim()) continue;

                const data = JSON.parse(jsonStr);
                chunkCount++;

                if (data.error) {
                  console.error('Stream error:', data.error);
                  throw new Error(data.error);
                }

                if (data.chunk) {
                  accumulatedContent += data.chunk;
                  setEditedContent(accumulatedContent);
                }

                if (data.done && data.content) {
                  console.log('Stream complete, content length:', data.content.length);
                  receivedComplete = true;
                  accumulatedContent = data.content;
                  setEditedContent(accumulatedContent);

                  // Capture metadata from generation
                  if (data.metadata) {
                    setGenerationMetadata(data.metadata);
                    console.log('%c[GENERATION COMPLETE]', 'background: #222; color: #bada55; font-size: 14px; padding: 4px;');
                    console.log('%cStop Reason: ' + data.metadata.stopReason, 'color: #ff6b6b; font-weight: bold;');
                    console.log('%cOutput Tokens: ' + data.metadata.outputTokens, 'color: #4ecdc4; font-weight: bold;');
                    console.log('%cWord Count: ' + data.metadata.wordCount, 'color: #ffe66d; font-weight: bold;');
                    console.log('%cTarget Word Count: ' + targetWordCount, 'color: #95e1d3; font-weight: bold;');
                    console.log('%cInput Tokens: ' + data.metadata.inputTokens, 'color: #a8e6cf;');
                    console.table({
                      'Stop Reason': data.metadata.stopReason,
                      'Output Tokens': data.metadata.outputTokens,
                      'Word Count': data.metadata.wordCount,
                      'Target Word Count': targetWordCount,
                      'Percentage of Target': ((data.metadata.wordCount / targetWordCount) * 100).toFixed(1) + '%',
                      'Input Tokens': data.metadata.inputTokens,
                    });
                  }

                  // Check if Claude stopped early (end_turn) before reaching word count target
                  const currentWordCount = accumulatedContent.split(/\s+/).length;
                  const shouldContinue =
                    data.metadata?.stopReason === 'end_turn' &&
                    currentWordCount < targetWordCount * 0.8 &&
                    continuationAttempts < MAX_CONTINUATION_ATTEMPTS;

                  if (shouldContinue) {
                    console.log('%c[AUTO-CONTINUATION TRIGGERED]', 'background: #ff6b6b; color: white; font-size: 14px; padding: 4px;');
                    console.log(`Claude stopped early (end_turn) at ${currentWordCount}/${targetWordCount} words (${((currentWordCount/targetWordCount)*100).toFixed(1)}%). Auto-continuing... (attempt ${continuationAttempts + 1}/${MAX_CONTINUATION_ATTEMPTS})`);
                    setGenerationMetadata({
                      stopReason: 'continuing',
                      wordCount: currentWordCount,
                      inputTokens: data.metadata?.inputTokens,
                      outputTokens: data.metadata?.outputTokens,
                    });

                    // Trigger continuation
                    setContinuationAttempts(prev => prev + 1);
                    setIsContinuing(true);

                    // Continue generation with existing content
                    await continueFromTruncation(accumulatedContent, chapterProvider, effectiveApiKey, effectiveModel, selectedChapter);
                    return; // Exit - continuation function will handle the rest
                  }

                  // Run feature audit
                  if (selectedChapter.selectedFeatures?.length) {
                    auditFeatures(accumulatedContent, selectedChapter.selectedFeatures);
                  }
                }
              } catch (parseError) {
                console.warn('JSON parse error on line:', line.substring(0, 100), parseError);
                // Continue processing other lines
              }
            }
          }
        }

        // Check for truncation - if we have content but never got a proper "done" message
        if (accumulatedContent && !receivedComplete) {
          console.warn('Stream ended without proper completion. Content may be truncated.');
          // Check if content appears truncated (ends mid-sentence)
          const trimmed = accumulatedContent.trim();
          const lastChar = trimmed.slice(-1);
          const endsProperlyChars = ['.', '!', '?', '`', '"', "'", ')', ']', '}', ':'];
          const appearsComplete = endsProperlyChars.includes(lastChar);
          const currentWordCount = accumulatedContent.split(/\s+/).length;

          // Auto-continue if content appears truncated and we haven't exceeded max attempts
          // and current word count is below 80% of target
          if (!appearsComplete && continuationAttempts < MAX_CONTINUATION_ATTEMPTS && currentWordCount < targetWordCount * 0.8) {
            console.log(`Content truncated at ${currentWordCount} words. Auto-continuing... (attempt ${continuationAttempts + 1}/${MAX_CONTINUATION_ATTEMPTS})`);
            setGenerationMetadata({
              stopReason: 'continuing',
              wordCount: currentWordCount
            });

            // Trigger continuation
            setContinuationAttempts(prev => prev + 1);
            setIsContinuing(true);

            // Continue generation with existing content
            await continueFromTruncation(accumulatedContent, chapterProvider, effectiveApiKey, effectiveModel, selectedChapter);
            return; // Exit - continuation function will handle the rest
          } else if (!appearsComplete) {
            console.error('Content appears truncated - ends with:', trimmed.slice(-50));
            // Max attempts reached or close enough to target - show warning
            setGenerationMetadata({
              stopReason: 'stream_truncated',
              wordCount: currentWordCount
            });
            if (continuationAttempts >= MAX_CONTINUATION_ATTEMPTS) {
              console.warn(`Max continuation attempts (${MAX_CONTINUATION_ATTEMPTS}) reached`);
            }
          }
        }

        // Reset continuation attempts on successful completion
        setContinuationAttempts(0);

        // Save the word count setting to the chapter
        updateChapterWordCount(selectedChapter.id, targetWordCount);
      } else {
        // Handle non-streaming response (other providers)
        const data = await response.json();
        console.log('API response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate content');
        }

        updateEditorContent(data.content);
        // Save the word count setting to the chapter
        updateChapterWordCount(selectedChapter.id, targetWordCount);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
      setIsContinuing(false);
    }
  };

  // Continue generation from truncated content
  const continueFromTruncation = async (
    existingContent: string,
    provider: AIProvider | null,
    apiKey: string,
    model: string | null,
    chapter: Chapter
  ) => {
    console.log('continueFromTruncation called, existing word count:', existingContent.split(/\s+/).length);

    try {
      // Get the last ~500 characters for context (avoiding mid-word cuts)
      const contextLength = 500;
      let contextStart = Math.max(0, existingContent.length - contextLength);
      // Find a good break point (space or newline)
      while (contextStart > 0 && existingContent[contextStart] !== ' ' && existingContent[contextStart] !== '\n') {
        contextStart++;
      }
      const lastContext = existingContent.substring(contextStart).trim();

      const currentWordCount = existingContent.split(/\s+/).length;
      const remainingWords = targetWordCount - currentWordCount;

      const continuationPrompt = `Continue writing the chapter "${chapter.title}" from exactly where it was cut off.

IMPORTANT:
- Do NOT repeat any content that was already written
- Continue SEAMLESSLY from the exact point where the previous text ended
- Write approximately ${remainingWords} more words to reach the target of ${targetWordCount} words
- Maintain the same style, tone, and format

The chapter content ends with:
"""
${lastContext}
"""

Continue from this exact point (do not include the text above - just continue from where it stopped):`;

      console.log('Making continuation API request to /api/edge/generate...');

      const response = await fetch('/api/edge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          prompt: continuationPrompt,
          type: 'chapter',
          context: {
            bookTitle: bookConfig.title,
            bookDescription: bookConfig.description,
            chapterTitle: chapter.title,
            targetWordCount: remainingWords,
          },
        }),
      });

      console.log('Continuation response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body for continuation');
        }

        const decoder = new TextDecoder();
        let accumulatedContinuation = '';
        let buffer = '';
        let receivedComplete = false;
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Continuation stream done, chunks:', chunkCount);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                if (!jsonStr.trim()) continue;

                const data = JSON.parse(jsonStr);
                chunkCount++;

                if (data.error) {
                  console.error('Continuation stream error:', data.error);
                  throw new Error(data.error);
                }

                if (data.chunk) {
                  accumulatedContinuation += data.chunk;
                  // Update content in real-time (existing + continuation)
                  setEditedContent(existingContent + accumulatedContinuation);
                }

                if (data.done && data.content) {
                  console.log('Continuation complete, length:', data.content.length);
                  receivedComplete = true;
                  accumulatedContinuation = data.content;
                  const fullContent = existingContent + accumulatedContinuation;
                  updateEditorContent(fullContent);

                  const totalWordCount = fullContent.split(/\s+/).length;
                  setGenerationMetadata({
                    stopReason: data.metadata?.stopReason || 'end_turn',
                    wordCount: totalWordCount,
                    inputTokens: data.metadata?.inputTokens,
                    outputTokens: data.metadata?.outputTokens,
                  });

                  // Check if Claude stopped early again during continuation
                  const shouldContinueAgain =
                    data.metadata?.stopReason === 'end_turn' &&
                    totalWordCount < targetWordCount * 0.8 &&
                    continuationAttempts < MAX_CONTINUATION_ATTEMPTS;

                  if (shouldContinueAgain) {
                    console.log(`Continuation also stopped early (end_turn) at ${totalWordCount}/${targetWordCount} words. Continuing again... (attempt ${continuationAttempts + 1})`);
                    setContinuationAttempts(prev => prev + 1);
                    setGenerationMetadata({
                      stopReason: 'continuing',
                      wordCount: totalWordCount,
                      inputTokens: data.metadata?.inputTokens,
                      outputTokens: data.metadata?.outputTokens,
                    });
                    await continueFromTruncation(fullContent, provider, apiKey, model, chapter);
                    return; // Exit - continuation will handle the rest
                  }

                  // Run feature audit
                  if (chapter.selectedFeatures?.length) {
                    auditFeatures(fullContent, chapter.selectedFeatures);
                  }
                }
              } catch (parseError) {
                console.warn('JSON parse error in continuation:', parseError);
              }
            }
          }
        }

        // Check if continuation also got truncated
        if (accumulatedContinuation && !receivedComplete) {
          const fullContent = existingContent + accumulatedContinuation;
          const trimmed = fullContent.trim();
          const lastChar = trimmed.slice(-1);
          const endsProperlyChars = ['.', '!', '?', '`', '"', "'", ')', ']', '}', ':'];
          const appearsComplete = endsProperlyChars.includes(lastChar);
          const totalWordCount = fullContent.split(/\s+/).length;

          // Continue again if still truncated and under limits
          if (!appearsComplete && continuationAttempts < MAX_CONTINUATION_ATTEMPTS && totalWordCount < targetWordCount * 0.8) {
            console.log(`Continuation also truncated at ${totalWordCount} words. Continuing again... (attempt ${continuationAttempts + 1})`);
            setContinuationAttempts(prev => prev + 1);
            setGenerationMetadata({
              stopReason: 'continuing',
              wordCount: totalWordCount
            });
            await continueFromTruncation(fullContent, provider, apiKey, model, chapter);
            return;
          } else {
            // Done continuing
            setGenerationMetadata({
              stopReason: appearsComplete ? 'end_turn' : 'stream_truncated',
              wordCount: totalWordCount
            });
            if (!appearsComplete && continuationAttempts >= MAX_CONTINUATION_ATTEMPTS) {
              console.warn(`Max continuation attempts reached with ${totalWordCount} words`);
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Continuation failed');
        }
        const fullContent = existingContent + data.content;
        updateEditorContent(fullContent);
        setGenerationMetadata({
          wordCount: fullContent.split(/\s+/).length
        });
      }

      // Reset continuation state
      setContinuationAttempts(0);
      updateChapterWordCount(chapter.id, targetWordCount);
    } catch (error) {
      console.error('Continuation error:', error);
      setGenerationMetadata({
        stopReason: 'continuation_error',
        wordCount: existingContent.split(/\s+/).length
      });
    } finally {
      setIsContinuing(false);
      setIsGenerating(false);
    }
  };

  // Format with AI - adds MyST features and formatting to manual content
  const formatWithAI = async () => {
    if (!selectedChapter || !editedContent) return;

    // Determine which provider and API key to use
    const chapterProvider = selectedChapter.selectedProvider || aiConfig.provider;
    let effectiveApiKey = aiConfig.apiKey;

    // If chapter has a specific provider, use that provider's API key
    if (selectedChapter.selectedProvider) {
      const provConfig = getProviderConfig(selectedChapter.selectedProvider);
      if (provConfig?.apiKey) {
        effectiveApiKey = provConfig.apiKey;
      }
    }

    if (!chapterProvider || !effectiveApiKey) {
      alert('Please configure an AI provider and API key first. Click the gear icon to open Chapter Settings.');
      return;
    }

    setIsFormatting(true);

    try {
      const featuresContext = selectedChapter.selectedFeatures?.length
        ? `\n\nApply these MyST features where appropriate:\n${
            selectedChapter.selectedFeatures
              .map(id => {
                const feature = MYST_FEATURES_DATA.find(f => f.id === id);
                return feature ? `- ${feature.name}: ${feature.syntax}` : null;
              })
              .filter(Boolean)
              .join('\n')
          }`
        : '';

      // Determine which model to use
      let effectiveModel = selectedChapter.selectedModel || aiConfig.selectedModel;
      if (selectedChapter.selectedProvider && !selectedChapter.selectedModel) {
        const provConfig = getProviderConfig(selectedChapter.selectedProvider);
        if (provConfig?.selectedModel) {
          effectiveModel = provConfig.selectedModel;
        }
      }

      const response = await fetch('/api/edge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: chapterProvider,
          apiKey: effectiveApiKey,
          model: effectiveModel,
          prompt: `Format and enhance the following content using MyST Markdown. Improve structure, add appropriate headings, apply MyST features like admonitions, code blocks, and other formatting. Keep the original meaning and information but make it more professional and well-structured.${featuresContext}

Original content:
${editedContent}`,
          type: 'format',
          context: {
            bookTitle: bookConfig.title,
            chapterTitle: selectedChapter.title,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to format content');
      }

      updateEditorContent(data.content);
    } catch (error) {
      console.error('Formatting error:', error);
      alert(error instanceof Error ? error.message : 'Failed to format content');
    } finally {
      setIsFormatting(false);
    }
  };

  const saveChapter = async () => {
    if (!selectedChapter || !bookConfig.github) return;

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveDetails(null);

    try {
      // Update local state
      updateChapterContent(selectedChapter.id, editedContent);
      updateChapterInputMode(selectedChapter.id, editorTab);

      // Update on GitHub (also updates myst.yml to sync configuration)
      const response = await fetch('/api/github/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: bookConfig.github.token,
          username: bookConfig.github.username,
          repoName: bookConfig.github.repoName,
          chapter: {
            ...selectedChapter,
            content: editedContent,
          },
          bookConfig, // Pass full config to sync myst.yml
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save to GitHub');
      }

      // Store the verification details
      setSaveDetails({
        commitUrl: data.commitUrl,
        fileUrl: data.fileUrl,
        commitSha: data.commitSha,
        verified: data.verified,
        message: data.message,
        actionsUrl: data.actionsUrl,
        workflowTriggered: data.workflowTriggered,
        workflowRunUrl: data.workflowRunUrl,
      });

      // Set status based on verification
      if (data.verified) {
        setSaveStatus('verified');
      } else {
        setSaveStatus('unverified');
      }

      // Clear status after 10 seconds (longer to give time to see details)
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveDetails(null);
      }, 10000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setSaveDetails({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('generate-book');
  };

  // Calculate book analytics
  const calculateBookAnalytics = useCallback(() => {
    const countWords = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Count top-level chapters only
    const topLevelChapters = bookConfig.tableOfContents.chapters.length;
    const topLevelWithContent = bookConfig.tableOfContents.chapters.filter(ch => ch.content).length;

    // Count all sections (chapters + sub-chapters)
    const countAllSections = (chapters: Chapter[]): { total: number; withContent: number; words: number } => {
      let total = 0;
      let withContent = 0;
      let words = 0;
      for (const chapter of chapters) {
        total++;
        if (chapter.content) {
          withContent++;
          words += countWords(chapter.content);
        }
        if (chapter.children) {
          const childStats = countAllSections(chapter.children);
          total += childStats.total;
          withContent += childStats.withContent;
          words += childStats.words;
        }
      }
      return { total, withContent, words };
    };

    // Count sub-chapters only
    const countSubChapters = (chapters: Chapter[]): { total: number; withContent: number } => {
      let total = 0;
      let withContent = 0;
      for (const chapter of chapters) {
        if (chapter.children) {
          total += chapter.children.length;
          withContent += chapter.children.filter(ch => ch.content).length;
          const nested = countSubChapters(chapter.children);
          total += nested.total;
          withContent += nested.withContent;
        }
      }
      return { total, withContent };
    };

    const allStats = countAllSections(bookConfig.tableOfContents.chapters);
    const subChapterStats = countSubChapters(bookConfig.tableOfContents.chapters);
    const avgWordsPerSection = allStats.withContent > 0 ? Math.round(allStats.words / allStats.withContent) : 0;
    const estimatedReadingTime = Math.ceil(allStats.words / 200); // ~200 words per minute

    return {
      // Top-level chapters
      chapters: topLevelChapters,
      chaptersWithContent: topLevelWithContent,
      chaptersRemaining: topLevelChapters - topLevelWithContent,
      // Sub-chapters
      subChapters: subChapterStats.total,
      subChaptersWithContent: subChapterStats.withContent,
      subChaptersRemaining: subChapterStats.total - subChapterStats.withContent,
      // All sections combined
      totalSections: allStats.total,
      sectionsWithContent: allStats.withContent,
      sectionsRemaining: allStats.total - allStats.withContent,
      // Content stats
      words: allStats.words,
      avgWordsPerSection,
      estimatedReadingTime,
      completionPercentage: allStats.total > 0 ? Math.round((allStats.withContent / allStats.total) * 100) : 0,
    };
  }, [bookConfig.tableOfContents.chapters]);

  const renderChapterRows = (
    chapters: Chapter[],
    depth = 0,
    parentId?: string
  ): React.ReactNode => {
    return chapters.map((chapter, index) => {
      const hasChildren = chapter.children && chapter.children.length > 0;
      const isExpanded = expandedChapters.has(chapter.id);
      const isSelected = selectedChapter?.id === chapter.id;

      return (
        <div key={chapter.id}>
          <ChapterRow
            chapter={chapter}
            depth={depth}
            index={index}
            totalSiblings={chapters.length}
            parentId={parentId}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onSelect={selectChapter}
            onToggleExpand={toggleExpanded}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDelete={handleDelete}
            onAddSubChapter={handleAddSubChapter}
            onOpenFeatures={handleOpenFeatures}
            onOpenSystemPrompt={handleOpenSystemPrompt}
          />
          {hasChildren && isExpanded && (
            <div>{renderChapterRows(chapter.children!, depth + 1, chapter.id)}</div>
          )}
        </div>
      );
    });
  };

  const renderFeaturesModal = () => {
    if (modalType !== 'features' || !modalChapter) return null;

    const categories: MystFeatureCategory[] = [
      'admonitions', 'ui-components', 'interactive-code', 'exercises',
      'math', 'diagrams', 'code', 'figures', 'tables', 'layout', 'references', 'content', 'proofs-theorems'
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Features for: {modalChapter.title}
            </h3>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(category => {
                const features = getFeaturesByCategory(category);
                if (features.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {category.replace('-', ' ')}
                    </h4>
                    <div className="space-y-1">
                      {features.map(feature => {
                        const isSelected = modalChapter.selectedFeatures?.includes(feature.id);
                        return (
                          <button
                            key={feature.id}
                            onClick={() => handleToggleFeature(feature.id)}
                            className={`
                              w-full text-left p-2 rounded-lg text-sm transition-colors
                              ${isSelected
                                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                              border
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{feature.name}</span>
                              {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {feature.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setModalType('none')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBookFeaturesModal = () => {
    if (modalType !== 'book-features') return null;

    const bookFeatures = bookConfig.bookFeatures || BOOK_LEVEL_FEATURES;
    const categories: BookLevelFeatureCategory[] = [
      'front-matter', 'back-matter', 'export', 'navigation',
      'interactivity', 'analytics', 'search', 'accessibility', 'versioning'
    ];
    const enabledCount = bookFeatures.filter(f => f.enabled).length;

    const categoryLabels: Record<BookLevelFeatureCategory, string> = {
      'front-matter': 'Front Matter',
      'back-matter': 'Back Matter',
      'export': 'Export Options',
      'navigation': 'Navigation',
      'interactivity': 'Interactive Features',
      'analytics': 'Analytics',
      'search': 'Search',
      'accessibility': 'Accessibility',
      'versioning': 'Versioning'
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Book-Level Features
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                These features apply to the entire book and affect the generated myst.yml configuration
              </p>
            </div>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {/* Summary Badge */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {enabledCount} of {bookFeatures.length} features enabled
                </span>
                {enabledCount > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 max-w-xl truncate">
                    Enabled: {bookFeatures.filter(f => f.enabled).map(f => f.name).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const features = bookFeatures.filter(f => f.category === category);
                if (features.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      {categoryLabels[category]}
                    </h4>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {features.map(feature => {
                        const isSelected = feature.enabled;
                        return (
                          <button
                            key={feature.id}
                            onClick={() => toggleBookFeature(feature.id)}
                            className={`
                              w-full text-left p-2.5 rounded-lg text-sm transition-colors
                              ${isSelected
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                              border
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-xs">{feature.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {feature.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Changes will be applied when you regenerate the book
            </p>
            <button
              onClick={() => setModalType('none')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemPromptModal = () => {
    if (modalType !== 'system-prompt' || !modalChapter) return null;

    const selectedModelInfo = providerModels.find(m => m.id === tempSelectedModel);
    const isGeminiSelected = selectedModelInfo?.provider === 'gemini' || tempSelectedProvider === 'gemini';
    const providers: AIProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];

    const getProviderLabel = (provider: AIProvider): string => {
      switch (provider) {
        case 'claude': return 'Claude (Anthropic)';
        case 'openai': return 'OpenAI';
        case 'gemini': return 'Gemini (Google)';
        case 'openrouter': return 'OpenRouter';
        default: return provider;
      }
    };

    const getProviderConfigured = (provider: AIProvider): boolean => {
      const config = getProviderConfig(provider);
      return !!config?.isConfigured;
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chapter Settings: {modalChapter.title}
            </h3>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* AI Provider Selection */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI Provider for This Chapter
              </h4>

              {/* Provider Selection */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Provider
                  </label>
                  <select
                    value={tempSelectedProvider || ''}
                    onChange={(e) => handleProviderChange(e.target.value as AIProvider || undefined)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Use Default ({aiConfig.provider ? getProviderLabel(aiConfig.provider) : 'Not Set'})</option>
                    {providers.map(provider => (
                      <option key={provider} value={provider}>
                        {getProviderLabel(provider)} {getProviderConfigured(provider) ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Key Input - Show when a specific provider is selected */}
                {tempSelectedProvider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key for {getProviderLabel(tempSelectedProvider)}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={tempProviderApiKey}
                        onChange={(e) => setTempProviderApiKey(e.target.value)}
                        placeholder={`Enter ${tempSelectedProvider} API key...`}
                        className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => loadModelsForProvider(tempSelectedProvider, tempProviderApiKey)}
                        disabled={!tempProviderApiKey || isLoadingModels}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingModels ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Load Models
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your API key is stored securely in session storage (clears when you close the tab).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                AI Model for This Chapter
              </label>
              <select
                value={tempSelectedModel || ''}
                onChange={(e) => setTempSelectedModel(e.target.value || null)}
                disabled={providerModels.length === 0 && !aiConfig.selectedModel}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">
                  {providerModels.length === 0 && !tempSelectedProvider
                    ? `Use Default Model (${aiConfig.selectedModel || 'Not Set'})`
                    : providerModels.length === 0
                      ? 'Enter API key and load models first'
                      : `Use Default Model (${aiConfig.selectedModel || 'Not Set'})`
                  }
                </option>
                {providerModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Override the default model for generating this chapter&apos;s content.
              </p>

              {/* Gemini Special Note */}
              {isGeminiSelected && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                        Gemini Multimodal Capabilities
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                        Gemini models can generate both text and images as part of the regular output.
                        This is powerful for creating illustrated content, diagrams, and visual explanations
                        directly within your chapter.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Prompt */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  System Prompt
                </label>
                <button
                  onClick={() => setShowDefaultPrompt(!showDefaultPrompt)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {showDefaultPrompt ? 'Hide' : 'Show'} Default Prompt
                  <svg className={`w-4 h-4 transition-transform ${showDefaultPrompt ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Default Prompt Display */}
              {showDefaultPrompt && modalChapter && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Default System Prompt (Read-Only)
                    </span>
                    <button
                      onClick={() => {
                        setTempSystemPrompt(getDefaultSystemPrompt(modalChapter));
                        setShowDefaultPrompt(false);
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      Copy to Custom
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-64 font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    {getDefaultSystemPrompt(modalChapter)}
                  </pre>
                </div>
              )}

              {/* Custom Prompt Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom System Prompt {tempSystemPrompt ? '(Active)' : '(Optional)'}
                  </label>
                  {tempSystemPrompt && (
                    <button
                      onClick={() => setTempSystemPrompt('')}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Clear &amp; Use Default
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Leave empty to use the default prompt, or enter a custom prompt to override it.
                </p>
                <textarea
                  value={tempSystemPrompt}
                  onChange={(e) => setTempSystemPrompt(e.target.value)}
                  placeholder="Enter a custom system prompt to override the default..."
                  className="w-full h-48 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={() => setModalType('none')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSystemPrompt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddChapterModal = () => {
    if (modalType !== 'add-chapter') return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {addChapterParentId ? 'Add Sub-Chapter' : 'Add Chapter'}
            </h3>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chapter Title
            </label>
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Enter chapter title..."
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNewChapter()}
            />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={() => setModalType('none')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNewChapter}
              disabled={!newChapterTitle.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Chapter
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCoverImageModal = () => {
    if (modalType !== 'cover-image') return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              Book Cover Image
            </h3>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Image URL
              </label>
              <input
                type="url"
                value={tempCoverImageUrl}
                onChange={(e) => setTempCoverImageUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter a URL to an image for your book cover. Recommended aspect ratio: 2:3 (e.g., 400x600 pixels).
              </p>
            </div>

            {/* Preview */}
            {tempCoverImageUrl && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                <div className="flex justify-center">
                  <img
                    src={tempCoverImageUrl}
                    alt="Cover preview"
                    className="max-h-48 rounded-lg shadow-md object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => {
                setBookCoverImage('');
                setTempCoverImageUrl('');
                setModalType('none');
              }}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium"
            >
              Remove Cover
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setModalType('none')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBookCoverImage(tempCoverImageUrl);
                  setModalType('none');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Save Cover
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsModal = () => {
    if (modalType !== 'analytics') return null;

    const analytics = calculateBookAnalytics();

    // Calculate per-chapter stats
    const getChapterStats = (chapters: Chapter[], depth = 0): Array<{ chapter: Chapter; words: number; depth: number; isChapter: boolean }> => {
      const stats: Array<{ chapter: Chapter; words: number; depth: number; isChapter: boolean }> = [];
      for (const chapter of chapters) {
        const words = chapter.content ? chapter.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        stats.push({ chapter, words, depth, isChapter: depth === 0 });
        if (chapter.children) {
          stats.push(...getChapterStats(chapter.children, depth + 1));
        }
      }
      return stats;
    };

    const chapterStats = getChapterStats(bookConfig.tableOfContents.chapters);

    // Calculate estimated book length in pages (assuming ~250 words per page)
    const estimatedPages = Math.ceil(analytics.words / 250);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Book Analytics
            </h3>
            <button
              onClick={() => setModalType('none')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Structure Overview */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Book Structure</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Chapters</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.chapters}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    {analytics.chaptersWithContent} complete, {analytics.chaptersRemaining} remaining
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-xl">
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Sub-chapters</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{analytics.subChapters}</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                    {analytics.subChaptersWithContent} complete, {analytics.subChaptersRemaining} remaining
                  </p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-4 rounded-xl">
                  <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Total Sections</p>
                  <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{analytics.totalSections}</p>
                  <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
                    {analytics.sectionsWithContent} complete, {analytics.sectionsRemaining} remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Content Stats */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Content Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Words</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analytics.words.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Reading Time</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {analytics.estimatedReadingTime >= 60
                      ? `${Math.floor(analytics.estimatedReadingTime / 60)}h ${analytics.estimatedReadingTime % 60}m`
                      : `${analytics.estimatedReadingTime} min`
                    }
                  </p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-xl">
                  <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Est. Pages</p>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{estimatedPages}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-4 rounded-xl">
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Avg Words/Section</p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{analytics.avgWordsPerSection.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Completion</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{analytics.completionPercentage}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{analytics.sectionsWithContent} sections complete</span>
                <span>{analytics.sectionsRemaining} sections remaining</span>
              </div>
            </div>

            {/* Per-Chapter Stats */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Section Breakdown</h4>
              <div className="space-y-1 max-h-64 overflow-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {chapterStats.map(({ chapter, words, depth, isChapter }) => (
                  <div
                    key={chapter.id}
                    className={`flex items-center justify-between p-3 ${
                      isChapter
                        ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                        : 'bg-white dark:bg-gray-800'
                    } ${depth > 0 ? 'border-l-2 border-gray-300 dark:border-gray-600' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 20}px` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isChapter ? (
                        <BookOpen className={`h-4 w-4 flex-shrink-0 ${words > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                      ) : (
                        <FileText className={`h-4 w-4 flex-shrink-0 ${words > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-sm truncate ${isChapter ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {chapter.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0">
                      {words > 0 ? (
                        <>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {words.toLocaleString()} words
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            ~{Math.ceil(words / 200)} min
                          </span>
                          <Check className="h-4 w-4 text-green-500" />
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">Not written</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setModalType('none')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Chapter Editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage chapters, generate content with AI, and customize features.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalType('book-features')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-medium transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Book Features
            {(bookConfig.bookFeatures || BOOK_LEVEL_FEATURES).filter(f => f.enabled).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {(bookConfig.bookFeatures || BOOK_LEVEL_FEATURES).filter(f => f.enabled).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setModalType('analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg font-medium transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => {
              setAddChapterParentId(null);
              setNewChapterTitle('');
              setModalType('add-chapter');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </button>
        </div>
      </div>

      {/* Chapter/Sub-chapter Generation Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Generation Inheritance</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            When you generate content for a chapter, all sub-chapters will also be generated using the parent&apos;s settings.
            To generate only a specific sub-chapter, select it directly from the list.
          </p>
        </div>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Chapter Table */}
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* Book Header with Title and Cover */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              {/* Cover Image */}
              <button
                onClick={() => {
                  setTempCoverImageUrl(bookConfig.coverImage || '');
                  setModalType('cover-image');
                }}
                className="relative flex-shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gray-700 overflow-hidden transition-colors group"
                title="Set book cover"
              >
                {bookConfig.coverImage ? (
                  <img
                    src={bookConfig.coverImage}
                    alt="Book cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-purple-500">
                    <Image className="h-5 w-5" />
                    <span className="text-[9px] mt-0.5">Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Edit3 className="h-4 w-4 text-white" />
                </div>
              </button>
              {/* Title and Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                  {bookConfig.title || 'Untitled Book'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  by {bookConfig.author || 'Unknown Author'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {bookConfig.tableOfContents.chapters.length} chapters
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Table of Contents</h4>
          </div>
          <div className="flex-1 overflow-auto">
            {bookConfig.tableOfContents.chapters.length > 0 ? (
              renderChapterRows(bookConfig.tableOfContents.chapters)
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No chapters yet. Click &quot;Add Chapter&quot; to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop when expanded */}
        {isEditorExpanded && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsEditorExpanded(false)}
          />
        )}

        {/* Editor Area */}
        <div className={`
          ${isEditorExpanded
            ? 'fixed inset-4 z-50 shadow-2xl'
            : 'flex-1'
          }
          bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col
        `}>
          {selectedChapter ? (
            <>
              {/* Chapter Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChapter.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedChapter.selectedProvider && (
                        <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {selectedChapter.selectedProvider === 'claude' ? 'Claude' :
                           selectedChapter.selectedProvider === 'openai' ? 'OpenAI' :
                           selectedChapter.selectedProvider === 'gemini' ? 'Gemini' :
                           selectedChapter.selectedProvider === 'openrouter' ? 'OpenRouter' :
                           selectedChapter.selectedProvider}
                        </span>
                      )}
                      {selectedChapter.selectedModel && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedChapter.selectedModel}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`
                          px-3 py-1.5 text-sm font-medium flex items-center gap-1
                          ${viewMode === 'edit'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`
                          px-3 py-1.5 text-sm font-medium flex items-center gap-1
                          ${viewMode === 'preview'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                    </div>
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={isEditorExpanded ? 'Exit fullscreen' : 'Expand editor'}
                    >
                      {isEditorExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setEditorTab('ai-generate')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2
                    ${editorTab === 'ai-generate'
                      ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Wand2 className="h-4 w-4" />
                  AI Generate
                </button>
                <button
                  onClick={() => setEditorTab('manual-write')}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2
                    ${editorTab === 'manual-write'
                      ? 'text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Pencil className="h-4 w-4" />
                  Manual Write
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-4">
                {editorTab === 'ai-generate' ? (
                  <div className="space-y-4">
                    {/* Description Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chapter Description / Prompt
                      </label>
                      <textarea
                        value={chapterDescription}
                        onChange={(e) => setChapterDescription(e.target.value)}
                        placeholder="Describe what this chapter should cover..."
                        className="w-full h-24 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Word Count Setting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Word Count
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="500"
                          max="10000"
                          step="500"
                          value={targetWordCount}
                          onChange={(e) => setTargetWordCount(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            min="100"
                            max="20000"
                            value={targetWordCount}
                            onChange={(e) => setTargetWordCount(Math.max(100, Math.min(20000, Number(e.target.value))))}
                            className="w-24 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">words</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Estimated reading time: ~{Math.ceil(targetWordCount / 200)} minutes
                      </p>
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={generateChapterContent}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Content
                          </>
                        )}
                      </button>
                      {editedContent && (
                        <button
                          onClick={generateChapterContent}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </button>
                      )}
                    </div>

                    {/* Selected Features Display */}
                    {selectedChapter.selectedFeatures && selectedChapter.selectedFeatures.length > 0 && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                          Selected Features ({selectedChapter.selectedFeatures.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedChapter.selectedFeatures.map(featureId => {
                            const feature = MYST_FEATURES_DATA.find(f => f.id === featureId);
                            return feature ? (
                              <span
                                key={featureId}
                                className="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded"
                              >
                                {feature.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Generation Metadata & Feature Audit */}
                    {(generationMetadata || featureAudit) && editedContent && (
                      <div className="space-y-3">
                        {/* Generation Metadata */}
                        {generationMetadata && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Generation Stats
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Word Count:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {generationMetadata.wordCount?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Target:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">{targetWordCount.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Stop Reason:</span>
                                <span className={`ml-1 font-medium ${
                                  generationMetadata.stopReason === 'end_turn'
                                    ? 'text-green-600 dark:text-green-400'
                                    : generationMetadata.stopReason === 'continuing'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : generationMetadata.stopReason === 'max_tokens' || generationMetadata.stopReason === 'stream_truncated'
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {generationMetadata.stopReason === 'continuing'
                                    ? `Continuing... (${continuationAttempts}/${MAX_CONTINUATION_ATTEMPTS})`
                                    : generationMetadata.stopReason || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Tokens:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {generationMetadata.outputTokens?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                            {generationMetadata.wordCount && generationMetadata.wordCount < targetWordCount * 0.8 && generationMetadata.stopReason !== 'continuing' && (
                              <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Content is below 80% of target word count. Consider regenerating.
                              </p>
                            )}
                            {isContinuing && (
                              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Auto-continuing from truncation point...
                              </p>
                            )}
                          </div>
                        )}

                        {/* Feature Audit Results */}
                        {featureAudit && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Feature Audit
                              <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                                featureAudit.missingFeatures.length === 0
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                              }`}>
                                {featureAudit.foundFeatures.length}/{featureAudit.selectedFeatures.length} features found
                              </span>
                            </p>

                            {featureAudit.foundFeatures.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                                  ✓ Found ({featureAudit.foundFeatures.length}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {featureAudit.foundFeatures.map(featureId => {
                                    const feature = MYST_FEATURES_DATA.find(f => f.id === featureId);
                                    return (
                                      <span
                                        key={featureId}
                                        className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                                      >
                                        {feature?.name || featureId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {featureAudit.missingFeatures.length > 0 && (
                              <div>
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
                                  ✗ Missing ({featureAudit.missingFeatures.length}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {featureAudit.missingFeatures.map(featureId => {
                                    const feature = MYST_FEATURES_DATA.find(f => f.id === featureId);
                                    return (
                                      <span
                                        key={featureId}
                                        className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded"
                                      >
                                        {feature?.name || featureId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generated Content */}
                    {viewMode === 'edit' ? (
                      <>
                        {/* Fullscreen backdrop */}
                        {isContentEditorFullscreen && (
                          <div
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setIsContentEditorFullscreen(false)}
                          />
                        )}
                        {/* Editor container */}
                        <div className={`
                          ${isContentEditorFullscreen
                            ? 'fixed inset-4 z-50 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl'
                            : 'relative'
                          }
                        `}>
                          {/* Editor toolbar */}
                          <div className={`flex items-center justify-between gap-2 mb-2 ${isContentEditorFullscreen ? 'p-4 border-b border-gray-200 dark:border-gray-700' : ''}`}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUseRawEditor(false)}
                                disabled={hasMystSyntax(editedContent)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  !useRawEditor
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } ${hasMystSyntax(editedContent) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={hasMystSyntax(editedContent) ? 'Rich Editor cannot parse MyST syntax' : 'Switch to Rich Editor'}
                              >
                                Rich Editor
                              </button>
                              <button
                                onClick={() => setUseRawEditor(true)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  useRawEditor
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                Raw Markdown
                              </button>
                              {hasMystSyntax(editedContent) && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  MyST syntax detected
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setIsContentEditorFullscreen(!isContentEditorFullscreen)}
                              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title={isContentEditorFullscreen ? 'Exit fullscreen (Esc)' : 'Expand editor'}
                            >
                              {isContentEditorFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                              ) : (
                                <Maximize2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {/* Editor content */}
                          <div className={isContentEditorFullscreen ? 'flex-1 overflow-auto p-4 pt-0' : ''}>
                            {useRawEditor ? (
                              <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                placeholder="Write your content in MyST Markdown format..."
                                className={`w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  isContentEditorFullscreen ? 'h-full' : 'min-h-[300px]'
                                }`}
                              />
                            ) : (
                              <ForwardRefEditor
                                ref={editorRef}
                                markdown={editedContent}
                                onChange={setEditedContent}
                                onImageUpload={uploadImage}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-auto">
                        <MystPreview content={editedContent} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Write your chapter content directly in MyST Markdown
                      </label>
                      {editedContent && (
                        <button
                          onClick={formatWithAI}
                          disabled={isFormatting}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Enhance your content with MyST formatting and selected features"
                        >
                          {isFormatting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Formatting...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4" />
                              Format with AI
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Info about Format with AI */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Write your content, then use &quot;Format with AI&quot; to enhance it with MyST features and professional formatting.
                    </p>

                    {/* Selected Features for formatting */}
                    {selectedChapter.selectedFeatures && selectedChapter.selectedFeatures.length > 0 && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3 text-xs">
                        <span className="font-medium text-blue-700 dark:text-blue-300">
                          Features to apply:
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 ml-1">
                          {selectedChapter.selectedFeatures.map(id => {
                            const feature = MYST_FEATURES_DATA.find(f => f.id === id);
                            return feature?.name;
                          }).filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {viewMode === 'edit' ? (
                      <>
                        {/* Fullscreen backdrop */}
                        {isContentEditorFullscreen && (
                          <div
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setIsContentEditorFullscreen(false)}
                          />
                        )}
                        {/* Editor container */}
                        <div className={`
                          ${isContentEditorFullscreen
                            ? 'fixed inset-4 z-50 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl'
                            : 'relative flex-1'
                          }
                        `}>
                          {/* Editor toolbar */}
                          <div className={`flex items-center justify-between gap-2 mb-2 ${isContentEditorFullscreen ? 'p-4 border-b border-gray-200 dark:border-gray-700' : ''}`}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUseRawEditor(false)}
                                disabled={hasMystSyntax(editedContent)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  !useRawEditor
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } ${hasMystSyntax(editedContent) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={hasMystSyntax(editedContent) ? 'Rich Editor cannot parse MyST syntax' : 'Switch to Rich Editor'}
                              >
                                Rich Editor
                              </button>
                              <button
                                onClick={() => setUseRawEditor(true)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  useRawEditor
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                Raw Markdown
                              </button>
                              {hasMystSyntax(editedContent) && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  MyST syntax detected
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setIsContentEditorFullscreen(!isContentEditorFullscreen)}
                              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title={isContentEditorFullscreen ? 'Exit fullscreen (Esc)' : 'Expand editor'}
                            >
                              {isContentEditorFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                              ) : (
                                <Maximize2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {/* Editor content */}
                          <div className={isContentEditorFullscreen ? 'flex-1 overflow-auto p-4 pt-0' : ''}>
                            {useRawEditor ? (
                              <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                placeholder="Write your content in MyST Markdown format..."
                                className={`w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  isContentEditorFullscreen ? 'h-full' : 'min-h-[300px]'
                                }`}
                              />
                            ) : (
                              <ForwardRefEditor
                                ref={editorRef}
                                markdown={editedContent}
                                onChange={setEditedContent}
                                onImageUpload={uploadImage}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 w-full min-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-auto">
                        <MystPreview content={editedContent} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                <div className="text-sm flex-1 mr-4">
                  {saveStatus === 'verified' && saveDetails && (
                    <div className="text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-1 font-medium">
                        <Check className="h-4 w-4" />
                        Verified: Saved to GitHub
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs">
                        {saveDetails.fileUrl && (
                          <a
                            href={saveDetails.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View File
                          </a>
                        )}
                        {saveDetails.commitUrl && (
                          <a
                            href={saveDetails.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Commit
                          </a>
                        )}
                        {saveDetails.commitSha && (
                          <span className="text-gray-500 dark:text-gray-400">
                            SHA: {saveDetails.commitSha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                      {/* Build Status */}
                      <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                        {saveDetails.workflowTriggered ? (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                Rebuilding your book...
                              </span>
                              {saveDetails.workflowRunUrl && (
                                <a
                                  href={saveDetails.workflowRunUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs ml-auto"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Build
                                </a>
                              )}
                            </div>
                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                              Your live book will update in 1-2 minutes once the build completes.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 italic">
                              Tip: Clear your browser cache to see changes (DevTools → Application → Storage → Clear site data)
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-700 dark:text-yellow-300 text-xs font-medium">
                                Build not detected yet
                              </span>
                              {saveDetails.actionsUrl && (
                                <a
                                  href={saveDetails.actionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs ml-auto"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Check Actions
                                </a>
                              )}
                            </div>
                            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                              The build may start shortly. Your book will update in 1-2 minutes.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 italic">
                              Tip: Clear your browser cache to see changes (DevTools → Application → Storage → Clear site data)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {saveStatus === 'unverified' && saveDetails && (
                    <div className="text-yellow-600 dark:text-yellow-400">
                      <div className="flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Saved but verification failed
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs">
                        {saveDetails.fileUrl && (
                          <a
                            href={saveDetails.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Check File
                          </a>
                        )}
                        <span className="text-gray-500 dark:text-gray-400">
                          Please verify manually on GitHub
                        </span>
                      </div>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Saved to GitHub
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 italic">
                        Tip: Clear your browser cache to see changes (DevTools → Application → Storage → Clear site data)
                      </p>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-1 font-medium">
                        <X className="h-4 w-4" />
                        Failed to save
                      </div>
                      {saveDetails?.error && (
                        <div className="text-xs mt-1 text-red-500 dark:text-red-400">
                          {saveDetails.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={saveChapter}
                  disabled={isSaving || !editedContent}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save to GitHub
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chapter from the list to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Overview
        </button>
        {bookConfig.github && (
          <a
            href={`https://${bookConfig.github.username}.github.io/${bookConfig.github.repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            View Live Book
          </a>
        )}
      </div>

      {/* Modals */}
      {renderFeaturesModal()}
      {renderBookFeaturesModal()}
      {renderSystemPromptModal()}
      {renderAddChapterModal()}
      {renderAnalyticsModal()}
      {renderCoverImageModal()}
    </div>
  );
}
