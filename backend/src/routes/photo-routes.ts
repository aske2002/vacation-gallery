import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import {
  processImage,
  deleteImageFiles,
  getMimeTypeFromExtension,
} from "../services/image-utils";
import { database, photoService } from "..";
import { ProgressStore } from "../services/progress-store";
import { UpdatePhotoRequest, UploadPhotoRequest } from "vacation-gallery-common";

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
    const { tripId } = req.params;
    const files = req.files as Express.Multer.File[];

    const jobId = ProgressStore.create();
    res.status(202).json({
      jobId,
      message: `Processing ${files.length} photos for trip ${tripId}`,
    });

    try {
      const metadata = JSON.parse(
        req.body.metadata || ""
      ) as UploadPhotoRequest[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      await photoService.uploadPhotos(files, tripId, metadata, jobId);
    } catch (error) {
      ProgressStore.setProgress(jobId, 1, "error");
      console.error("Error uploading photos:", error);
    }
  }
);

// Update photo metadata
router.put("/photos/:id", async (req, res) => {
  try {
    const reqData = req.body as UpdatePhotoRequest;
    const photo = await photoService.updatePhoto(reqData);
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

    const fileDeleteResults = await photoService.deletePhotos(photoIds);

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

export default router;
