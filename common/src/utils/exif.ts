import exifr from "exifr";

export interface ExifData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  taken_at?: string;
  camera_make?: string;
  camera_model?: string;
  iso?: number;
  aperture?: string;
  shutter_speed?: string;
  focal_length?: number;
}

export async function extractExifData(buffer: Buffer | File): Promise<ExifData> {
  try {
    const exif = await exifr.parse(buffer);
    console.log(exif)

    const result: ExifData = {};

    // GPS coordinates
    if (exif?.latitude && exif?.longitude) {
      result.latitude = exif.latitude;
      result.longitude = exif.longitude;
    }

    if (exif?.altitude) {
      result.altitude = exif.altitude;
    }

    // Date taken
    if (exif?.DateTimeOriginal) {
      result.taken_at = new Date(exif.DateTimeOriginal).toISOString();
    } else if (exif?.DateTime) {
      result.taken_at = new Date(exif.DateTime).toISOString();
    }

    // Camera infox
    if (exif?.Make) {
      result.camera_make = exif.Make.toString().trim();
    }

    if (exif?.Model) {
      result.camera_model = exif.Model.toString().trim();
    }

    // Technical details
    if (exif?.ISO) {
      result.iso = parseInt(exif.ISO.toString());
    }

    if (exif?.FNumber) {
      result.aperture = `f/${exif.FNumber}`;
    }

    if (exif?.ExposureTime) {
      const exposureTime = parseFloat(exif.ExposureTime.toString());
      if (exposureTime < 1) {
        result.shutter_speed = `1/${Math.round(1 / exposureTime)}`;
      } else {
        result.shutter_speed = `${exposureTime}s`;
      }
    }

    if (exif?.FocalLength) {
      result.focal_length = parseFloat(exif.FocalLength.toString());
    }

    return result;
  } catch (error) {
    console.warn('Failed to extract EXIF data:', error);
    return {};
  }
}