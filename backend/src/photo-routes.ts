import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { database } from "./database";
import {
  processImage,
  deleteImageFiles,
  getMimeTypeFromExtension,
} from "./image-utils";
import { PhotoEditableMetadata } from "../../common/src/types/photo";
import {
  UpdatePhotoRequest,
  UploadPhotoRequest,
} from "../../common/src/types/request/update-photo-request";
import { extractExifData } from "../../common/src/utils/exif";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

const uploadsDir = path.join(__dirname, "..", "uploads");

// Get all photos
router.get("/photos", async (req, res) => {
  try {
    const photos = await database.getAllPhotos();
    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get photos with coordinates (for map display)
router.get("/photos/withCoordinates", async (req, res) => {
  try {
    const photos = await database.getPhotosWithCoordinates();
    res.json(photos);
  } catch (error) {
    console.error("Error fetching photos with coordinates:", error);
    res.status(500).json({ error: "Failed to fetch photos with coordinates" });
  }
});

// Get a specific photo
router.get("/photos/:id", async (req, res) => {
  try {
    const photo = await database.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    res.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ error: "Failed to fetch photo" });
  }
});

// Upload photos to a trip
router.post(
  "/trips/:tripId/photos",
  upload.array("photos", 100),
  async (req, res) => {
    try {
      console.log(req);
      const { tripId } = req.params;
      const metadata = JSON.parse(
        req.body.metadata || ""
      ) as UploadPhotoRequest[];
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Verify trip exists
      const trip = await database.getTripById(tripId);
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
          const fileExtension = path.extname(file.file.originalname);
          const filename = `${uuidv4()}${fileExtension}`;

          // Extract EXIF data
          const exifData = await extractExifData(file.file.buffer);

          // Process and save image
          const { metadata } = await processImage(
            file.file.buffer,
            filename,
            uploadsDir,
            {
              maxWidth: 3000,
              quality: 90,
              createThumbnail: true,
              thumbnailSize: 400,
            }
          );

          // Save to database
          const photo = await database.createPhoto({
            id: uuidv4(),
            trip_id: tripId,
            filename,
            original_filename: file.file.originalname,
            title: file.metadata?.title,
            description: file.metadata?.description,
            latitude: file.metadata?.latitude || exifData.latitude,
            longitude: file.metadata?.longitude || exifData.longitude,
            altitude: file.metadata?.altitude || exifData.altitude,
            taken_at: file.metadata?.taken_at || exifData.taken_at,
            camera_make: exifData.camera_make,
            camera_model: exifData.camera_model,
            iso: exifData.iso,
            aperture: exifData.aperture,
            shutter_speed: exifData.shutter_speed,
            focal_length: exifData.focal_length,
            file_size: metadata.size,
            mime_type: getMimeTypeFromExtension(filename),
            width: metadata.width,
            height: metadata.height,
          });

          uploadedPhotos.push(photo);
        } catch (error) {
          console.error(
            `Error processing file ${file.file.originalname}:`,
            error
          );
          // Continue with other files, but log the error
        }
      }

      res.status(201).json({
        message: `Successfully uploaded ${uploadedPhotos.length} out of ${files.length} photos`,
        photos: uploadedPhotos,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  }
);

// Update photo metadata
router.put("/photos/:id", async (req, res) => {
  try {
    const {
      data: { title, description, latitude, longitude, altitude, taken_at: timestamp },
    } = req.body as UpdatePhotoRequest;

    const photo = await database.updatePhoto(req.params.id, {
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
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// Delete multiple photos
router.delete("/photos", async (req, res) => {
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
      const photo = await database.getPhotoById(photoId);
      if (photo) {
        photosToDelete.push(photo);
      }
    }

    // Use bulk delete for database operation
    const dbResults = await database.deletePhotos(photoIds);

    // Delete image files for successfully deleted photos
    const fileDeleteResults = {
      successful: [...dbResults.successful],
      failed: [...dbResults.failed],
    };

    for (const photo of photosToDelete) {
      if (dbResults.successful.includes(photo.id)) {
        try {
          await deleteImageFiles(photo.filename, uploadsDir, true);
        } catch (fileError) {
          console.error(
            `Error deleting image files for ${photo.id}:`,
            fileError
          );
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
  } catch (error) {
    console.error("Error deleting photos:", error);
    res.status(500).json({ error: "Failed to delete photos" });
  }
});

// Serve image files
router.get("/images/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(uploadsDir, filename);

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      return res.status(404).json({ error: "Image not found" });
    }

    // Set appropriate headers
    const mimeType = getMimeTypeFromExtension(filename);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache

    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

// Serve thumbnail images
router.get("/thumbnails/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnailPath = path.join(uploadsDir, "thumbnails", filename);

    // Check if file exists
    try {
      await fs.access(thumbnailPath);
    } catch {
      return res.status(404).json({ error: "Thumbnail not found" });
    }

    // Set appropriate headers
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache

    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error("Error serving thumbnail:", error);
    res.status(500).json({ error: "Failed to serve thumbnail" });
  }
});

// Admin route to backfill location data for existing photos
router.post("/admin/backfill-locations", async (req, res) => {
  try {
    console.log("Starting manual location backfill...");

    const stats = await database.backfillLocationData();

    res.json({
      message: "Location backfill completed",
      stats,
    });
  } catch (error) {
    console.error("Error during location backfill:", error);
    res.status(500).json({ error: "Failed to backfill location data" });
  }
});

// Get statistics about location data coverage
router.get("/admin/location-stats", async (req, res) => {
  try {
    const totalPhotos = await database.getAllPhotos();
    const photosWithCoords = await database.getPhotosWithCoordinates();
    const photosNeedingLocation = await database.getPhotosNeedingLocationData();

    const photosWithLocation = totalPhotos.filter(
      (photo) => photo.latitude && photo.longitude && photo.location_name
    );

    res.json({
      total_photos: totalPhotos.length,
      photos_with_coordinates: photosWithCoords.length,
      photos_with_location_data: photosWithLocation.length,
      photos_needing_location_data: photosNeedingLocation.length,
      coverage_percentage:
        photosWithCoords.length > 0
          ? Math.round(
              (photosWithLocation.length / photosWithCoords.length) * 100
            )
          : 0,
    });
  } catch (error) {
    console.error("Error getting location stats:", error);
    res.status(500).json({ error: "Failed to get location statistics" });
  }
});

export default router;
