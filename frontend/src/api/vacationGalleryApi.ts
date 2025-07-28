import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';

// Types
export interface Trip {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
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

export interface CreateTripRequest {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateTripRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

export interface UploadResponse {
  message: string;
  photos: Photo[];
}

export interface TripWithPhotoCount extends Trip {
  photoCount: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

// Main API Class
export class VacationGalleryApi {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:1798/api') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';
        throw new Error(message);
      }
    );
  }

  // Health Check
  async checkHealth(): Promise<{ message: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Trip Methods
  async getAllTrips(): Promise<Trip[]> {
    const response = await this.client.get('/trips');
    return response.data;
  }

  async getTripById(id: string): Promise<Trip> {
    const response = await this.client.get(`/trips/${id}`);
    return response.data;
  }

  async createTrip(data: CreateTripRequest): Promise<Trip> {
    const response = await this.client.post('/trips', data);
    return response.data;
  }

  async updateTrip(id: string, data: UpdateTripRequest): Promise<Trip> {
    const response = await this.client.put(`/trips/${id}`, data);
    return response.data;
  }

  async deleteTrip(id: string): Promise<void> {
    await this.client.delete(`/trips/${id}`);
  }

  async getTripPhotos(tripId: string): Promise<Photo[]> {
    const response = await this.client.get(`/trips/${tripId}/photos`);
    return response.data;
  }

  // Photo Methods
  async getAllPhotos(): Promise<Photo[]> {
    const response = await this.client.get('/photos');
    return response.data;
  }

  async getPhotosWithCoordinates(): Promise<Photo[]> {
    const response = await this.client.get('/photos/with-coordinates');
    return response.data;
  }

  async getPhotoById(id: string): Promise<Photo> {
    const response = await this.client.get(`/photos/${id}`);
    return response.data;
  }

  async updatePhoto(id: string, data: UpdatePhotoRequest): Promise<Photo> {
    const response = await this.client.put(`/photos/${id}`, data);
    return response.data;
  }

  async deletePhoto(id: string): Promise<void> {
    await this.client.delete(`/photos/${id}`);
  }

  // Upload Photos
  async uploadPhotos(
    tripId: string,
    files: File[],
    metadata?: { title?: string; description?: string },
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('photos', file);
    });

    if (metadata?.title) {
      formData.append('title', metadata.title);
    }
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }

    const response = await this.client.post(`/trips/${tripId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Image URLs
  getImageUrl(filename: string): string {
    return `${this.client.defaults.baseURL}/images/${filename}`;
  }

  getThumbnailUrl(filename: string): string {
    return `${this.client.defaults.baseURL}/thumbnails/thumb_${filename}`;
  }

  // Advanced methods
  async searchPhotos(query: string): Promise<Photo[]> {
    // Simple client-side search implementation
    // In a real app, you might want to add a search endpoint to the backend
    const photos = await this.getAllPhotos();
    const lowercaseQuery = query.toLowerCase();
    
    return photos.filter(photo => 
      photo.title?.toLowerCase().includes(lowercaseQuery) ||
      photo.description?.toLowerCase().includes(lowercaseQuery) ||
      photo.original_filename.toLowerCase().includes(lowercaseQuery) ||
      photo.camera_make?.toLowerCase().includes(lowercaseQuery) ||
      photo.camera_model?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getTripsWithPhotoCounts(): Promise<TripWithPhotoCount[]> {
    const [trips, photos] = await Promise.all([
      this.getAllTrips(),
      this.getAllPhotos()
    ]);

    return trips.map(trip => {
      const photoCount = photos.filter(photo => photo.trip_id === trip.id).length;
      return { ...trip, photoCount };
    });
  }

  async getPhotosByLocation(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Photo[]> {
    const photos = await this.getPhotosWithCoordinates();
    
    return photos.filter(photo => 
      photo.latitude !== null &&
      photo.longitude !== null &&
      photo.latitude !== undefined &&
      photo.longitude !== undefined &&
      photo.latitude >= bounds.south &&
      photo.latitude <= bounds.north &&
      photo.longitude >= bounds.west &&
      photo.longitude <= bounds.east
    );
  }

  async getPhotosByDateRange(startDate: string, endDate: string): Promise<Photo[]> {
    const photos = await this.getAllPhotos();
    
    return photos.filter(photo => {
      if (!photo.taken_at) return false;
      const photoDate = new Date(photo.taken_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return photoDate >= start && photoDate <= end;
    });
  }

  // Statistics
  async getStatistics(): Promise<{
    totalTrips: number;
    totalPhotos: number;
    photosWithGPS: number;
    totalFileSize: number;
    averagePhotosPerTrip: number;
  }> {
    const [trips, photos, photosWithGPS] = await Promise.all([
      this.getAllTrips(),
      this.getAllPhotos(),
      this.getPhotosWithCoordinates()
    ]);

    const totalFileSize = photos.reduce((sum, photo) => sum + photo.file_size, 0);
    const averagePhotosPerTrip = trips.length > 0 ? photos.length / trips.length : 0;

    return {
      totalTrips: trips.length,
      totalPhotos: photos.length,
      photosWithGPS: photosWithGPS.length,
      totalFileSize,
      averagePhotosPerTrip: Math.round(averagePhotosPerTrip * 100) / 100
    };
  }
}

// Export singleton instance
export const api = new VacationGalleryApi();
