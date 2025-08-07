// React Query hooks for the Vacation Gallery API
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  api,
  UpdateTripRequest,
  UploadResponse,
  TripWithPhotoCount,
  UploadPhotosRequest,
} from "../api/api";
import { Photo } from "@common/types/photo";
import { UpdatePhotoRequest } from "@common/types/request/update-photo-request";
import { CreateTripRequest } from "@common/types/request/create-trip-request";
import { Trip } from "@common/types/trip";
import { Route, RouteStop, RouteWithStops } from "@common/types/route";
import {
  CreateRouteRequest,
  UpdateRouteRequest,
  UpdateRouteStop,
} from "@common/types/request/create-route-request";
import { queryClient } from "@/main";

type QueryWithOldData<T> = {
  oldData: T | undefined;
  data: T;
};

// Query Keys
export const queryKeys = {
  trips: ["trips"] as const,
  trip: (id: string) => ["trips", id] as const,
  tripPhotos: (tripId: string) => ["trips", tripId, "photos"] as const,
  photos: ["photos"] as const,
  photo: (id: string) => ["photos", id] as const,
  photosWithCoordinates: ["photos", "with-coordinates"] as const,
  tripsWithPhotoCounts: ["trips", "with-photo-counts"] as const,
  statistics: ["statistics"] as const,
  health: ["health"] as const,
  routes: ["routes"] as const,
  route: (id: string) => ["routes", id] as const,
  tripRoutes: (tripId: string) => ["trips", tripId, "routes"] as const,
  routeStops: (routeId: string) => ["routes", routeId, "stops"] as const,
};

const queryUpdaters = {
  trip: (updatedTrip: Partial<Trip> & { id: string }) => {
    queryClient.setQueryData(
      queryKeys.trip(updatedTrip.id),
      (oldTrip: Trip | undefined) => ({
        ...oldTrip,
        ...updatedTrip,
      })
    );
    queryClient.setQueryData(
      queryKeys.trips,
      (oldTrips: Trip[] | undefined) => {
        return oldTrips?.map((trip) =>
          trip.id === updatedTrip.id ? { ...trip, ...updatedTrip } : trip
        );
      }
    );
    queryClient.setQueryData(
      queryKeys.tripsWithPhotoCounts,
      (oldTrips: TripWithPhotoCount[] | undefined) => {
        return oldTrips?.map((trip) =>
          trip.id === updatedTrip.id ? { ...trip, ...updatedTrip } : trip
        );
      }
    );
  },
  route: (updatedRoute: Partial<Route> & { trip_id: string; id: string }) => {
    queryClient.setQueryData(
      queryKeys.route(updatedRoute.id),
      (oldRoute: RouteWithStops | undefined) => ({
        ...oldRoute,
        ...updatedRoute,
      })
    );
    queryClient.setQueryData(
      queryKeys.tripRoutes(updatedRoute.trip_id),
      (oldRoutes: Route[] | undefined) => {
        return oldRoutes?.find((r) => r.id == updatedRoute.id)
          ? oldRoutes?.map((route) =>
              route.id === updatedRoute.id
                ? { ...route, ...updatedRoute }
                : route
            )
          : [...(oldRoutes || []), updatedRoute];
      }
    );
    queryClient.setQueryData(
      queryKeys.routes,
      (oldRoutes: Route[] | undefined) => {
        return oldRoutes?.find((r) => r.id === updatedRoute.id)
          ? oldRoutes?.map((route) =>
              route.id === updatedRoute.id
                ? { ...route, ...updatedRoute }
                : route
            )
          : [...(oldRoutes || []), updatedRoute];
      }
    );
    queryClient.setQueryData(
      queryKeys.routeStops(updatedRoute.id),
      (oldStops: RouteStop[] | undefined) => {
        return oldStops?.map((stop) =>
          stop.route_id === updatedRoute.id
            ? { ...stop, route_id: updatedRoute.id }
            : stop
        );
      }
    );
  },
  routeStop: (
    updatedStop: Partial<RouteStop> & { route_id: string; id: string }
  ) => {
    queryClient.setQueryData(
      queryKeys.routeStops(updatedStop.route_id),
      (oldStops: RouteStop[] | undefined) => {
        return oldStops?.find((s) => s.id === updatedStop.id)
          ? oldStops?.map((stop) =>
              stop.id === updatedStop.id ? { ...stop, ...updatedStop } : stop
            )
          : [...(oldStops || []), updatedStop];
      }
    );
    queryClient.setQueryData(
      queryKeys.route(updatedStop.route_id),
      (oldRoute: RouteWithStops | undefined) => {
        if (!oldRoute) return undefined;
        return {
          ...oldRoute,
          stops: oldRoute.stops.find((s) => s.id === updatedStop.id)
            ? oldRoute.stops.map((stop) =>
                stop.id === updatedStop.id ? { ...stop, ...updatedStop } : stop
              )
            : [...(oldRoute.stops || []), updatedStop],
        };
      }
    );
  },
};

