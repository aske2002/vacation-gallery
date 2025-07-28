// Example React components using the Vacation Gallery API with React Query
import React, { useState } from 'react';
import {
  useTrips,
  useCreateTrip,
  useDeleteTrip,
  useTripPhotos,
  useUploadPhotos,
  useTripsWithPhotoCounts,
  useStatistics,
} from '../hooks/useVacationGalleryApi';
import { CreateTripRequest } from '../api/vacationGalleryApi';

// Trip List Component
export function TripList() {
  const { data: trips, isLoading, error } = useTrips();
  const deleteTrip = useDeleteTrip();

  if (isLoading) return <div>Loading trips...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="trip-list">
      <h2>Your Trips</h2>
      {trips?.map((trip) => (
        <div key={trip.id} className="trip-card">
          <h3>{trip.name}</h3>
          {trip.description && <p>{trip.description}</p>}
          <div className="trip-dates">
            {trip.start_date && <span>From: {trip.start_date}</span>}
            {trip.end_date && <span>To: {trip.end_date}</span>}
          </div>
          <button
            onClick={() => deleteTrip.mutate(trip.id)}
            disabled={deleteTrip.isPending}
          >
            {deleteTrip.isPending ? 'Deleting...' : 'Delete Trip'}
          </button>
        </div>
      ))}
    </div>
  );
}

// Create Trip Form Component
export function CreateTripForm() {
  const [formData, setFormData] = useState<CreateTripRequest>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const createTrip = useCreateTrip();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrip.mutate(formData, {
      onSuccess: () => {
        // Reset form
        setFormData({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-trip-form">
      <h2>Create New Trip</h2>
      
      <div>
        <label htmlFor="name">Trip Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="start_date">Start Date</label>
        <input
          id="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="end_date">End Date</label>
        <input
          id="end_date"
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      </div>

      <button type="submit" disabled={createTrip.isPending}>
        {createTrip.isPending ? 'Creating...' : 'Create Trip'}
      </button>

      {createTrip.error && (
        <div className="error">Error: {createTrip.error.message}</div>
      )}
    </form>
  );
}

// Photo Upload Component
export function PhotoUpload({ tripId }: { tripId: string }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadPhotos = useUploadPhotos();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    uploadPhotos.mutate(
      {
        tripId,
        files: selectedFiles,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          setSelectedFiles([]);
          setUploadProgress(0);
        },
      }
    );
  };

  return (
    <div className="photo-upload">
      <h3>Upload Photos</h3>
      
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
      />
      
      {selectedFiles.length > 0 && (
        <div>
          <p>{selectedFiles.length} files selected</p>
          <button onClick={handleUpload} disabled={uploadPhotos.isPending}>
            {uploadPhotos.isPending ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
      )}

      {uploadPhotos.isPending && (
        <div className="upload-progress">
          <div>Progress: {uploadProgress}%</div>
          <div
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {uploadPhotos.error && (
        <div className="error">Upload failed: {uploadPhotos.error.message}</div>
      )}
    </div>
  );
}

// Trip Photos Component
export function TripPhotos({ tripId }: { tripId: string }) {
  const { data: photos, isLoading, error } = useTripPhotos(tripId);
  const { api } = useApi(); // Assuming you create this hook

  if (isLoading) return <div>Loading photos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="trip-photos">
      <h3>Photos ({photos?.length || 0})</h3>
      
      <div className="photo-grid">
        {photos?.map((photo) => (
          <div key={photo.id} className="photo-item">
            <img
              src={api.getThumbnailUrl(photo.filename)}
              alt={photo.title || photo.original_filename}
              loading="lazy"
            />
            <div className="photo-info">
              <h4>{photo.title || photo.original_filename}</h4>
              {photo.description && <p>{photo.description}</p>}
              {photo.taken_at && (
                <time>{new Date(photo.taken_at).toLocaleDateString()}</time>
              )}
              {photo.latitude && photo.longitude && (
                <div className="coordinates">
                  📍 {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard Component with Statistics
export function Dashboard() {
  const { data: tripsWithCounts, isLoading: tripsLoading } = useTripsWithPhotoCounts();
  const { data: stats, isLoading: statsLoading } = useStatistics();

  if (tripsLoading || statsLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Vacation Gallery Dashboard</h1>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Trips</h3>
            <div className="stat-value">{stats.totalTrips}</div>
          </div>
          <div className="stat-card">
            <h3>Total Photos</h3>
            <div className="stat-value">{stats.totalPhotos}</div>
          </div>
          <div className="stat-card">
            <h3>Photos with GPS</h3>
            <div className="stat-value">{stats.photosWithGPS}</div>
          </div>
          <div className="stat-card">
            <h3>Average Photos/Trip</h3>
            <div className="stat-value">{stats.averagePhotosPerTrip}</div>
          </div>
        </div>
      )}

      <div className="trips-overview">
        <h2>Recent Trips</h2>
        {tripsWithCounts?.slice(0, 5).map((trip) => (
          <div key={trip.id} className="trip-summary">
            <h3>{trip.name}</h3>
            <div>{trip.photoCount} photos</div>
            {trip.start_date && (
              <div>Started: {new Date(trip.start_date).toLocaleDateString()}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook to access the API instance
function useApi() {
  // Import the api instance
  const { api } = require('../api/vacationGalleryApi');
  return { api };
}
