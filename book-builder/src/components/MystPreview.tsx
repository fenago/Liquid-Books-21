'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  BookOpen,
  Flame,
  Bug,
  Quote,
  HelpCircle,
} from 'lucide-react';

interface MystPreviewProps {
  content: string;
  className?: string;
}

// Detect and parse MyST admonition blocks
interface AdmonitionBlock {
  type: string;
  title: string;
  content: string;
}

const admonitionIcons: Record<string, React.ReactNode> = {
  note: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  danger: <Flame className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  tip: <Lightbulb className="h-5 w-5" />,
  hint: <Lightbulb className="h-5 w-5" />,
  important: <AlertCircle className="h-5 w-5" />,
  caution: <AlertTriangle className="h-5 w-5" />,
  attention: <AlertTriangle className="h-5 w-5" />,
  seealso: <BookOpen className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  question: <HelpCircle className="h-5 w-5" />,
  quote: <Quote className="h-5 w-5" />,
  debug: <Bug className="h-5 w-5" />,
};

const admonitionColors: Record<string, { bg: string; border: string; icon: string; title: string }> = {
  note: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', icon: 'text-blue-600', title: 'text-blue-800 dark:text-blue-200' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', icon: 'text-amber-600', title: 'text-amber-800 dark:text-amber-200' },
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', icon: 'text-red-600', title: 'text-red-800 dark:text-red-200' },
  error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', icon: 'text-red-600', title: 'text-red-800 dark:text-red-200' },
  tip: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', icon: 'text-green-600', title: 'text-green-800 dark:text-green-200' },
  hint: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-500', icon: 'text-teal-600', title: 'text-teal-800 dark:text-teal-200' },
  important: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', icon: 'text-purple-600', title: 'text-purple-800 dark:text-purple-200' },
  caution: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500', icon: 'text-orange-600', title: 'text-orange-800 dark:text-orange-200' },
  attention: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', icon: 'text-yellow-600', title: 'text-yellow-800 dark:text-yellow-200' },
  seealso: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-500', icon: 'text-indigo-600', title: 'text-indigo-800 dark:text-indigo-200' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-500', icon: 'text-emerald-600', title: 'text-emerald-800 dark:text-emerald-200' },
  question: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-500', icon: 'text-cyan-600', title: 'text-cyan-800 dark:text-cyan-200' },
  quote: { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-400', icon: 'text-gray-600', title: 'text-gray-800 dark:text-gray-200' },
  debug: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', icon: 'text-pink-600', title: 'text-pink-800 dark:text-pink-200' },
};

