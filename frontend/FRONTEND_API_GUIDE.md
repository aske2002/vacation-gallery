# Vacation Gallery Frontend API Integration

This document explains how to use the Vacation Gallery API with React Query in your frontend application.

## Setup

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools axios
```

### 2. Setup the QueryClient Provider

Wrap your app with the `ApiProvider`:

```tsx
// App.tsx
import React from 'react';
import { ApiProvider } from './providers/ApiProvider';
import { Dashboard } from './components/VacationGalleryComponents';

function App() {
  return (
    <ApiProvider>
      <div className="App">
        <Dashboard />
      </div>
    </ApiProvider>
  );
}

export default App;
```

## API Class Usage

### Direct API Calls

```tsx
import { api } from './api/vacationGalleryApi';

// Create a trip
const newTrip = await api.createTrip({
  name: 'Summer Vacation 2024',
  description: 'Beach trip to Hawaii',
  start_date: '2024-07-01',
  end_date: '2024-07-15'
});

// Upload photos
const files = [/* File objects from input */];
const result = await api.uploadPhotos(
  tripId, 
  files, 
  { title: 'Beach Photos' },
  (progress) => console.log(`Upload progress: ${progress}%`)
);

// Get image URLs
const imageUrl = api.getImageUrl(photo.filename);
const thumbnailUrl = api.getThumbnailUrl(photo.filename);
```

## React Query Hooks

### Trip Management

```tsx
import {
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useTrip
} from './hooks/useVacationGalleryApi';

