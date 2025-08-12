import { useState, useCallback } from "react";
import { api } from "../api/api";
import {
  Coordinate,
  ORSDirectionsRequest,
  HealthResponse,
  ORSRouteResponse,
  TravelTimeResponse,
} from "vacation-gallery-common";

export const useOpenRouteService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.checkOpenRouteHealth();
      setHealth(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to check OpenRouteService health";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDirections = useCallback(
    async (request: ORSDirectionsRequest): Promise<ORSRouteResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getSimpleDirections(request);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get directions";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getTravelTime = useCallback(
    async (
      start: Coordinate,
      end: Coordinate,
      profile?: ORSDirectionsRequest["profile"]
    ): Promise<TravelTimeResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTravelTime(start, end, profile);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get travel time";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPhotoRoute = useCallback(
    async (
      photos: Array<{ latitude: number; longitude: number; id: string }>,
      profile?: ORSDirectionsRequest["profile"]
    ): Promise<ORSRouteResponse> => {
      setLoading(true);
      setError(null);
      try {
        // Convert to Photo[] format expected by the API
        const photoObjects = photos.map((p) => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          // Add other required Photo fields with defaults
          trip_id: "",
          filename: "",
          original_filename: "",
          file_size: 0,
          mime_type: "",
          width: 0,
          height: 0,
          created_at: "",
          updated_at: "",
        }));

        const result = await api.getPhotoRoute(photoObjects, profile);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get photo route";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const optimizeRoute = useCallback(
    async (
      coordinates: Coordinate[],
      profile?: ORSDirectionsRequest["profile"]
    ): Promise<ORSRouteResponse> => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.optimizeRoute(coordinates, profile);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to optimize route";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    health,
    checkHealth,
    getDirections,
    getTravelTime,
    getPhotoRoute,
    optimizeRoute,
    // Utility functions
    formatDuration: api.formatDuration,
    formatDistance: api.formatDistance,
    clearError: () => setError(null),
  };
};
