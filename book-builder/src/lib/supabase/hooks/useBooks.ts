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

  return {
    books,
    loading,
    error,
    fetchBooks,
    createBook,
    updateBook,
    deleteBook,
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
