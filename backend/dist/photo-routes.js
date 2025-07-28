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
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const database_1 = require("./database");
const image_utils_1 = require("./image-utils");
const router = express_1.default.Router();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
// Get all photos
router.get('/photos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photos = yield database_1.database.getAllPhotos();
        res.json(photos);
    }
    catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
}));
// Get photos with coordinates (for map display)
router.get('/photos/withCoordinates', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photos = yield database_1.database.getPhotosWithCoordinates();
        res.json(photos);
    }
    catch (error) {
        console.error('Error fetching photos with coordinates:', error);
        res.status(500).json({ error: 'Failed to fetch photos with coordinates' });
    }
}));
// Get a specific photo
router.get('/photos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photo = yield database_1.database.getPhotoById(req.params.id);
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        res.json(photo);
    }
    catch (error) {
        console.error('Error fetching photo:', error);
        res.status(500).json({ error: 'Failed to fetch photo' });
    }
}));
// Upload photos to a trip
router.post('/trips/:tripId/photos', upload.array('photos', 20), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tripId } = req.params;
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        // Verify trip exists
        const trip = yield database_1.database.getTripById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        const uploadedPhotos = [];
        for (const file of files) {
            try {
                // Generate unique filename
                const fileExtension = path_1.default.extname(file.originalname);
                const filename = `${(0, uuid_1.v4)()}${fileExtension}`;
                // Extract EXIF data
                const exifData = yield (0, image_utils_1.extractExifData)(file.buffer);
                // Process and save image
                const { metadata } = yield (0, image_utils_1.processImage)(file.buffer, filename, uploadsDir, {
                    maxWidth: 3000,
                    quality: 90,
                    createThumbnail: true,
                    thumbnailSize: 400
                });
                // Save to database
                const photo = yield database_1.database.createPhoto({
                    id: (0, uuid_1.v4)(),
                    trip_id: tripId,
                    filename,
                    original_filename: file.originalname,
                    title: req.body.title || null,
                    description: req.body.description || null,
                    latitude: exifData.latitude,
                    longitude: exifData.longitude,
                    altitude: exifData.altitude,
                    taken_at: exifData.taken_at,
                    camera_make: exifData.camera_make,
                    camera_model: exifData.camera_model,
                    iso: exifData.iso,
                    aperture: exifData.aperture,
                    shutter_speed: exifData.shutter_speed,
                    focal_length: exifData.focal_length,
                    file_size: metadata.size,
                    mime_type: (0, image_utils_1.getMimeTypeFromExtension)(filename),
                    width: metadata.width,
                    height: metadata.height
                });
                uploadedPhotos.push(photo);
            }
            catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                // Continue with other files, but log the error
            }
        }
        res.status(201).json({
            message: `Successfully uploaded ${uploadedPhotos.length} out of ${files.length} photos`,
            photos: uploadedPhotos
        });
    }
    catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({ error: 'Failed to upload photos' });
    }
}));
// Update photo metadata
router.put('/photos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, latitude, longitude, altitude } = req.body;
        const photo = yield database_1.database.updatePhoto(req.params.id, {
            title,
            description,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            altitude: altitude ? parseFloat(altitude) : undefined
        });
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        res.json(photo);
    }
    catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: 'Failed to update photo' });
    }
}));
// Delete a photo
router.delete('/photos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photo = yield database_1.database.getPhotoById(req.params.id);
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        // Delete from database
        const deleted = yield database_1.database.deletePhoto(req.params.id);
        if (deleted) {
            // Delete files from disk
            try {
                yield (0, image_utils_1.deleteImageFiles)(photo.filename, uploadsDir, true);
            }
            catch (fileError) {
                console.error('Error deleting image files:', fileError);
                // Photo deleted from DB but files might remain
            }
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
}));
// Serve image files
router.get('/images/:filename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const imagePath = path_1.default.join(uploadsDir, filename);
        // Check if file exists
        try {
            yield promises_1.default.access(imagePath);
        }
        catch (_a) {
            return res.status(404).json({ error: 'Image not found' });
        }
        // Set appropriate headers
        const mimeType = (0, image_utils_1.getMimeTypeFromExtension)(filename);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
        res.sendFile(imagePath);
    }
    catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
}));
// Serve thumbnail images
router.get('/thumbnails/:filename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const thumbnailPath = path_1.default.join(uploadsDir, 'thumbnails', filename);
        // Check if file exists
        try {
            yield promises_1.default.access(thumbnailPath);
        }
        catch (_a) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }
        // Set appropriate headers
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
        res.sendFile(thumbnailPath);
    }
    catch (error) {
        console.error('Error serving thumbnail:', error);
        res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
}));
exports.default = router;
