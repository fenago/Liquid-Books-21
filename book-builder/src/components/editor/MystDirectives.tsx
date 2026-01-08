'use client';

import React from 'react';
import type { DirectiveDescriptor } from '@mdxeditor/editor';
import { NestedLexicalEditor } from '@mdxeditor/editor';
import type { ContainerDirective } from 'mdast-util-directive';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle,
  XCircle,
  BookOpen,
  ChevronDown,
  MessageSquare,
  Flame,
} from 'lucide-react';

// Admonition type configuration
const ADMONITION_CONFIG: Record<string, {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  label: string;
}> = {
  note: {
    icon: <Info className="h-5 w-5" />,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-400 dark:border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    label: 'Note',
  },
  tip: {
    icon: <Lightbulb className="h-5 w-5" />,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-400 dark:border-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    label: 'Tip',
  },
  hint: {
    icon: <Lightbulb className="h-5 w-5" />,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-400 dark:border-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    label: 'Hint',
  },
  important: {
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-400 dark:border-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300',
    label: 'Important',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-400 dark:border-amber-500',
    textColor: 'text-amber-700 dark:text-amber-300',
    label: 'Warning',
  },
  caution: {
    icon: <AlertTriangle className="h-5 w-5" />,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-400 dark:border-orange-500',
    textColor: 'text-orange-700 dark:text-orange-300',
    label: 'Caution',
  },
  attention: {
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-400 dark:border-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    label: 'Attention',
  },
  danger: {
    icon: <Flame className="h-5 w-5" />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-400 dark:border-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    label: 'Danger',
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-400 dark:border-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    label: 'Error',
  },
  seealso: {
    icon: <BookOpen className="h-5 w-5" />,
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-400 dark:border-indigo-500',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    label: 'See Also',
  },
  dropdown: {
    icon: <ChevronDown className="h-5 w-5" />,
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300',
    label: 'Dropdown',
  },
  admonition: {
    icon: <MessageSquare className="h-5 w-5" />,
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300',
    label: 'Admonition',
  },
};

// Generic admonition editor component
interface AdmonitionEditorProps {
  type: string;
}