function TripManager() {
  // Get all trips
  const { data: trips, isLoading, error } = useTrips();
  
  // Create trip mutation
  const createTrip = useCreateTrip();
  
  // Update trip mutation
  const updateTrip = useUpdateTrip();
  
  // Delete trip mutation
  const deleteTrip = useDeleteTrip();
  
  // Get single trip
  const { data: trip } = useTrip(tripId);

  const handleCreateTrip = () => {
    createTrip.mutate({
      name: 'New Trip',
      description: 'Description'
    });
  };

  const handleUpdateTrip = (id: string) => {
    updateTrip.mutate({
      id,
      data: { name: 'Updated Name' }
    });
  };

  const handleDeleteTrip = (id: string) => {
    deleteTrip.mutate(id);
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

### Photo Management

```tsx
import {
  usePhotos,
  useTripPhotos,
  useUploadPhotos,
  useUpdatePhoto,
  useDeletePhoto,
  usePhotosWithCoordinates
} from './hooks/useVacationGalleryApi';

function PhotoManager({ tripId }: { tripId: string }) {
  // Get all photos
  const { data: allPhotos } = usePhotos();
  
  // Get photos for specific trip
  const { data: tripPhotos } = useTripPhotos(tripId);
  
  // Get photos with GPS coordinates
  const { data: gpsPhotos } = usePhotosWithCoordinates();
  
  // Upload photos
  const uploadPhotos = useUploadPhotos();
  
  // Update photo
  const updatePhoto = useUpdatePhoto();
  
  // Delete photo
  const deletePhoto = useDeletePhoto();

  const handleUpload = (files: File[]) => {
    uploadPhotos.mutate({
      tripId,
      files,
      metadata: { title: 'Uploaded Photos' },
      onProgress: (progress) => console.log(`${progress}%`)
    });
  };

  const handleUpdatePhoto = (photoId: string) => {
    updatePhoto.mutate({
      id: photoId,
      data: { title: 'Updated Title' }
    });
  };

  return (
    <div>
      {/* Upload component */}
      <input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleUpload(Array.from(e.target.files));
          }
        }}
      />
      
      {/* Upload progress */}
      {uploadPhotos.isPending && (
        <div>Uploading...</div>
      )}
    </div>
  );
}
```

### Advanced Hooks

```tsx
import {
  useTripsWithPhotoCounts,
  useStatistics,
  usePhotoSearch,
  usePhotosByLocation,
  usePhotosByDateRange,
  useHealthCheck
} from './hooks/useVacationGalleryApi';

function AdvancedFeatures() {
  // Get trips with photo counts
  const { data: tripsWithCounts } = useTripsWithPhotoCounts();
  
  // Get statistics
  const { data: stats } = useStatistics();
  
  // Search photos
  const { data: searchResults } = usePhotoSearch('beach');
  
  // Get photos by location
  const { data: locationPhotos } = usePhotosByLocation({
    north: 40.7829,
    south: 40.7489,
    east: -73.9441,
    west: -73.9927
  });
  
  // Get photos by date range
  const { data: dateRangePhotos } = usePhotosByDateRange(
    '2024-01-01',
    '2024-12-31'
  );
  
  // Health check
  const { data: health } = useHealthCheck();

  return (
    <div>
      <h2>Statistics</h2>
      {stats && (
        <div>
          <p>Total Trips: {stats.totalTrips}</p>
          <p>Total Photos: {stats.totalPhotos}</p>
          <p>Photos with GPS: {stats.photosWithGPS}</p>
          <p>Average Photos per Trip: {stats.averagePhotosPerTrip}</p>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

All hooks return error states that you can handle:

```tsx
function ComponentWithErrorHandling() {
  const { data, isLoading, error } = useTrips();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Success UI */}</div>;
}
```

## Optimistic Updates

React Query automatically handles cache updates for mutations:

```tsx
function OptimisticComponent() {
  const createTrip = useCreateTrip();

  const handleCreate = () => {
    createTrip.mutate(
      { name: 'New Trip' },
      {
        onSuccess: (newTrip) => {
          // Trip is automatically added to cache
          console.log('Trip created:', newTrip);
        },
        onError: (error) => {
          console.error('Failed to create trip:', error);
        }
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={createTrip.isPending}>
      {createTrip.isPending ? 'Creating...' : 'Create Trip'}
    </button>
  );
}
```

## Loading States and Progress

```tsx
function UploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const uploadPhotos = useUploadPhotos();

  const handleUpload = (files: File[]) => {
    uploadPhotos.mutate({
      tripId: 'some-trip-id',
      files,
      onProgress: setProgress
    });
  };

  return (
    <div>
      {uploadPhotos.isPending && (
        <div>
          <div>Uploading... {progress}%</div>
          <div
            style={{
              width: '100%',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: '#007bff',
                height: '8px',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## TypeScript Support

All hooks and the API class are fully typed:

```tsx
import type { Trip, Photo, CreateTripRequest } from './api/vacationGalleryApi';

function TypedComponent() {
  const { data: trips } = useTrips(); // trips is Trip[] | undefined
  const createTrip = useCreateTrip(); // Expects CreateTripRequest

  const handleSubmit = (tripData: CreateTripRequest) => {
    createTrip.mutate(tripData);
  };

  return <div>{/* Your component */}</div>;
}
```

## Configuration

### API Base URL

Change the base URL by modifying the API constructor:

```tsx
// api/vacationGalleryApi.ts
export const api = new VacationGalleryApi('https://your-api-domain.com/api');
```

### Query Client Configuration

Customize React Query behavior:

```tsx
// providers/ApiProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Best Practices

1. **Use the hooks instead of direct API calls** for automatic caching and state management
2. **Handle loading and error states** in your components
3. **Use optimistic updates** for better UX with mutations
4. **Implement proper error boundaries** for unhandled errors
5. **Use the devtools** in development to debug queries
6. **Prefetch data** when you know it will be needed soon

## Example App Structure

```
src/
├── api/
│   └── vacationGalleryApi.ts     # API class with Axios
├── hooks/
│   └── useVacationGalleryApi.ts  # React Query hooks
├── providers/
│   └── ApiProvider.tsx           # Query client provider
├── components/
│   └── VacationGalleryComponents.tsx  # Example components
└── App.tsx                       # Main app with provider
```

This setup provides a robust, type-safe, and efficient way to interact with your Vacation Gallery API!
