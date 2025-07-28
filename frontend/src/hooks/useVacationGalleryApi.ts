// React Query hooks for the Vacation Gallery API
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryResult,
  UseMutationResult 
} from '@tanstack/react-query';
import { 
  api, 
  Trip, 
  Photo, 
  CreateTripRequest, 
  UpdateTripRequest, 
  UpdatePhotoRequest,
  UploadResponse,
  TripWithPhotoCount
} from '../api/vacationGalleryApi';

// Query Keys
export const queryKeys = {
  trips: ['trips'] as const,
  trip: (id: string) => ['trips', id] as const,
  tripPhotos: (tripId: string) => ['trips', tripId, 'photos'] as const,
  photos: ['photos'] as const,
  photo: (id: string) => ['photos', id] as const,
  photosWithCoordinates: ['photos', 'with-coordinates'] as const,
  tripsWithPhotoCounts: ['trips', 'with-photo-counts'] as const,
  statistics: ['statistics'] as const,
  health: ['health'] as const,
};

// Trips Hooks
export function useTrips(): UseQueryResult<Trip[], Error> {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: () => api.getAllTrips(),
  });
}

export function useTrip(id: string | null): UseQueryResult<Trip | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.trip(id!),
    queryFn: () => api.getTripById(id!),
    enabled: !!id,
  });
}

export function useCreateTrip(): UseMutationResult<Trip, Error, CreateTripRequest> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTripRequest) => api.createTrip(data),
    onSuccess: (newTrip) => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: queryKeys.trips });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripsWithPhotoCounts });
      
      // Add the new trip to the cache
      queryClient.setQueryData(queryKeys.trip(newTrip.id), newTrip);
    },
  });
}

export function useUpdateTrip(): UseMutationResult<Trip, Error, { id: string; data: UpdateTripRequest }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripRequest }) => 
      api.updateTrip(id, data),
    onSuccess: (updatedTrip) => {
      // Update the specific trip in cache
      queryClient.setQueryData(queryKeys.trip(updatedTrip.id), updatedTrip);
      
      // Invalidate trips list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.trips });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripsWithPhotoCounts });
    },
  });
}

export function useDeleteTrip(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteTrip(id),
    onSuccess: (_, tripId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.trip(tripId) });
      queryClient.removeQueries({ queryKey: queryKeys.tripPhotos(tripId) });
      
      // Invalidate trips list
      queryClient.invalidateQueries({ queryKey: queryKeys.trips });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripsWithPhotoCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
    },
  });
}

// Photos Hooks
export function usePhotos(): UseQueryResult<Photo[], Error> {
  return useQuery({
    queryKey: queryKeys.photos,
    queryFn: () => api.getAllPhotos(),
  });
}

export function useTripPhotos(tripId: string | null): UseQueryResult<Photo[] | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.tripPhotos(tripId!),
    queryFn: () => api.getTripPhotos(tripId!),
    enabled: !!tripId,
  });
}

export function usePhoto(id: string | null): UseQueryResult<Photo | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.photo(id!),
    queryFn: () => api.getPhotoById(id!),
    enabled: !!id,
  });
}

export function usePhotosWithCoordinates(): UseQueryResult<Photo[], Error> {
  return useQuery({
    queryKey: queryKeys.photosWithCoordinates,
    queryFn: () => api.getPhotosWithCoordinates(),
  });
}

export function useUploadPhotos(): UseMutationResult<
  UploadResponse,
  Error,
  {
    tripId: string;
    files: File[];
    metadata?: { title?: string; description?: string };
    onProgress?: (progress: number) => void;
  }
> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tripId, files, metadata, onProgress }) =>
      api.uploadPhotos(tripId, files, metadata, onProgress),
    onSuccess: (result, { tripId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripPhotos(tripId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.photosWithCoordinates });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripsWithPhotoCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
    },
  });
}

export function useUpdatePhoto(): UseMutationResult<Photo, Error, { id: string; data: UpdatePhotoRequest }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePhotoRequest }) =>
      api.updatePhoto(id, data),
    onSuccess: (updatedPhoto) => {
      // Update the specific photo in cache
      queryClient.setQueryData(queryKeys.photo(updatedPhoto.id), updatedPhoto);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripPhotos(updatedPhoto.trip_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.photosWithCoordinates });
    },
  });
}

export function useDeletePhoto(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deletePhoto(id),
    onSuccess: (_, photoId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.photo(photoId) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({ queryKey: queryKeys.photosWithCoordinates });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripsWithPhotoCounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
      
      // Also invalidate all trip photos queries since we don't know which trip this photo belonged to
      queryClient.invalidateQueries({ 
        queryKey: ['trips'], 
        predicate: (query) => query.queryKey.includes('photos')
      });
    },
  });
}

// Advanced Hooks
export function useTripsWithPhotoCounts(): UseQueryResult<TripWithPhotoCount[], Error> {
  return useQuery({
    queryKey: queryKeys.tripsWithPhotoCounts,
    queryFn: () => api.getTripsWithPhotoCounts(),
  });
}

export function useStatistics(): UseQueryResult<{
  totalTrips: number;
  totalPhotos: number;
  photosWithGPS: number;
  totalFileSize: number;
  averagePhotosPerTrip: number;
}, Error> {
  return useQuery({
    queryKey: queryKeys.statistics,
    queryFn: () => api.getStatistics(),
  });
}

export function useHealthCheck(): UseQueryResult<{ message: string; timestamp: string }, Error> {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  });
}

// Search Hook with debouncing
export function usePhotoSearch(query: string, debounceMs: number = 300) {
  return useQuery({
    queryKey: ['photos', 'search', query],
    queryFn: () => api.searchPhotos(query),
    enabled: query.length >= 3, // Only search if query is at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Geographic search hook
export function usePhotosByLocation(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
} | null) {
  return useQuery({
    queryKey: ['photos', 'location', bounds],
    queryFn: () => api.getPhotosByLocation(bounds!),
    enabled: !!bounds,
  });
}

// Date range search hook
export function usePhotosByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ['photos', 'date-range', startDate, endDate],
    queryFn: () => api.getPhotosByDateRange(startDate!, endDate!),
    enabled: !!(startDate && endDate),
  });
}
