"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = processImage;
exports.deleteImageFiles = deleteImageFiles;
exports.getMimeTypeFromExtension = getMimeTypeFromExtension;
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
function processImage(buffer_1, filename_1, uploadDir_1) {
    return __awaiter(this, arguments, void 0, function* (buffer, filename, uploadDir, options = {}) {
        const { maxWidth = 3000, quality = 90, createThumbnail = true, thumbnailSize = 400 } = options;
        // Ensure upload directory exists
        yield promises_1.default.mkdir(uploadDir, { recursive: true });
        yield promises_1.default.mkdir(path_1.default.join(uploadDir, 'thumbnails'), { recursive: true });
        // Get original metadata
        const originalMetadata = yield (0, sharp_1.default)(buffer).metadata();
        // Process main image
        let image = (0, sharp_1.default)(buffer);
        // Auto-rotate based on EXIF orientation
        image = image.rotate();
        // Resize if too large
        if (originalMetadata.width && originalMetadata.width > maxWidth) {
            image = image.resize({ width: maxWidth, withoutEnlargement: true });
        }
        // Convert to JPEG with quality setting
        image = image.jpeg({ quality, progressive: true });
        // Save main image
        const mainImagePath = path_1.default.join(uploadDir, filename);
        yield image.toFile(mainImagePath);
        // Get processed metadata
        const processedMetadata = yield (0, sharp_1.default)(mainImagePath).metadata();
        let thumbnailFilename;
        // Create thumbnail if requested
        if (createThumbnail) {
            thumbnailFilename = `thumb_${filename}`;
            const thumbnailPath = path_1.default.join(uploadDir, 'thumbnails', thumbnailFilename);
            yield (0, sharp_1.default)(buffer)
                .rotate() // Auto-rotate based on EXIF orientation
                .resize({
                width: thumbnailSize,
                height: thumbnailSize,
                fit: 'inside',
                withoutEnlargement: true
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
    });
}
function deleteImageFiles(filename_1, uploadDir_1) {
    return __awaiter(this, arguments, void 0, function* (filename, uploadDir, hasThumbnail = true) {
        try {
            // Delete main image
            const mainImagePath = path_1.default.join(uploadDir, filename);
            yield promises_1.default.unlink(mainImagePath);
            // Delete thumbnail if it exists
            if (hasThumbnail) {
                const thumbnailPath = path_1.default.join(uploadDir, 'thumbnails', `thumb_${filename}`);
                try {
                    yield promises_1.default.unlink(thumbnailPath);
                }
                catch (error) {
                    // Thumbnail might not exist, that's okay
                    console.warn('Could not delete thumbnail:', error);
                }
            }
        }
        catch (error) {
            console.error('Error deleting image files:', error);
            throw error;
        }
    });
}
function getMimeTypeFromExtension(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
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
