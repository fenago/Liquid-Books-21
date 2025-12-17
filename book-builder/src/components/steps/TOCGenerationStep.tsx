'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { Chapter } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardPaste,
  Settings,
  Eye,
  EyeOff,
  Copy,
  X,
} from 'lucide-react';

type Mode = 'choose' | 'generate' | 'manual' | 'import';

export function TOCGenerationStep() {
  const {
    aiConfig,
    bookConfig,
    setTableOfContents,
    addChapter,
    updateChapter,
    removeChapter,
    setCurrentStep,
  } = useBookStore();

  const [mode, setMode] = useState<Mode>('choose');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [importText, setImportText] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Default system prompt for TOC generation (matches route.ts)
  const defaultTocSystemPrompt = `You are an expert technical book author. Generate a table of contents as a JSON array.

CRITICAL: Output COMPACT JSON with NO descriptions to avoid truncation. Use this minimal structure:
[{"id":"ch-1","title":"Chapter Title","slug":"chapter-slug","children":[{"id":"ch-1-1","title":"Sub Title","slug":"sub-slug"}]}]

Rules:
- NO description field (saves tokens)
- Short IDs: ch-1, ch-1-1, ch-2, etc.
- Slugs: lowercase with hyphens
- Keep hierarchy flat when possible (max 2 levels deep)
- Aim for 8-15 main chapters
- Output ONLY valid JSON array, no markdown, no explanation
- Ensure JSON is COMPLETE - do not truncate`;

  // Default system prompt for import/parsing
  const defaultImportSystemPrompt = `Parse this outline into COMPACT JSON. CRITICAL: NO descriptions, use short IDs.

Output format (COMPACT - no descriptions, no extra whitespace):
[{"id":"ch-1","title":"Title","slug":"slug","children":[{"id":"ch-1-1","title":"Sub","slug":"sub"}]}]

Rules:
- Keep EXACT titles from input
- Short IDs: ch-1, ch-1-2, ch-2, etc.
- Slugs: lowercase-with-hyphens
- NO description field
- NO extra whitespace or newlines in JSON
- Preserve original order
- Output ONLY the JSON array`;

  const handleGenerateTOC = async () => {
    if (!aiConfig.provider || !aiConfig.apiKey || !aiConfig.selectedModel) {
      setError('AI is not configured properly');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLoadingMessage('Connecting to AI...');

    // Rotate loading messages
    const messages = [
      'Analyzing your book description...',
      'Planning chapter structure...',
      'Organizing topics...',
      'Generating table of contents...',
      'Almost there...',
    ];
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 3000);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          model: aiConfig.selectedModel,
          type: 'toc',
          prompt: `Create a comprehensive table of contents for a book with the following details:

Title: ${bookConfig.title}
Author: ${bookConfig.author}
Description: ${bookConfig.description}

Generate a logical, well-structured table of contents that covers all the topics mentioned in the description. Include practical examples, exercises, and hands-on sections where appropriate.`,
          context: useCustomPrompt && customSystemPrompt ? {
            systemPromptOverride: customSystemPrompt
          } : undefined,
        }),
      });

      // Check if this is a streaming response (Claude)
      const contentType = response.headers.get('content-type');
      let content: string;

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        setLoadingMessage('Receiving AI response...');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                }
                if (data.done && data.content) {
                  accumulatedContent = data.content;
                }
              } catch (parseError) {
                // Skip invalid JSON lines (partial data)
                if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                  if (parseError.message.includes('error')) {
                    throw parseError;
                  }
                }
              }
            }
          }
        }

        content = accumulatedContent;
      } else {
        // Non-streaming response (OpenAI, Gemini)
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate TOC');
        }

        content = data.content;
      }

      setLoadingMessage('Parsing response...');
      const chapters = parseTOCResponse(content);
      setTableOfContents(chapters);
      setMode('manual');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate TOC');
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleImportTOC = async () => {
    if (!aiConfig.provider || !aiConfig.apiKey || !aiConfig.selectedModel) {
      setError('AI is not configured properly');
      return;
    }

    if (!importText.trim()) {
      setError('Please paste your table of contents text');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLoadingMessage('Analyzing your text...');

    // Rotate loading messages for import
    const messages = [
      'Identifying chapters...',
      'Detecting hierarchy...',
      'Structuring content...',
      'Building table of contents...',
    ];
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2500);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          model: aiConfig.selectedModel,
          type: 'toc',
          prompt: `Parse this outline into COMPACT JSON. CRITICAL: NO descriptions, use short IDs.

TEXT:
${importText}

Output format (COMPACT - no descriptions, no extra whitespace):
[{"id":"ch-1","title":"Title","slug":"slug","children":[{"id":"ch-1-1","title":"Sub","slug":"sub"}]}]

Rules:
- Keep EXACT titles from input
- Short IDs: ch-1, ch-1-2, ch-2, etc.
- Slugs: lowercase-with-hyphens
- NO description field
- NO extra whitespace or newlines in JSON
- Preserve original order
- Output ONLY the JSON array`,
        }),
      });

      // Check if this is a streaming response (Claude)
      const contentType = response.headers.get('content-type');
      let content: string;

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        setLoadingMessage('Receiving AI response...');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                }
                if (data.done && data.content) {
                  accumulatedContent = data.content;
                }
              } catch (parseError) {
                // Skip invalid JSON lines (partial data)
                if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                  if (parseError.message.includes('error')) {
                    throw parseError;
                  }
                }
              }
            }
          }
        }

        content = accumulatedContent;
      } else {
        // Non-streaming response (OpenAI, Gemini)
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse TOC');
        }

        content = data.content;
      }

      setLoadingMessage('Parsing response...');
      const chapters = parseTOCResponse(content);
      setTableOfContents(chapters);
      setMode('manual');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse TOC');
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const parseTOCResponse = (content: string): Chapter[] => {
    let jsonStr = content;

    // Extract from markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Try to find JSON array
      const arrayMatch = content.match(/\[[\s\S]*/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    // Try parsing as-is first
    try {
      return JSON.parse(jsonStr);
    } catch (firstError) {
      console.log('Initial parse failed, attempting JSON repair...');
    }

    // Attempt to repair truncated JSON
    try {
      const repaired = repairTruncatedJSON(jsonStr);
      console.log('Repaired JSON length:', repaired.length);
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error('JSON repair failed:', repairError);
      console.error('Raw content (first 500 chars):', content.substring(0, 500));
      console.error('Raw content (last 500 chars):', content.substring(content.length - 500));
      throw new Error(
        'The AI response was truncated or invalid. This usually happens with very large outlines. ' +
        'Try simplifying your outline or using fewer chapters.'
      );
    }
  };

  // Attempt to repair truncated JSON by closing open brackets
  const repairTruncatedJSON = (json: string): string => {
    let str = json.trim();

    // Remove any trailing incomplete strings (cut off mid-value)
    // Look for patterns like: "title": "Some text... (no closing quote)
    const lastCompleteItem = str.lastIndexOf('}');
    const lastQuote = str.lastIndexOf('"');
    const lastColon = str.lastIndexOf(':');

    // If we're in the middle of a string value, truncate there
    if (lastColon > lastCompleteItem && lastQuote > lastColon) {
      // We might be mid-value, try to find the last complete object
      const truncatePoint = str.lastIndexOf('},');
      if (truncatePoint > 0) {
        str = str.substring(0, truncatePoint + 1);
      } else {
        // Try just the last complete object
        str = str.substring(0, lastCompleteItem + 1);
      }
    } else if (lastColon > lastCompleteItem) {
      // We're after a colon but no closing - truncate to last complete item
      const truncatePoint = str.lastIndexOf('},');
      if (truncatePoint > 0) {
        str = str.substring(0, truncatePoint + 1);
      }
    }

    // Count open brackets and braces
    let openBrackets = 0;
    let openBraces = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
        else if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
      }
    }

    // Close any open structures
    // First close objects, then arrays
    while (openBraces > 0) {
      str += '}';
      openBraces--;
    }
    while (openBrackets > 0) {
      str += ']';
      openBrackets--;
    }

    return str;
  };

  const handleAddChapter = (parentId?: string) => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: 'New Chapter',
      slug: `new-chapter-${Date.now()}`,
      description: '',
    };
    addChapter(newChapter, parentId);
  };

  const toggleExpand = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleBack = () => {
    if (mode !== 'choose') {
      setMode('choose');
      setError(null);
    } else {
      setCurrentStep('book-description');
    }
  };

  const handleContinue = () => {
    setCurrentStep('feature-selection');
  };

  const canContinue = bookConfig.tableOfContents.chapters.length > 0;

  // Render chapter tree
  const renderChapter = (chapter: Chapter, depth = 0) => {
    const hasChildren = chapter.children && chapter.children.length > 0;
    const isExpanded = expandedChapters.has(chapter.id);

    return (
      <div key={chapter.id} className="group">
        <div
          className={`
            flex items-center gap-2 p-3 rounded-lg
            bg-gray-50 dark:bg-gray-700/50
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
          `}
          style={{ marginLeft: depth * 24 }}
        >
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />

          {hasChildren ? (
            <button onClick={() => toggleExpand(chapter.id)} className="p-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <input
            type="text"
            value={chapter.title}
            onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
            className="
              flex-1 px-2 py-1 bg-transparent border-b border-transparent
              hover:border-gray-300 dark:hover:border-gray-600
              focus:border-blue-500 focus:outline-none
              text-gray-900 dark:text-white
            "
          />

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddChapter(chapter.id)}
              className="p-1 text-gray-400 hover:text-blue-500"
              title="Add sub-chapter"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeChapter(chapter.id)}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Remove chapter"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-chapters */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {chapter.children!.map((child) => renderChapter(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Table of Contents
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate a table of contents using AI, import from existing text, or create one manually.
        </p>
      </div>

      {/* Mode Selection */}
      {mode === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              handleGenerateTOC();
            }}
            disabled={isGenerating}
            className="
              p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700
              hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
              text-left transition-all group
            "
          >
            <div className="flex items-center gap-3 mb-3">
              {isGenerating ? (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              ) : (
                <Sparkles className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generate with AI
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Let AI create a table of contents based on your book description.
            </p>
          </button>

          <button
            onClick={() => setMode('import')}
            className="
              p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700
              hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20
              text-left transition-all group
            "
          >
            <div className="flex items-center gap-3 mb-3">
              <ClipboardPaste className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import from Text
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Paste your existing TOC or outline and AI will parse it into chapters.
            </p>
          </button>

          <button
            onClick={() => setMode('manual')}
            className="
              p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700
              hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20
              text-left transition-all group
            "
          >
            <div className="flex items-center gap-3 mb-3">
              <Edit3 className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Manually
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Build your table of contents from scratch, one chapter at a time.
            </p>
          </button>
        </div>
      )}

      {/* System Prompt Settings - visible in choose mode */}
      {mode === 'choose' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">System Prompt Settings</h3>
            </div>
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showSystemPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSystemPrompt ? 'Hide' : 'View'} Default Prompt
            </button>
          </div>

          {showSystemPrompt && (
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  DEFAULT SYSTEM PROMPT (READ-ONLY)
                </span>
                <button
                  onClick={() => {
                    setCustomSystemPrompt(defaultTocSystemPrompt);
                    setUseCustomPrompt(true);
                    setShowSystemPrompt(false);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Copy className="h-3 w-3" />
                  Copy to Custom
                </button>
              </div>
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                {defaultTocSystemPrompt}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="useCustomPrompt"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useCustomPrompt" className="text-sm text-gray-700 dark:text-gray-300">
              Use custom system prompt
            </label>
          </div>

          {useCustomPrompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom System Prompt
                </label>
                {customSystemPrompt && (
                  <button
                    onClick={() => setCustomSystemPrompt('')}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="Enter your custom system prompt for TOC generation..."
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This prompt will be sent to the AI instead of the default. Make sure to include instructions for JSON output format.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && !isGenerating && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste your table of contents or outline
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Example:
1. Introduction
   - What is this book about
   - Who should read this
2. Getting Started
   - Installation
   - First steps
3. Core Concepts
   3.1 Basic principles
   3.2 Advanced techniques
4. Conclusion`}
              rows={12}
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                font-mono text-sm
              "
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Paste any format: numbered lists, bullet points, indented outlines, markdown headers, etc.
              AI will figure out the structure.
            </p>
          </div>

          <button
            onClick={handleImportTOC}
            disabled={isGenerating || !importText.trim()}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
              bg-purple-600 hover:bg-purple-700 text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Parse with AI
              </>
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

      {/* TOC Editor */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chapters
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('import')}
                className="
                  flex items-center gap-2 px-3 py-1.5 text-sm
                  text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20
                  rounded-lg transition-colors
                "
              >
                <ClipboardPaste className="h-4 w-4" />
                Import Text
              </button>
              <button
                onClick={() => handleGenerateTOC()}
                disabled={isGenerating}
                className="
                  flex items-center gap-2 px-3 py-1.5 text-sm
                  text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                  rounded-lg transition-colors
                "
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Regenerate with AI
              </button>
              <button
                onClick={() => handleAddChapter()}
                className="
                  flex items-center gap-2 px-3 py-1.5 text-sm
                  bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400
                  hover:bg-green-200 dark:hover:bg-green-900/50
                  rounded-lg transition-colors
                "
              >
                <Plus className="h-4 w-4" />
                Add Chapter
              </button>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookConfig.tableOfContents.chapters.length > 0 ? (
              bookConfig.tableOfContents.chapters.map((chapter) =>
                renderChapter(chapter)
              )
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="mb-4">No chapters yet</p>
                <button
                  onClick={() => handleAddChapter()}
                  className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-blue-600 hover:bg-blue-700 text-white
                    rounded-lg transition-colors
                  "
                >
                  <Plus className="h-4 w-4" />
                  Add First Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generating State */}
      {isGenerating && (mode === 'choose' || mode === 'import') && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {loadingMessage || 'Processing...'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            This may take 15-30 seconds depending on the AI model
          </p>
          <div className="mt-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
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
