'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor';

// Dynamically import the editor to avoid SSR issues
// MDXEditor doesn't support server rendering
const Editor = dynamic(() => import('./ChapterEditor'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-t-lg" />
      <div className="h-64 p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
      </div>
    </div>
  ),
});

export interface ForwardRefEditorProps extends Omit<MDXEditorProps, 'plugins'> {
  onImageUpload?: (file: File) => Promise<string>;
  onError?: (payload: { error: string; source: string }) => void;
}

export const ForwardRefEditor = forwardRef<MDXEditorMethods, ForwardRefEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />
);

ForwardRefEditor.displayName = 'ForwardRefEditor';

// Re-export types for convenience
export type { MDXEditorMethods };

// Re-export MyST conversion utilities
export {
  mystToRemarkDirective,
  remarkDirectiveToMyst,
  containsMystSyntax
} from './MystDirectives';
