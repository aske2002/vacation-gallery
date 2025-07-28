import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { database } from './database';
import { extractExifData, processImage, deleteImageFiles, getMimeTypeFromExtension } from './image-utils';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Get all photos
router.get('/photos', async (req, res) => {
  try {
    const photos = await database.getAllPhotos();
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get photos with coordinates (for map display)
router.get('/photos/withCoordinates', async (req, res) => {
  try {
    const photos = await database.getPhotosWithCoordinates();
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos with coordinates:', error);
    res.status(500).json({ error: 'Failed to fetch photos with coordinates' });
  }
});

// Get a specific photo
router.get('/photos/:id', async (req, res) => {
  try {
    const photo = await database.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Upload photos to a trip
router.post('/trips/:tripId/photos', upload.array('photos', 20), async (req, res) => {
  try {
    const { tripId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify trip exists
    const trip = await database.getTripById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const uploadedPhotos = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const filename = `${uuidv4()}${fileExtension}`;
        
        // Extract EXIF data
        const exifData = await extractExifData(file.buffer);
        
        // Process and save image
        const { metadata } = await processImage(file.buffer, filename, uploadsDir, {
          maxWidth: 3000,
          quality: 90,
          createThumbnail: true,
          thumbnailSize: 400
        });

        // Save to database
        const photo = await database.createPhoto({
          id: uuidv4(),
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
          mime_type: getMimeTypeFromExtension(filename),
          width: metadata.width,
          height: metadata.height
        });

        uploadedPhotos.push(photo);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        // Continue with other files, but log the error
      }
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} out of ${files.length} photos`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Update photo metadata
router.put('/photos/:id', async (req, res) => {
  try {
    const { title, description, latitude, longitude, altitude } = req.body;
    
    const photo = await database.updatePhoto(req.params.id, {
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
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete a photo
router.delete('/photos/:id', async (req, res) => {
  try {
    const photo = await database.getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from database
    const deleted = await database.deletePhoto(req.params.id);
    
    if (deleted) {
      // Delete files from disk
      try {
        await deleteImageFiles(photo.filename, uploadsDir, true);
      } catch (fileError) {
        console.error('Error deleting image files:', fileError);
        // Photo deleted from DB but files might remain
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Serve image files
router.get('/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set appropriate headers
    const mimeType = getMimeTypeFromExtension(filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Serve thumbnail images
router.get('/thumbnails/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnailPath = path.join(uploadsDir, 'thumbnails', filename);
    
    // Check if file exists
    try {
      await fs.access(thumbnailPath);
    } catch {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

export default router;
