'use client';

import type { ForwardedRef } from 'react';
import {
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
  CodeToggle,
  UndoRedo,
  DiffSourceToggleWrapper,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface ChapterEditorProps extends Omit<MDXEditorProps, 'plugins'> {
  editorRef: ForwardedRef<MDXEditorMethods> | null;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function ChapterEditor({
  editorRef,
  onImageUpload,
  ...props
}: ChapterEditorProps) {
  // Default image upload handler that returns a placeholder
  const defaultImageUpload = async (file: File): Promise<string> => {
    // Create a local object URL as fallback
    return URL.createObjectURL(file);
  };

  const imageUploadHandler = onImageUpload || defaultImageUpload;

  return (
    <MDXEditor
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'python' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            javascript: 'JavaScript',
            ts: 'TypeScript',
            typescript: 'TypeScript',
            python: 'Python',
            py: 'Python',
            css: 'CSS',
            html: 'HTML',
            json: 'JSON',
            bash: 'Bash',
            shell: 'Shell',
            sql: 'SQL',
            yaml: 'YAML',
            markdown: 'Markdown',
            md: 'Markdown',
          },
        }),
        imagePlugin({ imageUploadHandler }),
        diffSourcePlugin({ viewMode: 'rich-text' }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <BoldItalicUnderlineToggles />
              <Separator />
              <ListsToggle />
              <Separator />
              <CodeToggle />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <Separator />
              <DiffSourceToggleWrapper>
                <></>
              </DiffSourceToggleWrapper>
            </>
          ),
        }),
      ]}
      contentEditableClassName="prose prose-slate dark:prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none"
      {...props}
      ref={editorRef}
    />
  );
}