const queryDeleters = {
  trip: (tripId: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.trip(tripId) });
    queryClient.removeQueries({ queryKey: queryKeys.tripPhotos(tripId) });
    queryClient.setQueryData(
      queryKeys.trips,
      (oldTrips: Trip[] | undefined) => {
        return oldTrips?.filter((trip) => trip.id !== tripId);
      }
    );
    queryClient.setQueryData(
      queryKeys.tripsWithPhotoCounts,
      (oldTrips: TripWithPhotoCount[] | undefined) => {
        return oldTrips?.filter((trip) => trip.id !== tripId);
      }
    );
    queryClient.setQueryData(
      queryKeys.photos,
      (oldPhotos: Photo[] | undefined) => {
        return oldPhotos?.filter((photo) => photo.trip_id !== tripId);
      }
    );
  },
  route: (routeId: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.route(routeId) });
    queryClient.removeQueries({ queryKey: queryKeys.routeStops(routeId) });
    queryClient.setQueryData(
      queryKeys.tripRoutes(routeId),
      (oldRoutes: Route[] | undefined) => {
        return oldRoutes?.filter((route) => route.id !== routeId);
      }
    );
    queryClient.setQueryData(
      queryKeys.routes,
      (oldRoutes: Route[] | undefined) => {
        return oldRoutes?.filter((route) => route.id !== routeId);
      }
    );
  },
  routeStop: (routeId: string, stopId: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.routeStops(routeId) });
    queryClient.setQueryData(
      queryKeys.route(routeId),
      (oldRoute: RouteWithStops | undefined) => {
        if (!oldRoute) return undefined;
        return {
          ...oldRoute,
          stops: oldRoute.stops.filter((stop) => stop.id !== stopId),
        };
      }
    );
    queryClient.setQueryData(
      queryKeys.routeStops(routeId),
      (oldStops: RouteStop[] | undefined) => {
        return oldStops?.filter((stop) => stop.id !== stopId);
      }
    );
  },
};

// Trips Hooks
export function useTrips(): UseQueryResult<Trip[], Error> {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: () => api.getAllTrips(),
  });
}

export function useTrip(
  id: string | null
): UseQueryResult<Trip | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.trip(id!),
    queryFn: () => api.getTripById(id!),
    enabled: !!id,
  });
}

export function useCreateTrip(): UseMutationResult<
  Trip,
  Error,
  CreateTripRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTripRequest) => api.createTrip(data),
    onSuccess: (newTrip) => {
      queryUpdaters.trip(newTrip);
    },
  });
}

export function useUpdateTrip(): UseMutationResult<
  Trip,
  Error,
  { id: string; data: UpdateTripRequest }
> {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripRequest }) =>
      api.updateTrip(id, data),
    onSuccess: (updatedTrip) => {
      // Update the specific trip in cache
      queryUpdaters.trip(updatedTrip);
    },
  });
}

export function useDeleteTrip(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteTrip(id),
    onSuccess: (_, tripId) => {
      queryDeleters.trip(tripId);
    },
  });
}

// Photos Hooks
export function usePhotos(): UseQueryResult<Photo[], Error> {
  return useQuery({
    experimental_prefetchInRender: true, // This is a React Query feature to prefetch data
    queryKey: queryKeys.photos,
    queryFn: () => api.getAllPhotos(),
  });
}

export function useTripPhotos(
  tripId: string | null
): UseQueryResult<Photo[] | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.tripPhotos(tripId!),
    queryFn: () => api.getTripPhotos(tripId!),
    enabled: !!tripId,
  });
}

export function usePhoto(
  id: string | null
): UseQueryResult<Photo | undefined, Error> {
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
    request: UploadPhotosRequest;
    onProgress?: (progress: number) => void;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, onProgress }) =>
      api.uploadPhotos(request, onProgress),
    onSuccess: (result, { request }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPhotos(request.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.photosWithCoordinates,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripsWithPhotoCounts,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
    },
  });
}

export function useUpdatePhoto(): UseMutationResult<
  Photo,
  Error,
  UpdatePhotoRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdatePhotoRequest) => api.updatePhoto(request),
    onSuccess: (updatedPhoto) => {
      // Update the specific photo in cache
      queryClient.setQueryData(queryKeys.photo(updatedPhoto.id), updatedPhoto);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPhotos(updatedPhoto.trip_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.photosWithCoordinates,
      });
    },
  });
}

