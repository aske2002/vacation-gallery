import { useState, useCallback } from 'react';
import { api } from '@/api/api';
import { Route, RouteWithStops } from '@common/types/route';
import { CreateRouteRequest, UpdateRouteRequest } from '@common/types/request/create-route-request';
import { toast } from 'sonner';

export function useRoutes(tripId: string) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [currentRoute, setCurrentRoute] = useState<RouteWithStops | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const routesData = await api.getTripRoutes(tripId);
      setRoutes(routesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load routes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const loadRoute = useCallback(async (routeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const route = await api.getRouteById(routeId);
      setCurrentRoute(route);
      return route;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load route';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoute = useCallback(async (data: CreateRouteRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate route data
      const validation = api.validateRoute(data);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      }

      const newRoute = await api.createRoute(data);
      setCurrentRoute(newRoute);
      
      // Refresh routes list
      await loadRoutes();
      
      toast.success('Route created successfully');
      return newRoute;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create route';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadRoutes]);

  const updateRoute = useCallback(async (routeId: string, data: UpdateRouteRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedRoute = await api.updateRoute(routeId, data);
      setCurrentRoute(updatedRoute);
      
      // Refresh routes list
      await loadRoutes();
      
      toast.success('Route updated successfully');
      return updatedRoute;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update route';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadRoutes]);

  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.deleteRoute(routeId);
      
      // Clear current route if it was deleted
      if (currentRoute?.id === routeId) {
        setCurrentRoute(null);
      }
      
      // Refresh routes list
      await loadRoutes();
      
      toast.success('Route deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete route';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentRoute?.id, loadRoutes]);

  const regenerateRoute = useCallback(async (routeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const regeneratedRoute = await api.regenerateRoute(routeId);
      setCurrentRoute(regeneratedRoute);
      
      // Refresh routes list
      await loadRoutes();
      
      toast.success('Route path regenerated successfully');
      return regeneratedRoute;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate route';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadRoutes]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCurrentRoute = useCallback(() => {
    setCurrentRoute(null);
  }, []);

  return {
    // State
    routes,
    currentRoute,
    isLoading,
    error,
    
    // Actions
    loadRoutes,
    loadRoute,
    createRoute,
    updateRoute,
    deleteRoute,
    regenerateRoute,
    clearError,
    clearCurrentRoute,
    
    // Utility functions
    formatDistance: api.formatRouteDistance.bind(api),
    formatDuration: api.formatRouteDuration.bind(api),
    getRouteSummary: api.getRouteSummary.bind(api),
    getRouteCoordinates: api.getRouteCoordinates.bind(api),
    getRouteBounds: api.getRouteBounds.bind(api),
  };
}
