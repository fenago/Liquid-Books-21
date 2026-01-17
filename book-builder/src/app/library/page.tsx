'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooks } from '@/lib/supabase/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { AuthGate } from '@/components/auth/AuthGate';
import {
  BookOpen,
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Archive,
  ExternalLink,
  Clock,
  FileText,
  Globe,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'draft' | 'published' | 'archived';

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    books,
    loading,
    error,
    deleteBook,
    duplicateBook,
    archiveBook,
    draftBooks,
    publishedBooks,
    archivedBooks,
  } = useBooks();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<{ url: string; title: string } | null>(null);

  // Filter books based on search and status
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'draft' && book.status === 'draft') ||
      (filterStatus === 'published' && book.status === 'published') ||
      (filterStatus === 'archived' && book.status === 'archived');

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (bookId: string) => {
    // Navigate to library book detail page with chapter editor
    router.push(`/library/${bookId}`);
  };

  const handleDuplicate = async (bookId: string) => {
    setActiveMenu(null);
    await duplicateBook(bookId);
  };

  const handleArchive = async (bookId: string) => {
    setActiveMenu(null);
    await archiveBook(bookId);
  };

  const handleDelete = async (bookId: string) => {
    setDeleteConfirm(null);
    setActiveMenu(null);
    await deleteBook(bookId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      generating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? (
      <Globe className="h-3.5 w-3.5" />
    ) : (
      <Lock className="h-3.5 w-3.5" />
    );
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back</span>
                </Link>
                <div className="h-6 w-px bg-gray-700" />
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                  <h1 className="text-xl font-semibold text-white">My Library</h1>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Book</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-white">{books.length}</div>
              <div className="text-sm text-gray-400">Total Books</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-yellow-400">{draftBooks.length}</div>
              <div className="text-sm text-gray-400">Drafts</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-green-400">{publishedBooks.length}</div>
              <div className="text-sm text-gray-400">Published</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="text-2xl font-bold text-gray-400">{archivedBooks.length}</div>
              <div className="text-sm text-gray-400">Archived</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'draft'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'published'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'archived'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Archived
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-400 mb-2">Error loading books</div>
              <div className="text-gray-500 text-sm">{error}</div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'No books match your filters'
                  : 'No books yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first book to get started'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Book
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden hover:border-purple-500/50 transition-all group"
                >
                  {/* Cover/Preview */}
                  <div className="h-40 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center relative overflow-hidden">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`${book.title} cover`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setCoverPreview({ url: book.cover_image_url!, title: book.title })}
                      />
                    ) : (
                      <BookOpen className="h-16 w-16 text-purple-400/50" />
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(activeMenu === book.id ? null : book.id)
                          }
                          className="p-1.5 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeMenu === book.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                            <button
                              onClick={() => handleEdit(book.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Book
                            </button>
                            <button
                              onClick={() => handleDuplicate(book.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                            {book.deployed_url && (
                              <a
                                href={book.deployed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Live
                              </a>
                            )}
                            {book.status !== 'archived' && (
                              <button
                                onClick={() => handleArchive(book.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                            )}
                            <div className="border-t border-gray-700" />
                            <button
                              onClick={() => setDeleteConfirm(book.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          book.status
                        )}`}
                      >
                        {book.status}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <span className="text-gray-500">
                        {getVisibilityIcon(book.visibility)}
                      </span>
                    </div>
                    {book.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {book.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(book.updated_at)}
                      </div>
                      {book.github_repo_name && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {book.github_repo_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleEdit(book.id)}
                      className="w-full py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Continue Editing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:border-purple-500/50 transition-all flex items-center gap-4"
                >
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden ${book.cover_image_url ? 'cursor-pointer hover:ring-2 hover:ring-purple-500' : ''}`}
                    onClick={() => book.cover_image_url && setCoverPreview({ url: book.cover_image_url, title: book.title })}
                  >
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`${book.title} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-purple-400/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{book.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          book.status
                        )}`}
                      >
                        {book.status}
                      </span>
                    </div>
                    {book.description && (
                      <p className="text-sm text-gray-400 truncate">{book.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 hidden sm:block">
                    {formatDate(book.updated_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(book.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(book.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {book.deployed_url && (
                      <a
                        href={book.deployed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(book.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-2">Delete Book?</h3>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. All chapters and content will be permanently
                deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close menu */}
        {activeMenu && (
          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
        )}

        {/* Cover Preview Modal */}
        {coverPreview && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setCoverPreview(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={coverPreview.url}
                alt={`${coverPreview.title} cover`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <p className="mt-4 text-white text-lg font-medium">{coverPreview.title}</p>
              <button
                onClick={() => setCoverPreview(null)}
                className="absolute -top-2 -right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
