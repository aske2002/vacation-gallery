# Vacation Gallery API

A REST API for managing photo galleries organized by trips, with support for location data, EXIF metadata, and file storage.

## Base URL
```
http://localhost:1798/api
```

## Features
- ✅ Trip management (CRUD operations)
- ✅ Photo upload with automatic EXIF extraction
- ✅ GPS coordinates and location data
- ✅ Image processing and thumbnail generation
- ✅ SQLite database storage
- ✅ File serving with caching
- ✅ CORS support
- ✅ Error handling

## API Endpoints

### Health Check
```http
GET /api/health
```
Returns API status and timestamp.

### Trips

#### Get All Trips
```http
GET /api/trips
```
Returns array of all trips.

#### Get Specific Trip
```http
GET /api/trips/:id
```
Returns trip details by ID.

#### Create Trip
```http
POST /api/trips
Content-Type: application/json

{
  "name": "Summer Vacation 2024",
  "description": "Our amazing trip to Europe",
  "start_date": "2024-07-01",
  "end_date": "2024-07-15"
}
```

#### Update Trip
```http
PUT /api/trips/:id
Content-Type: application/json

{
  "name": "Updated Trip Name",
  "description": "Updated description"
}
```

#### Delete Trip
```http
DELETE /api/trips/:id
```

#### Get Trip Photos
```http
GET /api/trips/:id/photos
```
Returns all photos for a specific trip.

### Photos

#### Get All Photos
```http
GET /api/photos
```
Returns array of all photos across all trips.

#### Get Photos with Coordinates
```http
GET /api/photos/with-coordinates
```
Returns photos that have GPS coordinates (useful for map display).

#### Get Specific Photo
```http
GET /api/photos/:id
```
Returns photo details by ID.

#### Upload Photos to Trip
```http
POST /api/trips/:tripId/photos
Content-Type: multipart/form-data

photos: [File, File, ...] (up to 20 files)
title: "Optional title"
description: "Optional description"
```

Supports multiple file upload. Each photo automatically gets:
- EXIF data extraction (GPS, camera info, etc.)
- Image processing and resizing
- Thumbnail generation
- Metadata storage

#### Update Photo Metadata
```http
PUT /api/photos/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "altitude": 10
}
```

#### Delete Photo
```http
DELETE /api/photos/:id
```
Deletes photo from database and removes files from disk.

### File Serving

#### Serve Image
```http
GET /api/images/:filename
```
Serves the full-size image file.

#### Serve Thumbnail
```http
GET /api/thumbnails/:filename
```
Serves the thumbnail version of the image.

## Data Models

### Trip
```typescript
{
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}
```

### Photo
```typescript
{
  id: string;
  trip_id: string;
  filename: string;
  original_filename: string;
  title?: string;
  description?: string;
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
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}
```

## Database Schema

The application uses SQLite with two main tables:

### trips
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `start_date` (TEXT)
- `end_date` (TEXT)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

### photos
- `id` (TEXT PRIMARY KEY)
- `trip_id` (TEXT NOT NULL, FOREIGN KEY)
- `filename` (TEXT NOT NULL)
- `original_filename` (TEXT NOT NULL)
- `title` (TEXT)
- `description` (TEXT)
- `latitude` (REAL)
- `longitude` (REAL)
- `altitude` (REAL)
- `taken_at` (TEXT)
- `camera_make` (TEXT)
- `camera_model` (TEXT)
- `iso` (INTEGER)
- `aperture` (TEXT)
- `shutter_speed` (TEXT)
- `focal_length` (REAL)
- `file_size` (INTEGER NOT NULL)
- `mime_type` (TEXT NOT NULL)
- `width` (INTEGER NOT NULL)
- `height` (INTEGER NOT NULL)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

## File Storage

- **Images**: Stored in `backend/uploads/`
- **Thumbnails**: Stored in `backend/uploads/thumbnails/`
- **Database**: SQLite file at `backend/data/vacation_gallery.db`

## Image Processing

- Automatic resizing for images > 3000px width
- JPEG optimization with 90% quality
- Thumbnail generation (400x400px, cover fit)
- EXIF data extraction including GPS coordinates
- Support for JPEG, PNG, GIF, WebP, TIFF formats

## Example Usage

1. **Create a trip**:
```bash
curl -X POST http://localhost:1798/api/trips \
  -H "Content-Type: application/json" \
  -d '{"name": "Paris Trip", "description": "Weekend in Paris"}'
```

2. **Upload photos to the trip**:
```bash
curl -X POST http://localhost:1798/api/trips/TRIP_ID/photos \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

3. **Get all photos with GPS coordinates**:
```bash
curl http://localhost:1798/api/photos/with-coordinates
```

4. **View an image**:
```
http://localhost:1798/api/images/FILENAME.jpg
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request
- `404` - Not Found
- `413` - File too large
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field describing the issue.
