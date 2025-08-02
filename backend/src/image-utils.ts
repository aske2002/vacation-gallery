import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export async function processImage(
  buffer: Buffer,
  filename: string,
  uploadDir: string,
  options: {
    maxWidth?: number;
    quality?: number;
    createThumbnail?: boolean;
    thumbnailSize?: number;
  } = {}
): Promise<{
  filename: string;
  thumbnailFilename?: string;
  metadata: ImageMetadata;
}> {
  const {
    maxWidth = 3000,
    quality = 90,
    createThumbnail = true,
    thumbnailSize = 400
  } = options;

  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(path.join(uploadDir, 'thumbnails'), { recursive: true });

  // Get original metadata
  const originalMetadata = await sharp(buffer).metadata();

  // Process main image
  let image = sharp(buffer);
  
  // Resize if too large
  if (originalMetadata.width && originalMetadata.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }

  // Convert to JPEG with quality setting
  image = image.jpeg({ quality, progressive: true });

  // Save main image
  const mainImagePath = path.join(uploadDir, filename);
  await image.toFile(mainImagePath);

  // Get processed metadata
  const processedMetadata = await sharp(mainImagePath).metadata();

  let thumbnailFilename: string | undefined;

  // Create thumbnail if requested
  if (createThumbnail) {
    thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadDir, 'thumbnails', thumbnailFilename);
    
    await sharp(buffer)
      .resize({ 
        width: thumbnailSize, 
        height: thumbnailSize, 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
  }

  return {
    filename,
    thumbnailFilename,
    metadata: {
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      format: processedMetadata.format || 'jpeg',
      size: processedMetadata.size || 0
    }
  };
}

export async function deleteImageFiles(filename: string, uploadDir: string, hasThumbnail: boolean = true): Promise<void> {
  try {
    // Delete main image
    const mainImagePath = path.join(uploadDir, filename);
    await fs.unlink(mainImagePath);

    // Delete thumbnail if it exists
    if (hasThumbnail) {
      const thumbnailPath = path.join(uploadDir, 'thumbnails', `thumb_${filename}`);
      try {
        await fs.unlink(thumbnailPath);
      } catch (error) {
        // Thumbnail might not exist, that's okay
        console.warn('Could not delete thumbnail:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting image files:', error);
    throw error;
  }
}

export function getMimeTypeFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.tiff':
    case '.tif':
      return 'image/tiff';
    default:
      return 'application/octet-stream';
  }
}