const AdmonitionEditor: React.FC<AdmonitionEditorProps> = ({ type }) => {
  const config = ADMONITION_CONFIG[type] || ADMONITION_CONFIG.note;

  return (
    <div
      className={`my-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} overflow-hidden`}
    >
      <div className={`flex items-center gap-2 px-4 py-2 ${config.textColor} font-semibold border-b border-opacity-20 ${config.borderColor}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      <div className="px-4 py-3">
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children) => ({
            ...mdastNode,
            children: children as ContainerDirective['children'],
          })}
        />
      </div>
    </div>
  );
};

// Create a directive descriptor for each admonition type
function createAdmonitionDescriptor(name: string): DirectiveDescriptor {
  return {
    name,
    testNode(node) {
      return node.name === name;
    },
    attributes: [],
    hasChildren: true,
    Editor: () => <AdmonitionEditor type={name} />,
  };
}

// Card directive editor
const CardEditor: React.FC = () => {
  return (
    <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
        <CheckCircle className="h-5 w-5" />
        <span>Card</span>
      </div>
      <div className="px-4 py-3">
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children) => ({
            ...mdastNode,
            children: children as ContainerDirective['children'],
          })}
        />
      </div>
    </div>
  );
};

// Tab-set directive editor (container for tabs)
const TabSetEditor: React.FC = () => {
  return (
    <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-600 text-blue-700 dark:text-blue-300 font-semibold">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span>Tab Set</span>
      </div>
      <div className="p-4">
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children) => ({
            ...mdastNode,
            children: children as ContainerDirective['children'],
          })}
        />
      </div>
    </div>
  );
};

// Tab-item directive editor
const TabItemEditor: React.FC = () => {
  return (
    <div className="my-2 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium border-b border-gray-200 dark:border-gray-600">
        Tab Item
      </div>
      <div className="p-3">
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children) => ({
            ...mdastNode,
            children: children as ContainerDirective['children'],
          })}
        />
      </div>
    </div>
  );
};

// List-table directive editor
const ListTableEditor: React.FC = () => {
  return (
    <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>List Table</span>
      </div>
      <div className="p-4">
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children) => ({
            ...mdastNode,
            children: children as ContainerDirective['children'],
          })}
        />
      </div>
    </div>
  );
};

// Export all directive descriptors
export const mystDirectiveDescriptors: DirectiveDescriptor[] = [
  // Admonitions
  createAdmonitionDescriptor('note'),
  createAdmonitionDescriptor('tip'),
  createAdmonitionDescriptor('hint'),
  createAdmonitionDescriptor('important'),
  createAdmonitionDescriptor('warning'),
  createAdmonitionDescriptor('caution'),
  createAdmonitionDescriptor('attention'),
  createAdmonitionDescriptor('danger'),
  createAdmonitionDescriptor('error'),
  createAdmonitionDescriptor('seealso'),
  createAdmonitionDescriptor('dropdown'),
  createAdmonitionDescriptor('admonition'),
  // Other directives
  {
    name: 'card',
    testNode: (node) => node.name === 'card',
    attributes: [],
    hasChildren: true,
    Editor: CardEditor,
  },
  {
    name: 'tab-set',
    testNode: (node) => node.name === 'tab-set',
    attributes: [],
    hasChildren: true,
    Editor: TabSetEditor,
  },
  {
    name: 'tab-item',
    testNode: (node) => node.name === 'tab-item',
    attributes: [],
    hasChildren: true,
    Editor: TabItemEditor,
  },
  {
    name: 'list-table',
    testNode: (node) => node.name === 'list-table',
    attributes: [],
    hasChildren: true,
    Editor: ListTableEditor,
  },
];

// ============================================
// MyST Syntax Conversion Utilities
// ============================================

/**
 * Convert MyST syntax to standard remark-directive syntax before loading into MDXEditor.
 * MyST uses :::{name} while remark-directive uses :::name
 */
export function mystToRemarkDirective(content: string): string {
  if (!content) return content;

  let result = content;

  // Convert MyST container directives: :::{name} → :::name
  // Also handle ::::{name} for nested (4 colons)
  result = result.replace(/^(:{3,4})\{([a-zA-Z-]+)\}/gm, '$1$2');

  // Convert MyST code directives: ```{name} → :::name (as container directive)
  // This handles ```{mermaid}, ```{code}, etc.
  result = result.replace(/^```\{([a-zA-Z-]+)\}(.*?)$/gm, (match, name, rest) => {
    // Special handling for code blocks with language
    if (name === 'code') {
      // ```{code} python → ```python
      const lang = rest.trim().split(/\s+/)[0] || 'text';
      return '```' + lang;
    }
    // For mermaid and others, convert to directive
    return ':::' + name + rest;
  });

  // Handle closing ``` for mermaid blocks that were converted
  // This is tricky - we need to track context. For now, keep simple.

  return result;
}

/**
 * Convert standard remark-directive syntax back to MyST syntax for saving.
 * remark-directive uses :::name while MyST uses :::{name}
 */
export function remarkDirectiveToMyst(content: string): string {
  if (!content) return content;

  let result = content;

  // List of known MyST directive names
  const mystDirectives = [
    'note', 'tip', 'hint', 'important', 'warning', 'caution',
    'attention', 'danger', 'error', 'seealso', 'dropdown', 'admonition',
    'card', 'tab-set', 'tab-item', 'list-table', 'figure', 'image',
    'mermaid', 'code', 'math', 'sidebar', 'margin', 'exercise', 'solution',
  ];

  // Convert container directives back: :::name → :::{name}
  // Only for known MyST directives
  const directivePattern = new RegExp(
    `^(:{3,4})(${mystDirectives.join('|')})(?=[\\s\\n]|$)`,
    'gm'
  );
  result = result.replace(directivePattern, '$1{$2}');

  return result;
}

/**
 * Check if content contains MyST-specific syntax
 */
export function containsMystSyntax(content: string): boolean {
  if (!content) return false;

  const mystPatterns = [
    /^:::\{/m,           // Admonitions like :::{note}
    /^::::\{/m,          // Nested directives like ::::{tab-set}
    /^```\{/m,           // Code directives like ```{mermaid}
    /\{[a-z-]+\}`/,      // Inline roles like {math}`x^2`
  ];

  return mystPatterns.some(pattern => pattern.test(content));
}
