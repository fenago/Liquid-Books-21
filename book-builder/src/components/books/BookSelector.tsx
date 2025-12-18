'use client';

import { useState, useEffect } from 'react';
import { useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { LQ21Book } from '@/lib/supabase/types';
import { BookConfig } from '@/types';

interface BookSelectorProps {
  onSelectBook: (config: BookConfig) => void;
  currentBookId?: string;
}

export function BookSelector({ onSelectBook, currentBookId }: BookSelectorProps) {
  const { isAuthenticated } = useAuth();
  const { books, loading, error, fetchBooks, fetchBookWithChapters, toBookConfig } = useBooks();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBooks();
    }
  }, [isAuthenticated, fetchBooks]);

  const handleSelectBook = async (book: LQ21Book) => {
    const bookWithChapters = await fetchBookWithChapters(book.id);
    if (bookWithChapters) {
      const config = toBookConfig(bookWithChapters);
      onSelectBook(config);
    }
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading books...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        My Books ({books.length})
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}

          {books.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="font-medium">No books yet</p>
              <p className="text-sm">Create your first book to get started!</p>
            </div>
          ) : (
            <div className="py-1">
              {books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    currentBookId === book.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded shadow-sm flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{book.title}</p>
                      {book.description && (
                        <p className="text-sm text-gray-500 truncate">{book.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          book.status === 'published' ? 'bg-green-100 text-green-800' :
                          book.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {book.status}
                        </span>
                        {book.github_repo_name && (
                          <span className="text-xs text-gray-400">
                            {book.github_repo_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentBookId === book.id && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