export function useDeletePhotos(): UseMutationResult<void, Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      api.deletePhotos({
        photoIds: ids,
      }),
    onSuccess: (_, ids) => {
      // Remove from cache
      ids.forEach((id) => {
        queryClient.removeQueries({ queryKey: queryKeys.photo(id) });
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos });
      queryClient.invalidateQueries({
        queryKey: queryKeys.photosWithCoordinates,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripsWithPhotoCounts,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics });

      // Also invalidate all trip photos queries since we don't know which trip this photo belonged to
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        predicate: (query) => query.queryKey.includes("photos"),
      });
    },
  });
}

// Advanced Hooks
export function useTripsWithPhotoCounts(): UseQueryResult<
  TripWithPhotoCount[],
  Error
> {
  return useQuery({
    queryKey: queryKeys.tripsWithPhotoCounts,
    queryFn: () => api.getTripsWithPhotoCounts(),
  });
}

export function useStatistics(): UseQueryResult<
  {
    totalTrips: number;
    totalPhotos: number;
    photosWithGPS: number;
    totalFileSize: number;
    averagePhotosPerTrip: number;
  },
  Error
> {
  return useQuery({
    queryKey: queryKeys.statistics,
    queryFn: () => api.getStatistics(),
  });
}

export function useHealthCheck(): UseQueryResult<
  { message: string; timestamp: string },
  Error
> {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  });
}

// Search Hook with debouncing
export function usePhotoSearch(query: string, debounceMs: number = 300) {
  return useQuery({
    queryKey: ["photos", "search", query],
    queryFn: () => api.searchPhotos(query),
    enabled: query.length >= 3, // Only search if query is at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Geographic search hook
export function usePhotosByLocation(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null
) {
  return useQuery({
    queryKey: ["photos", "location", bounds],
    queryFn: () => api.getPhotosByLocation(bounds!),
    enabled: !!bounds,
  });
}

// Date range search hook
export function usePhotosByDateRange(
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["photos", "date-range", startDate, endDate],
    queryFn: () => api.getPhotosByDateRange(startDate!, endDate!),
    enabled: !!(startDate && endDate),
  });
}

// Routes Hooks
export function useRoutes(): UseQueryResult<Route[], Error> {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: () => api.getAllRoutes(),
  });
}

export function useRoute(
  id: string | null
): UseQueryResult<RouteWithStops | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.route(id!),
    queryFn: () => api.getRouteById(id!),
    enabled: !!id,
  });
}

export function useTripRoutes(
  tripId: string | null
): UseQueryResult<Route[] | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.tripRoutes(tripId!),
    queryFn: () => api.getTripRoutes(tripId!),
    enabled: !!tripId,
  });
}

export function useRouteStops(
  routeId: string | null
): UseQueryResult<RouteStop[] | undefined, Error> {
  return useQuery({
    queryKey: queryKeys.routeStops(routeId!),
    queryFn: () => api.getRouteStops(routeId!),
    enabled: !!routeId,
  });
}

export function useCreateRoute(): UseMutationResult<
  RouteWithStops,
  Error,
  CreateRouteRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRouteRequest) => api.createRoute(data),
    onSuccess: (newRoute) => {
      queryUpdaters.route(newRoute);
    },
  });
}

export function useUpdateRoute(): UseMutationResult<
  RouteWithStops,
  Error,
  { id: string; data: UpdateRouteRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouteRequest }) =>
      api.updateRoute(id, data),
    onSuccess: (updatedRoute) => {
      queryUpdaters.route(updatedRoute);
    },
  });
}

export function useDeleteRoute(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteRoute(id),
    onSuccess: (_, routeId) => {
      queryDeleters.route(routeId);
    },
  });
}

export function useCreateRouteStop(): UseMutationResult<
  RouteWithStops,
  Error,
  {
    routeId: string;
    data: Omit<RouteStop, "id" | "route_id" | "created_at" | "updated_at">;
  }
> {
  return useMutation({
    mutationFn: async ({ routeId, data }) => {
      return api.createRouteStop(routeId, data);
    },
    onSuccess: (route) => {
      queryUpdaters.route(route);
    },
  });
}

export function useUpdateRouteStop(): UseMutationResult<
  RouteWithStops,
  Error,
  { routeId: string; stopId: string; data: UpdateRouteStop }
> {
  return useMutation({
    mutationFn: async ({ routeId, stopId, data }) => {
      return api.updateRouteStop(routeId, stopId, data);
    },
    onSuccess: (updatedRoute) => {
      queryUpdaters.route(updatedRoute);
    },
  });
}

export function useDeleteRouteStop(): UseMutationResult<
  RouteWithStops,
  Error,
  { routeId: string; stopId: string }
> {
  return useMutation({
    mutationFn: ({ routeId, stopId }) => api.deleteRouteStop(routeId, stopId),
    onSuccess: (_, { routeId, stopId }) => {
      queryDeleters.routeStop(routeId, stopId);
    },
  });
}
