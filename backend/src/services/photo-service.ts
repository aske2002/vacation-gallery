import path from "path";
import { Database } from "../database";
import { v4 as uuidv4 } from "uuid";
import { ProgressStore } from "./progress-store";
import {
  deleteImageFiles,
  getMimeTypeFromExtension,
  processImage,
} from "./image-utils";
import { extractExifData, UpdatePhotoRequest, UploadPhotoRequest } from "vacation-gallery-common";

const uploadsDir = path.join(__dirname, "..", "uploads");

export class PhotoService {
  constructor(private database: Database) {}

  async getAllPhotos() {
    return this.database.getAllPhotos();
  }

  async getPhotoById(id: string) {
    return this.database.getPhotoById(id);
  }
  async uploadPhotos(
    files: Express.Multer.File[],
    tripId: string,
    metadata: UploadPhotoRequest[],
    jobId: string
  ) {
    if (files.length !== metadata.length) {
      throw new Error("Files and metadata length mismatch");
    }

    const uploadedPhotos = [];
    for (const [index, file] of files.entries()) {
      try {
        const photo = await this.uploadPhoto(
          { file, metadata: metadata[index] },
          tripId
        );
        uploadedPhotos.push(photo);
      } catch (error) {
        console.error("Error uploading photo:", error);
      }
      ProgressStore.setProgress(
        jobId,
        (index + 1) / files.length,
        "processing"
      );
    }

    ProgressStore.setProgress(jobId, 1, "completed");
    return uploadedPhotos;
  }

  async uploadPhoto(
    data: {
      file: Express.Multer.File;
      metadata: UploadPhotoRequest;
    },
    tripId: string
  ) {
    const exifData = await extractExifData(data.file.buffer);

    // Process and save image
    const { metadata } = await processImage(
      data.file.buffer,
      data.file.originalname,
      uploadsDir,
      {
        maxWidth: 3000,
        quality: 90,
        createThumbnail: true,
        thumbnailSize: 400,
      }
    );

    // Save to database
    const photo = await this.database.createPhoto({
      id: uuidv4(),
      trip_id: tripId,
      filename: data.file.originalname,
      original_filename: data.file.originalname,
      title: data.metadata?.title,
      description: data.metadata?.description,
      latitude: data.metadata?.latitude || exifData.latitude,
      longitude: data.metadata?.longitude || exifData.longitude,
      altitude: data.metadata?.altitude || exifData.altitude,
      taken_at: data.metadata?.taken_at || exifData.taken_at,
      camera_make: exifData.camera_make,
      camera_model: exifData.camera_model,
      iso: exifData.iso,
      aperture: exifData.aperture,
      shutter_speed: exifData.shutter_speed,
      focal_length: exifData.focal_length,
      file_size: metadata.size,
      mime_type: getMimeTypeFromExtension(data.file.originalname),
      width: metadata.width,
      height: metadata.height,
    });

    return photo;
  }

  async updatePhoto(request: UpdatePhotoRequest) {
    return await this.database.updatePhoto(request.id, {
      title: request.data.title,
      description: request.data.description,
      updated_at: new Date().toISOString(),
      created_at: request.data.taken_at ? request.data.taken_at : undefined,
      latitude: request.data.latitude ? request.data.latitude : undefined,
      longitude: request.data.longitude ? request.data.longitude : undefined,
      altitude: request.data.altitude ? request.data.altitude : undefined,
    });
  }

  async deletePhotos(ids: string[]) {
    // First, get all photos to retrieve their filenames for file deletion
    const photosToDelete = [];
    for (const photoId of ids) {
      const photo = await this.database.getPhotoById(photoId);
      if (photo) {
        photosToDelete.push(photo);
      }
    }

    // Use bulk delete for database operation
    const dbResults = await this.database.deletePhotos(ids);

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

    return fileDeleteResults;
  }
}
