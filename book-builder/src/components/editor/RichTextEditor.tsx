'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Image as ImageIcon,
  FileCode,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// Toolbar divider
function ToolbarDivider() {
  return <div className="h-6 w-px bg-gray-700 mx-1" />;
}

// Main toolbar component
function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertAdmonition = (type: 'note' | 'tip' | 'warning' | 'important') => {
    // Insert MyST admonition block as raw text
    const admonition = `\n:::{${type}}\nContent here\n:::\n`;
    editor.chain().focus().insertContent(admonition).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-700 bg-gray-900/50">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <FileCode className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Media */}
      <ToolbarButton onClick={addImage} title="Insert Image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Admonitions (MyST) */}
      <div className="relative group">
        <ToolbarButton onClick={() => {}} title="Insert Admonition">
          <Info className="h-4 w-4" />
        </ToolbarButton>
        <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl hidden group-hover:block z-10 min-w-[140px]">
          <button
            onClick={() => insertAdmonition('note')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Info className="h-4 w-4 text-blue-400" />
            Note
          </button>
          <button
            onClick={() => insertAdmonition('tip')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Lightbulb className="h-4 w-4 text-green-400" />
            Tip
          </button>
          <button
            onClick={() => insertAdmonition('warning')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Warning
          </button>
          <button
            onClick={() => insertAdmonition('important')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <AlertCircle className="h-4 w-4 text-red-400" />
            Important
          </button>
        </div>
      </div>
    </div>
  );
}

// Convert markdown to HTML for TipTap
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Convert bullet lists
  const listItems = html.match(/^- .+$/gm);
  if (listItems) {
    let inList = false;
    const lines = html.split('\n');
    const processed: string[] = [];

    for (const line of lines) {
      if (line.match(/^- /)) {
        if (!inList) {
          processed.push('<ul>');
          inList = true;
        }
        processed.push(`<li>${line.replace(/^- /, '')}</li>`);
      } else {
        if (inList) {
          processed.push('</ul>');
          inList = false;
        }
        processed.push(line);
      }
    }
    if (inList) processed.push('</ul>');
    html = processed.join('\n');
  }

  // Convert blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Convert paragraphs (simple approach)
  html = html.replace(/^([^<\n].+)$/gm, '<p>$1</p>');

  // Remove empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  return html;
}

// Convert HTML from TipTap to markdown
function htmlToMarkdown(html: string): string {
  let md = html;

  // Convert headers
  md = md.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n');

  // Convert bold
  md = md.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');

  // Convert italic
  md = md.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');

  // Convert underline (no markdown equivalent, use raw)
  md = md.replace(/<u[^>]*>([^<]+)<\/u>/gi, '<u>$1</u>');

  // Convert strikethrough
  md = md.replace(/<s[^>]*>([^<]+)<\/s>/gi, '~~$1~~');

  // Convert inline code
  md = md.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');

  // Convert code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```');

  // Convert images
  md = md.replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, '![]($1)');

  // Convert unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  });

  // Convert ordered lists
  let counter = 0;
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    counter = 0;
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
      counter++;
      return `${counter}. $1\n`;
    });
  });

  // Convert blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n');

  // Convert paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // Convert horizontal rules
  md = md.replace(/<hr[^>]*\/?>/gi, '\n---\n');

  // Convert line breaks
  md = md.replace(/<br[^>]*\/?>/gi, '\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&quot;/g, '"');

  // Clean up multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your chapter content...',
      }),
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
  });

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(content));
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      <Toolbar editor={editor} />
      <div className="h-96 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: white;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: white;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          color: #d1d5db;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          color: #d1d5db;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #9ca3af;
        }
        .ProseMirror code {
          background-color: #374151;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          color: #a78bfa;
        }
        .ProseMirror pre {
          background-color: #111827;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: #10b981;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #374151;
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror strong {
          font-weight: 700;
          color: white;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
