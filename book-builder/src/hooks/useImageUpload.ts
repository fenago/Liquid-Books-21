import { useState, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface UseImageUploadOptions {
  bookId: string;
  /** Bucket name in Supabase Storage. Defaults to 'book-images' */
  bucket?: string;
}

interface UseImageUploadResult {
  uploadImage: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for uploading images to Supabase Storage
 *
 * Images are stored in a folder structure: {userId}/{bookId}/{filename}
 * This ensures proper organization and access control.
 */
export function useImageUpload({
  bookId,
  bucket = 'book-images'
}: UseImageUploadOptions): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Only image files are allowed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'Image must be less than 5MB';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Fallback: create a local blob URL (will work temporarily but won't persist)
      console.warn('Supabase not configured. Using local blob URL (temporary).');
      return URL.createObjectURL(file);
    }

    setIsUploading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}.${fileExt}`;

      // Path structure: userId/bookId/filename
      const filePath = `${user.id}/${bookId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  }, [bookId, bucket]);

  return { uploadImage, isUploading, error, clearError };
}
