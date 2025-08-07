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
const exif_1 = require("../../common/src/utils/exif");
const router = express_1.default.Router();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/tiff",
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type. Only images are allowed."));
        }
    },
});
const uploadsDir = path_1.default.join(__dirname, "..", "uploads");
// Get all photos
router.get("/photos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photos = yield database_1.database.getAllPhotos();
        res.json(photos);
    }
    catch (error) {
        console.error("Error fetching photos:", error);
        res.status(500).json({ error: "Failed to fetch photos" });
    }
}));
// Get photos with coordinates (for map display)
router.get("/photos/withCoordinates", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photos = yield database_1.database.getPhotosWithCoordinates();
        res.json(photos);
    }
    catch (error) {
        console.error("Error fetching photos with coordinates:", error);
        res.status(500).json({ error: "Failed to fetch photos with coordinates" });
    }
}));
// Get a specific photo
router.get("/photos/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photo = yield database_1.database.getPhotoById(req.params.id);
        if (!photo) {
            return res.status(404).json({ error: "Photo not found" });
        }
        res.json(photo);
    }
    catch (error) {
        console.error("Error fetching photo:", error);
        res.status(500).json({ error: "Failed to fetch photo" });
    }
}));
// Upload photos to a trip
router.post("/trips/:tripId/photos", upload.array("photos", 100), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { tripId } = req.params;
        const metadata = JSON.parse(req.body.metadata || "");
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        // Verify trip exists
        const trip = yield database_1.database.getTripById(tripId);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        const uploadedPhotos = [];
        const filesWithMetadata = files.map((f) => ({
            file: f,
            metadata: metadata.find((m) => m.fileName == f.originalname),
        }));
        for (const file of filesWithMetadata) {
            try {
                // Generate unique filename
                const fileExtension = path_1.default.extname(file.file.originalname);
                const filename = `${(0, uuid_1.v4)()}${fileExtension}`;
                // Extract EXIF data
                const exifData = yield (0, exif_1.extractExifData)(file.file.buffer);
                // Process and save image
                const { metadata } = yield (0, image_utils_1.processImage)(file.file.buffer, filename, uploadsDir, {
                    maxWidth: 3000,
                    quality: 90,
                    createThumbnail: true,
                    thumbnailSize: 400,
                });
                // Save to database
                const photo = yield database_1.database.createPhoto({
                    id: (0, uuid_1.v4)(),
                    trip_id: tripId,
                    filename,
                    original_filename: file.file.originalname,
                    title: (_a = file.metadata) === null || _a === void 0 ? void 0 : _a.title,
                    description: (_b = file.metadata) === null || _b === void 0 ? void 0 : _b.description,
                    latitude: ((_c = file.metadata) === null || _c === void 0 ? void 0 : _c.latitude) || exifData.latitude,
                    longitude: ((_d = file.metadata) === null || _d === void 0 ? void 0 : _d.longitude) || exifData.longitude,
                    altitude: ((_e = file.metadata) === null || _e === void 0 ? void 0 : _e.altitude) || exifData.altitude,
                    taken_at: ((_f = file.metadata) === null || _f === void 0 ? void 0 : _f.taken_at) || exifData.taken_at,
                    camera_make: exifData.camera_make,
                    camera_model: exifData.camera_model,
                    iso: exifData.iso,
                    aperture: exifData.aperture,
                    shutter_speed: exifData.shutter_speed,
                    focal_length: exifData.focal_length,
                    file_size: metadata.size,
                    mime_type: (0, image_utils_1.getMimeTypeFromExtension)(filename),
                    width: metadata.width,
                    height: metadata.height,
                });
                uploadedPhotos.push(photo);
            }
            catch (error) {
                console.error(`Error processing file ${file.file.originalname}:`, error);
                // Continue with other files, but log the error
            }
        }
        res.status(201).json({
            message: `Successfully uploaded ${uploadedPhotos.length} out of ${files.length} photos`,
            photos: uploadedPhotos,
        });
    }
    catch (error) {
        console.error("Error uploading photos:", error);
        res.status(500).json({ error: "Failed to upload photos" });
    }
}));
// Update photo metadata
router.put("/photos/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data: { title, description, latitude, longitude, altitude, taken_at: timestamp }, } = req.body;
        const photo = yield database_1.database.updatePhoto(req.params.id, {
            title,
            description,
            updated_at: new Date().toISOString(),
            created_at: timestamp ? timestamp : undefined,
            latitude: latitude ? latitude : undefined,
            longitude: longitude ? longitude : undefined,
            altitude: altitude ? altitude : undefined,
        });
        if (!photo) {
            return res.status(404).json({ error: "Photo not found" });
        }
        res.json(photo);
    }
    catch (error) {
        console.error("Error updating photo:", error);
        res.status(500).json({ error: "Failed to update photo" });
    }
}));
// Delete multiple photos
router.delete("/photos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { photoIds } = req.body;
        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return res
                .status(400)
                .json({ error: "photoIds array is required and must not be empty" });
        }
        // First, get all photos to retrieve their filenames for file deletion
        const photosToDelete = [];
        for (const photoId of photoIds) {
            const photo = yield database_1.database.getPhotoById(photoId);
            if (photo) {
                photosToDelete.push(photo);
            }
        }
        // Use bulk delete for database operation
        const dbResults = yield database_1.database.deletePhotos(photoIds);
        // Delete image files for successfully deleted photos
        const fileDeleteResults = {
            successful: [...dbResults.successful],
            failed: [...dbResults.failed],
        };
        for (const photo of photosToDelete) {
            if (dbResults.successful.includes(photo.id)) {
                try {
                    yield (0, image_utils_1.deleteImageFiles)(photo.filename, uploadsDir, true);
                }
                catch (fileError) {
                    console.error(`Error deleting image files for ${photo.id}:`, fileError);
                    // Photo deleted from DB but files might remain - still count as success
                }
            }
        }
        // Return results
        res.json({
            message: `Deleted ${fileDeleteResults.successful.length} out of ${photoIds.length} photos`,
            results: {
                successful: fileDeleteResults.successful,
                failed: fileDeleteResults.failed,
                totalRequested: photoIds.length,
            },
        });
    }
    catch (error) {
        console.error("Error deleting photos:", error);
        res.status(500).json({ error: "Failed to delete photos" });
    }
}));
// Serve image files
router.get("/images/:filename", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const imagePath = path_1.default.join(uploadsDir, filename);
        // Check if file exists
        try {
            yield promises_1.default.access(imagePath);
        }
        catch (_a) {
            return res.status(404).json({ error: "Image not found" });
        }
        // Set appropriate headers
        const mimeType = (0, image_utils_1.getMimeTypeFromExtension)(filename);
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
        res.sendFile(imagePath);
    }
    catch (error) {
        console.error("Error serving image:", error);
        res.status(500).json({ error: "Failed to serve image" });
    }
}));
// Serve thumbnail images
router.get("/thumbnails/:filename", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const thumbnailPath = path_1.default.join(uploadsDir, "thumbnails", filename);
        // Check if file exists
        try {
            yield promises_1.default.access(thumbnailPath);
        }
        catch (_a) {
            return res.status(404).json({ error: "Thumbnail not found" });
        }
        // Set appropriate headers
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
        res.sendFile(thumbnailPath);
    }
    catch (error) {
        console.error("Error serving thumbnail:", error);
        res.status(500).json({ error: "Failed to serve thumbnail" });
    }
}));
// Admin route to backfill location data for existing photos
router.post("/admin/backfill-locations", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting manual location backfill...");
        const stats = yield database_1.database.backfillLocationData();
        res.json({
            message: "Location backfill completed",
            stats,
        });
    }
    catch (error) {
        console.error("Error during location backfill:", error);
        res.status(500).json({ error: "Failed to backfill location data" });
    }
}));
// Get statistics about location data coverage
router.get("/admin/location-stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalPhotos = yield database_1.database.getAllPhotos();
        const photosWithCoords = yield database_1.database.getPhotosWithCoordinates();
        const photosNeedingLocation = yield database_1.database.getPhotosNeedingLocationData();
        const photosWithLocation = totalPhotos.filter((photo) => photo.latitude && photo.longitude && photo.location_name);
        res.json({
            total_photos: totalPhotos.length,
            photos_with_coordinates: photosWithCoords.length,
            photos_with_location_data: photosWithLocation.length,
            photos_needing_location_data: photosNeedingLocation.length,
            coverage_percentage: photosWithCoords.length > 0
                ? Math.round((photosWithLocation.length / photosWithCoords.length) * 100)
                : 0,
        });
    }
    catch (error) {
        console.error("Error getting location stats:", error);
        res.status(500).json({ error: "Failed to get location statistics" });
    }
}));
exports.default = router;
