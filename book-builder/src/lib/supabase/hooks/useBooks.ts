'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../client';
import { LQ21Book, LQ21BookWithChapters, LQ21Chapter } from '../types';
import { useAuth } from '../auth-context';

export function useBooks() {
  const [books, setBooks] = useState<LQ21Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('lq21_books')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setBooks([]);
    } else {
      setBooks(data || []);
    }

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const createBook = async (book: Partial<LQ21Book>): Promise<LQ21Book | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('lq21_books')
      .insert({
        ...book,
        owner_id: user.id,
        slug: book.slug || book.title?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    await fetchBooks();
    return data;
  };

  const updateBook = async (id: string, updates: Partial<LQ21Book>): Promise<boolean> => {
    const { error } = await supabase
      .from('lq21_books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchBooks();
    return true;
  };

  const deleteBook = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lq21_books')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchBooks();
    return true;
  };

  const duplicateBook = async (id: string, newTitle?: string): Promise<LQ21Book | null> => {
    if (!user) return null;

    // Get the original book with chapters
    const { data: original, error: fetchError } = await supabase
      .from('lq21_books')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !original) {
      setError(fetchError?.message || 'Book not found');
      return null;
    }

    // Get chapters
    const { data: chapters } = await supabase
      .from('lq21_chapters')
      .select('*')
      .eq('book_id', id)
      .order('sort_order', { ascending: true });

    // Create new book
    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const { data: newBook, error: createError } = await supabase
      .from('lq21_books')
      .insert({
        owner_id: user.id,
        title: newTitle || `${original.title} (Copy)`,
        slug: newSlug,
        description: original.description,
        author: original.author,
        config: original.config,
        book_features: original.book_features,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    // Copy chapters
    if (chapters && chapters.length > 0) {
      const chapterInserts = chapters.map((ch: LQ21Chapter) => ({
        book_id: newBook.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description,
        content: ch.content,
        sort_order: ch.sort_order,
        chapter_features: ch.chapter_features,
      }));

      await supabase.from('lq21_chapters').insert(chapterInserts);
    }

    await fetchBooks();
    return newBook;
  };

  const archiveBook = async (id: string): Promise<boolean> => {
    return updateBook(id, { status: 'archived' });
  };

  const publishBook = async (id: string): Promise<boolean> => {
    return updateBook(id, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  };

  return {
    books,
    loading,
    error,
    fetchBooks,
    createBook,
    updateBook,
    deleteBook,
    duplicateBook,
    archiveBook,
    publishBook,
    // Computed
    draftBooks: books.filter(b => b.status === 'draft'),
    publishedBooks: books.filter(b => b.status === 'published'),
    archivedBooks: books.filter(b => b.status === 'archived'),
  };
}

export function useBook(bookId: string | null) {
  const [book, setBook] = useState<LQ21BookWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  const fetchBook = useCallback(async () => {
    if (!bookId || !user) {
      setBook(null);
      setLoading(false);
      return;
    }

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
      setBook(null);
      setLoading(false);
      return;
    }

    // Fetch chapters
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('lq21_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order', { ascending: true });

    if (chaptersError) {
      setError(chaptersError.message);
      setBook(null);
      setLoading(false);
      return;
    }

    setBook({
      ...bookData,
      chapters: chaptersData || [],
    });
    setLoading(false);
  }, [bookId, user, supabase]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const updateChapter = async (chapterId: string, updates: Partial<LQ21Chapter>): Promise<boolean> => {
    const { error } = await supabase
      .from('lq21_chapters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', chapterId);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchBook();
    return true;
  };

  const createChapter = async (chapter: Partial<LQ21Chapter>): Promise<LQ21Chapter | null> => {
    if (!bookId) return null;

    const { data, error } = await supabase
      .from('lq21_chapters')
      .insert({
        ...chapter,
        book_id: bookId,
        slug: chapter.slug || chapter.title?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    await fetchBook();
    return data;
  };

  const deleteChapter = async (chapterId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lq21_chapters')
      .delete()
      .eq('id', chapterId);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchBook();
    return true;
  };

  return {
    book,
    loading,
    error,
    fetchBook,
    updateChapter,
    createChapter,
    deleteChapter,
  };
}
