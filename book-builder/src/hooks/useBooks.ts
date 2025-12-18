'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { LQ21Book, LQ21Chapter, LQ21BookWithChapters } from '@/lib/supabase/types';
import { BookConfig, Chapter } from '@/types';

export function useBooks() {
  const [books, setBooks] = useState<LQ21Book[]>([]);
  const [currentBook, setCurrentBook] = useState<LQ21BookWithChapters | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  // Fetch all books for the current user
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('lq21_books')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return [];
    }

    setBooks(data as LQ21Book[]);
    setLoading(false);
    return data as LQ21Book[];
  }, [supabase]);

  // Fetch a single book with its chapters
  const fetchBookWithChapters = useCallback(async (bookId: string) => {
    setLoading(true);
    setError(null);

    // Fetch book
    const { data: bookData, error: bookError } = await supabase
      .from('lq21_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError) {
      setError(bookError.message);
      setLoading(false);
      return null;
    }

    // Fetch chapters
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('lq21_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order', { ascending: true });

    if (chaptersError) {
      setError(chaptersError.message);
      setLoading(false);
      return null;
    }

    const bookWithChapters: LQ21BookWithChapters = {
      ...(bookData as LQ21Book),
      chapters: chaptersData as LQ21Chapter[],
    };

    setCurrentBook(bookWithChapters);
    setLoading(false);
    return bookWithChapters;
  }, [supabase]);

  // Create a new book from BookConfig
  const createBook = useCallback(async (config: BookConfig) => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('Not authenticated');
      setLoading(false);
      return null;
    }

    // Generate slug from title
    const slug = config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create book
    const { data: bookData, error: bookError } = await supabase
      .from('lq21_books')
      .insert({
        owner_id: userData.user.id,
        title: config.title,
        slug,
        description: config.description,
        author: config.author,
        cover_image_url: config.coverImage,
        github_repo_url: config.github?.username && config.github?.repoName
          ? `https://github.com/${config.github.username}/${config.github.repoName}`
          : null,
        github_username: config.github?.username,
        github_repo_name: config.github?.repoName,
        config: config,
        book_features: config.bookFeatures || [],
      })
      .select()
      .single();

    if (bookError) {
      setError(bookError.message);
      setLoading(false);
      return null;
    }

    const book = bookData as LQ21Book;

    // Create chapters
    const chaptersToInsert = flattenChapters(config.tableOfContents.chapters, book.id);

    if (chaptersToInsert.length > 0) {
      const { error: chaptersError } = await supabase
        .from('lq21_chapters')
        .insert(chaptersToInsert);

      if (chaptersError) {
        console.error('Error creating chapters:', chaptersError);
      }
    }

    await fetchBooks(); // Refresh book list
    setLoading(false);
    return book;
  }, [supabase, fetchBooks]);

  // Update a book
  const updateBook = useCallback(async (bookId: string, updates: Partial<LQ21Book>) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('lq21_books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return null;
    }

    await fetchBooks(); // Refresh book list
    setLoading(false);
    return data as LQ21Book;
  }, [supabase, fetchBooks]);

  // Update a chapter
  const updateChapter = useCallback(async (chapterId: string, updates: Partial<LQ21Chapter>) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('lq21_chapters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', chapterId)
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return null;
    }

    // Refresh current book if we have one
    if (currentBook) {
      await fetchBookWithChapters(currentBook.id);
    }

    setLoading(false);
    return data as LQ21Chapter;
  }, [supabase, currentBook, fetchBookWithChapters]);

  // Save full BookConfig to database (upsert)
  const saveBookConfig = useCallback(async (config: BookConfig) => {
    // Check if book already exists by github repo
    if (config.github?.repoName) {
      const { data: existingBook } = await supabase
        .from('lq21_books')
        .select('id')
        .eq('github_repo_name', config.github.repoName)
        .single();

      if (existingBook) {
        // Update existing book
        return updateBook(existingBook.id, {
          title: config.title,
          description: config.description,
          author: config.author,
          cover_image_url: config.coverImage,
          config: config as unknown as Record<string, unknown>,
          book_features: config.bookFeatures || [],
        });
      }
    }

    // Create new book
    return createBook(config);
  }, [supabase, createBook, updateBook]);

  // Convert LQ21Book back to BookConfig format
  const toBookConfig = useCallback((book: LQ21BookWithChapters): BookConfig => {
    // Try to use stored config first
    if (book.config && typeof book.config === 'object' && 'title' in book.config) {
      return book.config as unknown as BookConfig;
    }

    // Otherwise reconstruct from database fields
    return {
      title: book.title,
      description: book.description || '',
      author: book.author || '',
      coverImage: book.cover_image_url || undefined,
      github: book.github_repo_name ? {
        username: book.github_username || '',
        repoName: book.github_repo_name,
      } : undefined,
      features: [],
      bookFeatures: book.book_features as BookConfig['bookFeatures'],
      tableOfContents: {
        chapters: buildChapterTree(book.chapters),
      },
    };
  }, []);

  // Delete a book
  const deleteBook = useCallback(async (bookId: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('lq21_books')
      .delete()
      .eq('id', bookId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }

    await fetchBooks();
    setLoading(false);
    return true;
  }, [supabase, fetchBooks]);

  return {
    books,
    currentBook,
    loading,
    error,
    fetchBooks,
    fetchBookWithChapters,
    createBook,
    updateBook,
    updateChapter,
    saveBookConfig,
    toBookConfig,
    deleteBook,
    setCurrentBook,
  };
}

// Helper: Flatten chapter tree for database insertion
function flattenChapters(
  chapters: Chapter[],
  bookId: string,
  parentId: string | null = null,
  startOrder: number = 0
): Array<{
  book_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  sort_order: number;
  chapter_features: unknown[];
}> {
  const result: Array<{
    book_id: string;
    parent_id: string | null;
    title: string;
    slug: string;
    description: string | null;
    content: string | null;
    sort_order: number;
    chapter_features: unknown[];
  }> = [];

  chapters.forEach((chapter, index) => {
    result.push({
      book_id: bookId,
      parent_id: parentId,
      title: chapter.title,
      slug: chapter.slug,
      description: chapter.description || null,
      content: chapter.content || null,
      sort_order: startOrder + index,
      chapter_features: chapter.selectedFeatures || [],
    });

    if (chapter.children && chapter.children.length > 0) {
      // Note: We'll need to get the parent ID after insert for proper hierarchy
      // For now, store children at root level
      result.push(...flattenChapters(chapter.children, bookId, null, startOrder + index * 100));
    }
  });

  return result;
}

// Helper: Build chapter tree from flat database records
function buildChapterTree(chapters: LQ21Chapter[]): Chapter[] {
  const rootChapters = chapters.filter(c => !c.parent_id);

  const buildTree = (parentChapters: LQ21Chapter[]): Chapter[] => {
    return parentChapters.map(chapter => {
      const children = chapters.filter(c => c.parent_id === chapter.id);
      return {
        id: chapter.id,
        title: chapter.title,
        slug: chapter.slug,
        description: chapter.description || undefined,
        content: chapter.content || undefined,
        selectedFeatures: chapter.chapter_features as Chapter['selectedFeatures'],
        children: children.length > 0 ? buildTree(children) : undefined,
      };
    });
  };

  return buildTree(rootChapters);
}
