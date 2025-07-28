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
exports.extractExifData = extractExifData;
exports.processImage = processImage;
exports.deleteImageFiles = deleteImageFiles;
exports.getMimeTypeFromExtension = getMimeTypeFromExtension;
const exifr_1 = __importDefault(require("exifr"));
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
function extractExifData(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const exif = yield exifr_1.default.parse(buffer, ['gps', 'exif', 'ifd0']);
            const result = {};
            // GPS coordinates
            if ((exif === null || exif === void 0 ? void 0 : exif.latitude) && (exif === null || exif === void 0 ? void 0 : exif.longitude)) {
                result.latitude = exif.latitude;
                result.longitude = exif.longitude;
            }
            if (exif === null || exif === void 0 ? void 0 : exif.altitude) {
                result.altitude = exif.altitude;
            }
            // Date taken
            if (exif === null || exif === void 0 ? void 0 : exif.DateTimeOriginal) {
                result.taken_at = new Date(exif.DateTimeOriginal).toISOString();
            }
            else if (exif === null || exif === void 0 ? void 0 : exif.DateTime) {
                result.taken_at = new Date(exif.DateTime).toISOString();
            }
            // Camera info
            if (exif === null || exif === void 0 ? void 0 : exif.Make) {
                result.camera_make = exif.Make.toString().trim();
            }
            if (exif === null || exif === void 0 ? void 0 : exif.Model) {
                result.camera_model = exif.Model.toString().trim();
            }
            // Technical details
            if (exif === null || exif === void 0 ? void 0 : exif.ISO) {
                result.iso = parseInt(exif.ISO.toString());
            }
            if (exif === null || exif === void 0 ? void 0 : exif.FNumber) {
                result.aperture = `f/${exif.FNumber}`;
            }
            if (exif === null || exif === void 0 ? void 0 : exif.ExposureTime) {
                const exposureTime = parseFloat(exif.ExposureTime.toString());
                if (exposureTime < 1) {
                    result.shutter_speed = `1/${Math.round(1 / exposureTime)}`;
                }
                else {
                    result.shutter_speed = `${exposureTime}s`;
                }
            }
            if (exif === null || exif === void 0 ? void 0 : exif.FocalLength) {
                result.focal_length = parseFloat(exif.FocalLength.toString());
            }
            return result;
        }
        catch (error) {
            console.warn('Failed to extract EXIF data:', error);
            return {};
        }
    });
}
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
