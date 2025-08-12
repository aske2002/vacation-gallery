import { LibRaw } from "@/workers";
import { PhotoEditableMetadata } from "vacation-gallery-common";
import exifr from "exifr";
import piexif from "piexifjs";

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

/**
 * Update GPS coordinates in image EXIF data and return a new File
 */
export async function updateGPSInFile(
  file: File,
  latitude: number,
  longitude: number
): Promise<File> {
  try {
    // Only process JPEG files (piexifjs works best with JPEG)
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      console.warn("GPS update only supported for JPEG files");
      return file;
    }

    // Convert file to ArrayBuffer, then to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const dataUrl =
      "data:image/jpeg;base64," + btoa(String.fromCharCode(...uint8Array));

    // Get existing EXIF data or create new
    let exifDict: any;
    try {
      exifDict = piexif.load(dataUrl);
    } catch (error) {
      // If no EXIF data exists, create a new structure
      exifDict = {
        "0th": {},
        Exif: {},
        GPS: {},
        "1st": {},
        thumbnail: undefined,
      };
    }

    // Ensure GPS object exists
    if (!exifDict.GPS) {
      exifDict.GPS = {};
    }

    // Convert decimal degrees to GPS format (degrees, minutes, seconds)
    const convertToGPSFormat = (decimal: number) => {
      const absolute = Math.abs(decimal);
      const degrees = Math.floor(absolute);
      const minutes = Math.floor((absolute - degrees) * 60);
      const seconds =
        Math.round(((absolute - degrees) * 60 - minutes) * 60 * 1000) / 1000;

      return [
        [degrees, 1],
        [minutes, 1],
        [Math.round(seconds * 1000), 1000], // Convert to rational number
      ];
    };

    // Update GPS data using the piexif constants
    (exifDict.GPS as any)[piexif.GPSIFD.GPSLatitude] =
      convertToGPSFormat(latitude);
    (exifDict.GPS as any)[piexif.GPSIFD.GPSLatitudeRef] =
      latitude >= 0 ? "N" : "S";
    (exifDict.GPS as any)[piexif.GPSIFD.GPSLongitude] =
      convertToGPSFormat(longitude);
    (exifDict.GPS as any)[piexif.GPSIFD.GPSLongitudeRef] =
      longitude >= 0 ? "E" : "W";

    // Add timestamp
    const now = new Date();
    const timeStamp = [
      [now.getUTCHours(), 1],
      [now.getUTCMinutes(), 1],
      [now.getUTCSeconds(), 1],
    ];
    (exifDict.GPS as any)[piexif.GPSIFD.GPSTimeStamp] = timeStamp;

    const dateStamp = now.toISOString().split("T")[0].replace(/-/g, ":");
    (exifDict.GPS as any)[piexif.GPSIFD.GPSDateStamp] = dateStamp;

    // Insert the updated EXIF data back into the image
    const exifBytes = piexif.dump(exifDict);
    const updatedDataUrl = piexif.insert(exifBytes, dataUrl);

    // Convert back to File
    const base64Data = updatedDataUrl.split(",")[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const updatedFile = new File([bytes], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    return updatedFile;
  } catch (error) {
    console.error("Failed to update GPS data in file:", error);
    return file; // Return original file if update fails
  }
}

/**
 * Convert DNG/RAW file to JPEG using Web Worker
 */
export async function convertDngToJpeg(file: File): Promise<File | null> {
  return new Promise(async (resolve) => {
    try {
      await LibRaw.initialize();
      const libraw = new LibRaw();
      await libraw.open(new Uint8Array(await file.arrayBuffer()));
      await libraw.unpackThumb();
      const dcraw = await libraw.dcrawMakeMemThumb();
      const jpegFile = new File(
        [dcraw.data],
        file.name.replace(/\.\w+$/, ".jpg"),
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );
      resolve(jpegFile);
    } catch (error) {
      console.error("Failed to start DNG conversion:", error);
      resolve(null);
    }
  });
}

/**
 * Create a preview image from DNG file using canvas fallback
 */
async function createDngPreview(file: File): Promise<string | null> {
  try {
    // Try to convert DNG to JPEG first
    const jpegFile = await convertDngToJpeg(file);
    if (jpegFile) {
      return URL.createObjectURL(jpegFile);
    }
    return null;
  } catch (error) {
    console.error("DNG preview creation failed:", error);
    return null;
  }
}

/**
 * Check if a file is a raw image format
 */
export function isRawImageFile(file: File): boolean {
  const rawExtensions = [
    ".dng",
    ".raw",
    ".cr2",
    ".cr3",
    ".nef",
    ".arw",
    ".orf",
    ".rw2",
    ".pef",
    ".raf",
    ".3fr",
    ".ari",
    ".bay",
    ".braw",
    ".cap",
    ".crw",
    ".dcr",
    ".dcs",
    ".drf",
    ".eip",
    ".erf",
    ".fff",
    ".gpr",
    ".iiq",
    ".k25",
    ".kdc",
    ".mdc",
    ".mef",
    ".mos",
    ".mrw",
    ".nrw",
    ".obm",
    ".ptx",
    ".r3d",
    ".rwl",
    ".rwz",
    ".sr2",
    ".srf",
    ".srw",
    ".x3f",
  ];

  const fileName = file.name.toLowerCase();
  return rawExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Check if a file is a standard image that browsers can display
 */
export function isDisplayableImage(file: File): boolean {
  return (
    file.type?.startsWith("image/") &&
    !isRawImageFile(file) &&
    !file.type.includes("tiff")
  ); // TIFF support varies
}

/**
 * Resize an image file to reduce its size
 */
export function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  return new Promise((resolve, reject) => {
    const { maxWidth = 2048, maxHeight = 2048, quality = 0.85 } = options;

    // Don't resize raw files or non-image files
    if (!isDisplayableImage(file)) {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified,
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to resize image"));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for resizing"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a placeholder thumbnail for raw files
 */
export function generateRawPlaceholder(file: File): string {
  // Return a data URL for a simple SVG placeholder
  const extension = file.name.split(".").pop()?.toUpperCase() || "RAW";

  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
      <text x="100" y="90" text-anchor="middle" font-family="system-ui" font-size="16" fill="#6b7280">
        ${extension}
      </text>
      <text x="100" y="110" text-anchor="middle" font-family="system-ui" font-size="12" fill="#9ca3af">
        Raw Image
      </text>
      <text x="100" y="130" text-anchor="middle" font-family="system-ui" font-size="10" fill="#9ca3af">
        ${(file.size / (1024 * 1024)).toFixed(1)} MB
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create a safe object URL that handles both regular images and raw files
 */
export async function createSafeImageUrl(file: File): Promise<string> {
  if (isDisplayableImage(file)) {
    return URL.createObjectURL(file);
  } else if (isRawImageFile(file)) {
    // Try to create a preview from DNG first
    const previewUrl = await createDngPreview(file);
    if (previewUrl) {
      return previewUrl;
    }
    // Fallback to placeholder
    return generateRawPlaceholder(file);
  } else {
    // Fallback for other file types
    return generateRawPlaceholder(file);
  }
}

/**
 * Synchronous version for immediate placeholder
 */
export function createSafeImageUrlSync(file: File): string {
  if (isDisplayableImage(file)) {
    return URL.createObjectURL(file);
  } else {
    return generateRawPlaceholder(file);
  }
}