function Admonition({ type, title, content }: AdmonitionBlock) {
  const colors = admonitionColors[type] || admonitionColors.note;
  const icon = admonitionIcons[type] || admonitionIcons.note;
  const displayTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className={`my-4 rounded-lg border-l-4 ${colors.border} ${colors.bg} p-4`}>
      <div className={`flex items-center gap-2 font-semibold ${colors.title} mb-2`}>
        <span className={colors.icon}>{icon}</span>
        {displayTitle}
      </div>
      <div className="text-gray-700 dark:text-gray-300 text-sm prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// Parse MyST admonitions from content
function parseAdmonitions(content: string): (string | AdmonitionBlock)[] {
  const admonitionPattern = /```\{(note|warning|danger|error|tip|hint|important|caution|attention|seealso|success|question|quote|debug)\}(?:\s+([^\n]*))?\n([\s\S]*?)```/gi;
  const directivePattern = /:::\{(note|warning|danger|error|tip|hint|important|caution|attention|seealso|success|question|quote|debug)\}(?:\s+([^\n]*))?\n([\s\S]*?):::/gi;

  const parts: (string | AdmonitionBlock)[] = [];
  let lastIndex = 0;
  let match;

  // Create a combined pattern to find both styles
  const combinedContent = content;
  const allMatches: { index: number; length: number; block: AdmonitionBlock }[] = [];

  // Find all ```{type}...``` style admonitions
  while ((match = admonitionPattern.exec(combinedContent)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      block: {
        type: match[1].toLowerCase(),
        title: match[2]?.trim() || '',
        content: match[3].trim(),
      },
    });
  }

  // Find all :::{type}...:::: style admonitions
  while ((match = directivePattern.exec(combinedContent)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      block: {
        type: match[1].toLowerCase(),
        title: match[2]?.trim() || '',
        content: match[3].trim(),
      },
    });
  }

  // Sort by index
  allMatches.sort((a, b) => a.index - b.index);

  // Build parts array
  for (const m of allMatches) {
    if (m.index > lastIndex) {
      parts.push(content.slice(lastIndex, m.index));
    }
    parts.push(m.block);
    lastIndex = m.index + m.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

// Parse tab content from MyST format
function parseTabs(content: string): { label: string; content: string }[] | null {
  // Look for tab-set patterns
  const tabSetMatch = content.match(/```\{tab-set\}\n([\s\S]*?)```/);
  if (!tabSetMatch) return null;

  const tabContent = tabSetMatch[1];
  const tabPattern = /```\{tab-item\}\s*([^\n]*)\n([\s\S]*?)```/g;
  const tabs: { label: string; content: string }[] = [];
  let match;

  while ((match = tabPattern.exec(tabContent)) !== null) {
    tabs.push({
      label: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return tabs.length > 0 ? tabs : null;
}

function TabSet({ tabs }: { tabs: { label: string; content: string }[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {tabs[activeTab]?.content || ''}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function MystPreview({ content, className = '' }: MystPreviewProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  if (!content) {
    return (
      <div className={`text-gray-400 italic ${className}`}>
        No content yet...
      </div>
    );
  }

  // Parse admonitions
  const parts = parseAdmonitions(content);

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // Check for tab sets in string content
          const tabs = parseTabs(part);
          if (tabs) {
            const before = part.split(/```\{tab-set\}/)[0];
            const after = part.split(/```\n/g).pop() || '';
            return (
              <div key={index}>
                {before && <ReactMarkdown remarkPlugins={[remarkGfm]}>{before}</ReactMarkdown>}
                <TabSet tabs={tabs} />
                {after && <ReactMarkdown remarkPlugins={[remarkGfm]}>{after}</ReactMarkdown>}
              </div>
            );
          }

          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                // Syntax highlighted code blocks
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !className;

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={isDark ? oneDark : oneLight}
                      language={match?.[1] || 'text'}
                      PreTag="div"
                      className="rounded-lg !my-4 text-sm"
                      showLineNumbers={true}
                      wrapLines={true}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
                // Enhanced tables
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return (
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      {children}
                    </thead>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                      {children}
                    </td>
                  );
                },
                // Blockquotes
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg italic text-gray-700 dark:text-gray-300">
                      {children}
                    </blockquote>
                  );
                },
                // Headings
                h1({ children }) {
                  return (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                      {children}
                    </h1>
                  );
                },
                h2({ children }) {
                  return (
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-5 mb-3">
                      {children}
                    </h2>
                  );
                },
                h3({ children }) {
                  return (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                      {children}
                    </h3>
                  );
                },
                // Lists
                ul({ children }) {
                  return (
                    <ul className="list-disc list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300">
                      {children}
                    </ul>
                  );
                },
                ol({ children }) {
                  return (
                    <ol className="list-decimal list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300">
                      {children}
                    </ol>
                  );
                },
                // Links
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                // Images
                img({ src, alt }) {
                  return (
                    <figure className="my-4">
                      <img
                        src={src}
                        alt={alt || ''}
                        className="rounded-lg shadow-md max-w-full h-auto"
                      />
                      {alt && (
                        <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  );
                },
                // Horizontal rule
                hr() {
                  return <hr className="my-6 border-gray-200 dark:border-gray-700" />;
                },
                // Paragraphs
                p({ children }) {
                  return (
                    <p className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {children}
                    </p>
                  );
                },
              }}
            >
              {part}
            </ReactMarkdown>
          );
        } else {
          // Render admonition
          return <Admonition key={index} {...part} />;
        }
      })}
    </div>
  );
}
