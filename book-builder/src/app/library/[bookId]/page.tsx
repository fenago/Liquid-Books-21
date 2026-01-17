'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBook, useBooks } from '@/lib/supabase/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { AuthGate } from '@/components/auth/AuthGate';
import { LQ21Chapter } from '@/lib/supabase/types';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import {
  BookOpen,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Eye,
  Code,
  Wand2,
  FileText,
  ListOrdered,
  Settings2,
  Loader2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  BookMarked,
  Upload,
  Github,
  ExternalLink,
  CheckCircle,
  Circle,
  PenLine,
} from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'raw' | 'formatted' | 'rich';

interface ChapterEditorState {
  chapterId: string;
  isOpen: boolean;
  viewMode: ViewMode;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isGenerating: boolean;
  isSaving: boolean;
}

interface GeneratorSettings {
  systemPrompt: string;
  targetWordCount: number;
  includeOutline: boolean;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert author writing engaging, educational content. Write in a clear, conversational style that keeps readers interested. Include practical examples, code snippets where relevant, and organize content with clear headings and sections. Use MyST Markdown formatting.`;

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const { user } = useAuth();

  const { book, loading, error, fetchBook, updateChapter, createChapter, deleteChapter } = useBook(bookId);
  const { updateBook } = useBooks();

  // Editor state for each chapter
  const [editorStates, setEditorStates] = useState<Record<string, ChapterEditorState>>({});

  // Generator settings
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    targetWordCount: 3000,
    includeOutline: true,
  });
  const [showGeneratorSettings, setShowGeneratorSettings] = useState(false);

  // TOC Generator
  const [isGeneratingTOC, setIsGeneratingTOC] = useState(false);
  const [tocPrompt, setTocPrompt] = useState('');
  const [showTOCGenerator, setShowTOCGenerator] = useState(false);

  // New chapter form
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');

  // GitHub publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Calculate total words from current editor states (more accurate)
  const calculateTotalWords = useCallback(() => {
    if (!book?.chapters) return 0;
    return book.chapters.reduce((sum, ch) => {
      const state = editorStates[ch.id];
      const content = state?.content || ch.content || '';
      return sum + content.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, [book?.chapters, editorStates]);

  // Initialize editor states when book loads
  useEffect(() => {
    if (book?.chapters) {
      const initialStates: Record<string, ChapterEditorState> = {};
      book.chapters.forEach(ch => {
        if (!editorStates[ch.id]) {
          initialStates[ch.id] = {
            chapterId: ch.id,
            isOpen: false,
            viewMode: 'raw',
            content: ch.content || '',
            originalContent: ch.content || '',
            isDirty: false,
            isGenerating: false,
            isSaving: false,
          };
        }
      });
      if (Object.keys(initialStates).length > 0) {
        setEditorStates(prev => ({ ...prev, ...initialStates }));
      }
    }
  }, [book?.chapters]);

  const toggleChapter = (chapterId: string) => {
    setEditorStates(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        isOpen: !prev[chapterId]?.isOpen,
      },
    }));
  };

  const setViewMode = (chapterId: string, mode: ViewMode) => {
    setEditorStates(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        viewMode: mode,
      },
    }));
  };

  const updateContent = (chapterId: string, content: string) => {
    setEditorStates(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        content,
        isDirty: content !== prev[chapterId]?.originalContent,
      },
    }));
  };

  const saveChapter = async (chapterId: string, newStatus?: 'draft' | 'complete') => {
    const state = editorStates[chapterId];
    if (!state) return;

    setEditorStates(prev => ({
      ...prev,
      [chapterId]: { ...prev[chapterId], isSaving: true },
    }));

    const wordCount = state.content.split(/\s+/).filter(Boolean).length;
    const updates: Partial<LQ21Chapter> = {
      content: state.content,
      word_count: wordCount,
    };

    if (newStatus) {
      updates.status = newStatus;
    }

    const success = await updateChapter(chapterId, updates);

    setEditorStates(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        isSaving: false,
        isDirty: !success,
        originalContent: success ? state.content : prev[chapterId].originalContent,
      },
    }));
  };

  const toggleChapterStatus = async (chapter: LQ21Chapter) => {
    const newStatus = chapter.status === 'complete' ? 'draft' : 'complete';
    await updateChapter(chapter.id, { status: newStatus });
  };

  const revertChapter = (chapterId: string) => {
    setEditorStates(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        content: prev[chapterId].originalContent,
        isDirty: false,
      },
    }));
  };

  const generateChapterContent = async (chapter: LQ21Chapter) => {
    setEditorStates(prev => ({
      ...prev,
      [chapter.id]: { ...prev[chapter.id], isGenerating: true },
    }));

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chapter-content',
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          bookTitle: book?.title,
          bookDescription: book?.description,
          systemPrompt: generatorSettings.systemPrompt,
          targetWordCount: generatorSettings.targetWordCount,
          includeOutline: generatorSettings.includeOutline,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const generatedContent = data.content || '';

      setEditorStates(prev => ({
        ...prev,
        [chapter.id]: {
          ...prev[chapter.id],
          content: generatedContent,
          isDirty: true,
          isGenerating: false,
        },
      }));
    } catch (err) {
      console.error('Generation error:', err);
      setEditorStates(prev => ({
        ...prev,
        [chapter.id]: { ...prev[chapter.id], isGenerating: false },
      }));
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;

    const sortOrder = (book?.chapters?.length || 0) + 1;
    const slug = newChapterTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await createChapter({
      title: newChapterTitle,
      slug,
      description: newChapterDescription || null,
      content: '',
      sort_order: sortOrder,
      word_count: 0,
      target_word_count: generatorSettings.targetWordCount,
      status: 'draft',
      chapter_features: [],
      generation_metadata: {},
    });

    setNewChapterTitle('');
    setNewChapterDescription('');
    setShowNewChapter(false);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      await deleteChapter(chapterId);
      setEditorStates(prev => {
        const newStates = { ...prev };
        delete newStates[chapterId];
        return newStates;
      });
    }
  };

  const generateTOC = async () => {
    setIsGeneratingTOC(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toc',
          bookTitle: book?.title,
          bookDescription: book?.description,
          prompt: tocPrompt || `Generate a comprehensive table of contents for "${book?.title}"`,
          numChapters: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('TOC generation failed');
      }

      const data = await response.json();
      const chapters = data.chapters || [];

      // Create chapters from generated TOC
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        await createChapter({
          title: ch.title,
          slug: ch.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: ch.description || null,
          content: '',
          sort_order: i + 1,
          word_count: 0,
          target_word_count: generatorSettings.targetWordCount,
          status: 'draft',
          chapter_features: [],
          generation_metadata: {},
        });
      }

      setShowTOCGenerator(false);
      setTocPrompt('');
    } catch (err) {
      console.error('TOC generation error:', err);
    } finally {
      setIsGeneratingTOC(false);
    }
  };

  const publishToGitHub = async () => {
    if (!book) return;

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);

    try {
      // Build book config from database
      const bookConfig = {
        title: book.title,
        description: book.description || '',
        author: book.author || 'Unknown Author',
        coverImage: book.cover_image_url,
        github: book.github_repo_name ? {
          username: book.github_username || '',
          repoName: book.github_repo_name,
        } : undefined,
        features: (book.config as Record<string, unknown>)?.features || [],
        bookFeatures: book.book_features || [],
        tableOfContents: {
          chapters: (book.chapters || []).map((ch, index) => ({
            id: ch.id,
            title: ch.title,
            slug: ch.slug,
            description: ch.description || undefined,
            content: editorStates[ch.id]?.content || ch.content || '',
            order: index + 1,
          })),
        },
      };

      // Get GitHub token from settings (stored in localStorage or user config)
      const storedConfig = localStorage.getItem('bookBuilderConfig');
      const config = storedConfig ? JSON.parse(storedConfig) : {};
      const githubToken = config.github?.token;

      if (!githubToken && !book.github_repo_url) {
        throw new Error('GitHub token not configured. Please set up GitHub in Settings first.');
      }

      const response = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          repoName: book.github_repo_name || book.slug,
          bookConfig,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish to GitHub');
      }

      // Update book with GitHub info
      await updateBook(book.id, {
        github_repo_url: result.repoUrl,
        github_username: result.username,
        github_repo_name: book.github_repo_name || book.slug,
        deployed_url: result.deployedUrl,
        status: 'published',
      });

      setPublishSuccess(true);

      // Refresh book data
      await fetchBook();

      // Auto-hide success after 5 seconds
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err) {
      console.error('Publish error:', err);
      setPublishError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const countWords = (text: string): number => {
    return text.split(/\s+/).filter(Boolean).length;
  };

  // Simple MyST markdown renderer
  const renderFormatted = (content: string): string => {
    let html = content;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-white mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-900 p-4 rounded-lg overflow-x-auto my-4"><code class="text-green-400 text-sm">$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded text-purple-300">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // MyST admonitions
    html = html.replace(/:::{(note|tip|warning|important)}\n([\s\S]*?):::/g, (_, type, content) => {
      const colors: Record<string, string> = {
        note: 'blue',
        tip: 'green',
        warning: 'yellow',
        important: 'red',
      };
      const color = colors[type] || 'gray';
      return `<div class="border-l-4 border-${color}-500 bg-${color}-500/10 p-4 my-4 rounded-r-lg">
        <div class="font-semibold text-${color}-400 mb-2 uppercase text-sm">${type}</div>
        <div class="text-gray-300">${content.trim()}</div>
      </div>`;
    });

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-300">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc my-3">$&</ul>');

    // Paragraphs
    html = html.replace(/^([^<\n].+)$/gm, '<p class="text-gray-300 my-2">$1</p>');

    return html;
  };

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </AuthGate>
    );
  }

  if (error || !book) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Book not found</h2>
            <p className="text-gray-400 mb-6">{error || 'The book you are looking for does not exist.'}</p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </div>
      </AuthGate>
    );
  }

  const totalWords = calculateTotalWords();
  const completeChapters = book.chapters?.filter(ch => ch.status === 'complete').length || 0;

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/library"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Library</span>
                </Link>
                <div className="h-6 w-px bg-gray-700" />
                <div className="flex items-center gap-3">
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="h-10 w-8 object-cover rounded"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-purple-400" />
                  )}
                  <div>
                    <h1 className="text-lg font-semibold text-white">{book.title}</h1>
                    {book.author && (
                      <p className="text-sm text-gray-400">by {book.author}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowGeneratorSettings(!showGeneratorSettings)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                <button
                  onClick={() => setShowTOCGenerator(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                >
                  <ListOrdered className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate TOC</span>
                </button>
                <button
                  onClick={publishToGitHub}
                  disabled={isPublishing || !book.chapters?.length}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Publish to GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Publish Status Messages */}
          {publishError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <X className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Publish Failed</p>
                <p className="text-red-300 text-sm">{publishError}</p>
              </div>
              <button
                onClick={() => setPublishError(null)}
                className="ml-auto p-1 text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {publishSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-400 font-medium">Published Successfully!</p>
                <p className="text-green-300 text-sm">Your book has been pushed to GitHub and will be deployed shortly.</p>
              </div>
              {book.deployed_url && (
                <a
                  href={book.deployed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Site
                </a>
              )}
            </div>
          )}

          {/* Generator Settings Panel */}
          {showGeneratorSettings && (
            <div className="mb-8 bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-purple-400" />
                  Generation Settings
                </h2>
                <button
                  onClick={() => setShowGeneratorSettings(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={generatorSettings.systemPrompt}
                    onChange={e => setGeneratorSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a custom system prompt for AI generation..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Word Count
                    </label>
                    <input
                      type="number"
                      value={generatorSettings.targetWordCount}
                      onChange={e => setGeneratorSettings(prev => ({ ...prev, targetWordCount: parseInt(e.target.value) || 3000 }))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min={500}
                      max={20000}
                      step={500}
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generatorSettings.includeOutline}
                        onChange={e => setGeneratorSettings(prev => ({ ...prev, includeOutline: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">Include chapter outline</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setGeneratorSettings({
                    systemPrompt: DEFAULT_SYSTEM_PROMPT,
                    targetWordCount: 3000,
                    includeOutline: true,
                  })}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          )}

          {/* Book Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-white">{book.chapters?.length || 0}</div>
              <div className="text-sm text-gray-400">Chapters</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-purple-400">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Words</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-green-400">
                {completeChapters}
              </div>
              <div className="text-sm text-gray-400">Complete</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2">
                {book.deployed_url ? (
                  <a
                    href={book.deployed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    <Github className="h-5 w-5" />
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <Github className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="text-sm text-gray-400">
                {book.deployed_url ? 'Published' : 'Not Published'}
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Chapters</h2>
              <button
                onClick={() => setShowNewChapter(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Chapter
              </button>
            </div>

            {/* New Chapter Form */}
            {showNewChapter && (
              <div className="bg-gray-800/50 rounded-xl border border-purple-500/50 p-6">
                <h3 className="text-lg font-medium text-white mb-4">New Chapter</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={e => setNewChapterTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter chapter title..."
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newChapterDescription}
                      onChange={e => setNewChapterDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description of chapter content..."
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowNewChapter(false);
                        setNewChapterTitle('');
                        setNewChapterDescription('');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateChapter}
                      disabled={!newChapterTitle.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg"
                    >
                      Create Chapter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Items */}
            {book.chapters?.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <BookMarked className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No chapters yet</h3>
                <p className="text-gray-400 mb-4">
                  Add chapters manually or use the TOC generator to create your book structure.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowNewChapter(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Manually
                  </button>
                  <button
                    onClick={() => setShowTOCGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate TOC
                  </button>
                </div>
              </div>
            ) : (
              book.chapters?.map((chapter, index) => {
                const state = editorStates[chapter.id] || {
                  isOpen: false,
                  viewMode: 'raw' as ViewMode,
                  content: chapter.content || '',
                  isDirty: false,
                  isGenerating: false,
                  isSaving: false,
                };

                const chapterWordCount = countWords(state.content);

                return (
                  <div
                    key={chapter.id}
                    className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                  >
                    {/* Chapter Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30"
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {state.isOpen ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-gray-500 font-mono text-sm">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{chapter.title}</h3>
                          {chapter.description && (
                            <p className="text-sm text-gray-400 line-clamp-1">{chapter.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          {chapterWordCount.toLocaleString()} words
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterStatus(chapter);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            chapter.status === 'complete'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                              : chapter.status === 'generating'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                          }`}
                          title={chapter.status === 'complete' ? 'Click to mark as draft' : 'Click to mark as complete'}
                        >
                          {chapter.status === 'complete' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {chapter.status}
                        </button>
                        {state.isDirty && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            unsaved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chapter Editor */}
                    {state.isOpen && (
                      <div className="border-t border-gray-700/50">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewMode(chapter.id, 'raw');
                                }}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                                  state.viewMode === 'raw'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                              >
                                <Code className="h-4 w-4" />
                                Raw
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewMode(chapter.id, 'rich');
                                }}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                                  state.viewMode === 'rich'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                              >
                                <PenLine className="h-4 w-4" />
                                Rich
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewMode(chapter.id, 'formatted');
                                }}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                                  state.viewMode === 'formatted'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                              >
                                <Eye className="h-4 w-4" />
                                Preview
                              </button>
                            </div>
                            <span className="text-sm text-gray-500">
                              {chapterWordCount.toLocaleString()} words
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateChapterContent(chapter);
                              }}
                              disabled={state.isGenerating}
                              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              {state.isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              Generate
                            </button>
                            {state.isDirty && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    revertChapter(chapter.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Revert
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveChapter(chapter.id);
                                  }}
                                  disabled={state.isSaving}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
                                >
                                  {state.isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  Save
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChapter(chapter.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Editor Content */}
                        <div className="p-4" onClick={(e) => e.stopPropagation()}>
                          {state.viewMode === 'raw' ? (
                            <textarea
                              value={state.content}
                              onChange={(e) => updateContent(chapter.id, e.target.value)}
                              className="w-full h-96 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                              placeholder="Enter chapter content in MyST Markdown..."
                            />
                          ) : state.viewMode === 'rich' ? (
                            <RichTextEditor
                              content={state.content}
                              onChange={(content) => updateContent(chapter.id, content)}
                              placeholder="Start writing your chapter content..."
                            />
                          ) : (
                            <div
                              className="w-full h-96 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: renderFormatted(state.content) || '<p class="text-gray-500">No content yet...</p>',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* TOC Generator Modal */}
        {showTOCGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-lg w-full">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-purple-400" />
                Generate Table of Contents
              </h3>
              <p className="text-gray-400 mb-4">
                AI will generate a structured table of contents based on your book title and description.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Instructions (optional)
                  </label>
                  <textarea
                    value={tocPrompt}
                    onChange={e => setTocPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Focus on practical examples, include exercises..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowTOCGenerator(false);
                      setTocPrompt('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateTOC}
                    disabled={isGeneratingTOC}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg"
                  >
                    {isGeneratingTOC ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
