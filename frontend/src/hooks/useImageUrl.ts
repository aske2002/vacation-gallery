import { useState, useEffect } from 'react';
import { createSafeImageUrl, createSafeImageUrlSync } from '@/lib/image-processing';

/**
 * Hook to handle async image URL creation for raw files
 */
export function useImageUrl(file: File) {
  const [imageUrl, setImageUrl] = useState<string>(() => 
    createSafeImageUrlSync(file)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = await createSafeImageUrl(file);
        if (!isCancelled) {
          setImageUrl(url);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return { imageUrl, isLoading, error };
}
