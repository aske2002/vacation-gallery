import { useImageUrl } from "@/hooks/useImageUrl";
import { FileImage, Loader2 } from "lucide-react";

interface AsyncImageProps {
  file: File;
  alt: string;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Component that handles async image loading for raw files
 */
export function AsyncImage({ file, alt, className, onLoad }: AsyncImageProps) {
  const { imageUrl, isLoading, error } = useImageUrl(file);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted text-muted-foreground ${className}`}>
        <FileImage className="w-6 h-6 mb-1" />
        <span className="text-xs text-center">Error loading image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={onLoad}
    />
  );
}
