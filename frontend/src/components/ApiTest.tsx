import React, { useState } from 'react';
import {
  useTrips,
  useCreateTrip,
  useUploadPhotos,
  useStatistics,
  useHealthCheck,
  useDeleteTrip
} from '../hooks/useVacationGalleryApi';
import { api } from '../api/vacationGalleryApi';

export const ApiTest: React.FC = () => {
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Hooks
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: stats } = useStatistics();
  const { data: health } = useHealthCheck();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();
  const uploadPhotos = useUploadPhotos();

  const handleCreateTestTrip = () => {
    createTrip.mutate({
      name: 'Test Trip ' + new Date().toISOString().split('T')[0],
      description: 'Test trip created from frontend',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTrip.mutate(tripId);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedTripId) {
      const fileArray = Array.from(files);
      uploadPhotos.mutate({
        tripId: selectedTripId,
        files: fileArray,
        metadata: {
          title: `Upload from ${new Date().toLocaleString()}`
        },
        onProgress: setUploadProgress
      });
    } else if (!selectedTripId) {
      alert('Please select a trip first');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Vacation Gallery API Test</h1>
      
      {/* Health Check */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>API Health</h3>
        <p>Status: {health?.message || 'Unknown'}</p>
        <p>Timestamp: {health?.timestamp || 'Unknown'}</p>
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Statistics</h3>
        {stats ? (
          <div>
            <p>Total Trips: {stats.totalTrips}</p>
            <p>Total Photos: {stats.totalPhotos}</p>
            <p>Photos with GPS: {stats.photosWithGPS}</p>
            <p>Avg Photos per Trip: {stats.averagePhotosPerTrip.toFixed(1)}</p>
          </div>
        ) : (
          <p>Loading statistics...</p>
        )}
      </div>

      {/* Trip Management */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Trip Management</h3>
        
        <button 
          onClick={handleCreateTestTrip}
          disabled={createTrip.isPending}
          style={{ 
            padding: '8px 16px', 
            marginBottom: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {createTrip.isPending ? 'Creating...' : 'Create Test Trip'}
        </button>

        {tripsLoading ? (
          <p>Loading trips...</p>
        ) : (
          <div>
            <h4>Existing Trips ({trips?.length || 0})</h4>
            {trips?.map(trip => (
              <div 
                key={trip.id} 
                style={{ 
                  padding: '10px', 
                  margin: '5px 0', 
                  border: '1px solid #eee', 
                  borderRadius: '4px',
                  backgroundColor: selectedTripId === trip.id ? '#e7f3ff' : '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{trip.name}</strong>
                    <p style={{ margin: '5px 0', color: '#666' }}>{trip.description}</p>
                    <small>
                      {trip.start_date} to {trip.end_date}
                    </small>
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedTripId(trip.id)}
                      style={{
                        padding: '4px 8px',
                        marginRight: '8px',
                        backgroundColor: selectedTripId === trip.id ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {selectedTripId === trip.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      disabled={deleteTrip.isPending}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Upload */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Photo Upload</h3>
        
        {selectedTripId ? (
          <div>
            <p>Selected Trip: <strong>{trips?.find(t => t.id === selectedTripId)?.name}</strong></p>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploadPhotos.isPending}
              style={{ marginBottom: '10px' }}
            />

            {uploadPhotos.isPending && (
              <div>
                <p>Uploading... {uploadProgress}%</p>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: '#007bff',
                      height: '8px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {uploadPhotos.isError && (
              <p style={{ color: 'red' }}>
                Upload failed: {uploadPhotos.error?.message}
              </p>
            )}

            {uploadPhotos.isSuccess && (
              <p style={{ color: 'green' }}>
                Upload successful! {uploadPhotos.data?.photos?.length || 0} photos uploaded.
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: '#666' }}>Please select a trip to upload photos</p>
        )}
      </div>

      {/* API URLs */}
      <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>API Information</h3>
        <p><strong>Base URL:</strong> {(api as any).client?.defaults?.baseURL || 'http://localhost:1798/api'}</p>
        <p><strong>Available Endpoints:</strong></p>
        <ul style={{ fontSize: '12px', color: '#666' }}>
          <li>GET /trips - List all trips</li>
          <li>POST /trips - Create trip</li>
          <li>GET /photos - List all photos</li>
          <li>POST /photos/upload/:tripId - Upload photos</li>
          <li>GET /statistics - Get statistics</li>
          <li>GET /health - Health check</li>
        </ul>
      </div>
    </div>
  );
};
