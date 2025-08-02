import axios, { AxiosInstance, AxiosProgressEvent } from "axios";
import { Photo } from "@common/types/photo";
import {
  UploadPhotoRequest,
  UpdatePhotoRequest,
} from "@common/types/request/update-photo-request";
import { CreateTripRequest } from "@common/types/request/create-trip-request";
import { Trip } from "@common/types/trip";

export interface DeletePhotosRequest {
  photoIds: string[];
}

export interface UpdateTripRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UploadPhotosRequest {
  tripId: string;
  files: UploadPhotosRequestItem[];
}

export type UploadPhotosRequestItem = {
  file: File;
  metadata: UploadPhotoRequest;
};

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

// Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

// Main API Class
export class Api {
  private client: AxiosInstance;

  constructor(baseURL: string = "http://localhost:1798/api") {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message =
          error.response?.data?.error || error.message || "An error occurred";
        throw new Error(message);
      }
    );
  }

  // Set auth token
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common["Authorization"];
    }
  }

  // Authentication Methods
  login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await this.client.post("/auth/login", credentials);
    return response.data;
  };

  register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await this.client.post("/auth/register", userData);
    return response.data;
  };

  getProfile = async (): Promise<User> => {
    const response = await this.client.get("/auth/me");
    return response.data;
  };

  updateProfile = async (
    data: UpdateProfileRequest
  ): Promise<{ message: string; user: User }> => {
    const response = await this.client.put("/auth/me", data);
    return response.data;
  };

  changePassword = async (
    data: ChangePasswordRequest
  ): Promise<{ message: string }> => {
    const response = await this.client.put("/auth/change-password", data);
    return response.data;
  };

  verifyToken = async (): Promise<{ valid: boolean; user: User }> => {
    const response = await this.client.get("/auth/verify");
    return response.data;
  };

  // Health Check
  checkHealth = async (): Promise<{ message: string; timestamp: string }> => {
    const response = await this.client.get("/health");
    return response.data;
  };

  // Trip Methods
  getAllTrips = async (): Promise<Trip[]> => {
    const response = await this.client.get("/trips");
    return response.data;
  };

  getTripById = async (id: string): Promise<Trip> => {
    const response = await this.client.get(`/trips/${id}`);
    return response.data;
  };

  createTrip = async (data: CreateTripRequest): Promise<Trip> => {
    const response = await this.client.post("/trips", data);
    return response.data;
  };

  updateTrip = async (id: string, data: UpdateTripRequest): Promise<Trip> => {
    const response = await this.client.put(`/trips/${id}`, data);
    return response.data;
  };

  deleteTrip = async (id: string): Promise<void> => {
    await this.client.delete(`/trips/${id}`);
  };

  getTripPhotos = async (tripId: string): Promise<Photo[]> => {
    const response = await this.client.get(`/trips/${tripId}/photos`);
    return response.data;
  };

  // Photo Methods
  getAllPhotos = async (): Promise<Photo[]> => {
    const response = await this.client.get("/photos");
    return response.data;
  };

  getPhotosWithCoordinates = async (): Promise<Photo[]> => {
    const response = await this.client.get("/photos/with-coordinates");
    return response.data;
  };

  getPhotoById = async (id: string): Promise<Photo> => {
    const response = await this.client.get(`/photos/${id}`);
    return response.data;
  };

  updatePhoto = async (request: UpdatePhotoRequest): Promise<Photo> => {
    const response = await this.client.put(`/photos/${request.id}`, request);
    return response.data;
  };

  deletePhotos = async (request: DeletePhotosRequest): Promise<void> => {
    await this.client.delete(`/photos`, {
      data: request,
    });
  };

  // Upload Photos
  uploadPhotos = async (
    request: UploadPhotosRequest,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();

    request.files.forEach((photo) => {
      formData.append("photos", photo.file);
    });
    formData.append(
      "metadata",
      JSON.stringify(
        request.files.map((f) => ({
          ...f.metadata,
          fileName: f.file.name,
        }))
      )
    );

    const response = await this.client.post(
      `/trips/${request.tripId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  };

  // Image URLs
  getImageUrl(filename: string): string {
    return `${this.client.defaults.baseURL}/images/${filename}`;
  }

  getThumbnailUrl(filename: string): string {
    return `${this.client.defaults.baseURL}/thumbnails/thumb_${filename}`;
  }

  // Advanced methods
  searchPhotos = async (query: string): Promise<Photo[]> => {
    // Simple client-side search implementation
    // In a real app, you might want to add a search endpoint to the backend
    const photos = await this.getAllPhotos();
    const lowercaseQuery = query.toLowerCase();

    return photos.filter(
      (photo) =>
        photo.title?.toLowerCase().includes(lowercaseQuery) ||
        photo.description?.toLowerCase().includes(lowercaseQuery) ||
        photo.original_filename.toLowerCase().includes(lowercaseQuery) ||
        photo.camera_make?.toLowerCase().includes(lowercaseQuery) ||
        photo.camera_model?.toLowerCase().includes(lowercaseQuery)
    );
  };

  getTripsWithPhotoCounts = async (): Promise<TripWithPhotoCount[]> => {
    const [trips, photos] = await Promise.all([
      this.getAllTrips(),
      this.getAllPhotos(),
    ]);

    return trips.map((trip) => {
      const photoCount = photos.filter(
        (photo) => photo.trip_id === trip.id
      ).length;
      return { ...trip, photoCount };
    });
  };

  async getPhotosByLocation(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Photo[]> {
    const photos = await this.getPhotosWithCoordinates();

    return photos.filter(
      (photo) =>
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

  getPhotosByDateRange = async (
    startDate: string,
    endDate: string
  ): Promise<Photo[]> => {
    const photos = await this.getAllPhotos();

    return photos.filter((photo) => {
      if (!photo.taken_at) return false;
      const photoDate = new Date(photo.taken_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return photoDate >= start && photoDate <= end;
    });
  };

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
      this.getPhotosWithCoordinates(),
    ]);

    const totalFileSize = photos.reduce(
      (sum, photo) => sum + photo.file_size,
      0
    );
    const averagePhotosPerTrip =
      trips.length > 0 ? photos.length / trips.length : 0;

    return {
      totalTrips: trips.length,
      totalPhotos: photos.length,
      photosWithGPS: photosWithGPS.length,
      totalFileSize,
      averagePhotosPerTrip: Math.round(averagePhotosPerTrip * 100) / 100,
    };
  }
}

// Export singleton instance
export const api = new Api();
