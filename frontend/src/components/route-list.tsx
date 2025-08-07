import React, { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Navigation,
  Settings,
  Clock,
  Ruler,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/api/api";
import { Route, RouteWithStops } from "@common/types/route";
import { toast } from "sonner";

interface RouteListProps {
  tripId: string;
  onCreateRoute?: () => void;
  onEditRoute?: (routeId: string) => void;
  refreshTrigger?: number;
}

const transportationProfiles = [
  { value: "driving-car", label: "Car", icon: "🚗" },
  { value: "driving-hgv", label: "Truck", icon: "🚛" },
  { value: "cycling-regular", label: "Bike", icon: "🚴" },
  { value: "cycling-road", label: "Road Bike", icon: "🚴‍♀️" },
  { value: "cycling-mountain", label: "Mountain Bike", icon: "🚵" },
  { value: "cycling-electric", label: "E-Bike", icon: "🚴‍♂️" },
  { value: "foot-walking", label: "Walking", icon: "🚶" },
  { value: "foot-hiking", label: "Hiking", icon: "🥾" },
  { value: "wheelchair", label: "Wheelchair", icon: "♿" },
];

export function RouteList({
  tripId,
  onCreateRoute,
  onEditRoute,
  refreshTrigger,
}: RouteListProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const routesData = await api.getTripRoutes(tripId);
      setRoutes(routesData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load routes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [tripId, refreshTrigger]);

  const formatDistance = (meters?: number) => {
    if (!meters) return "Unknown";
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProfileInfo = (profileValue: string) => {
    const profile = transportationProfiles.find(
      (p) => p.value === profileValue
    );
    return profile || { value: profileValue, label: profileValue, icon: "🚗" };
  };

  const handleEditRoute = async (route: Route) => {
    try {
      const routeWithStops = await api.getRouteById(route.id);
      onEditRoute?.(routeWithStops.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load route details";
      toast.error(errorMessage);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this route? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.deleteRoute(routeId);
      toast.success("Route deleted successfully");
      loadRoutes(); // Refresh the list
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete route";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading routes...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadRoutes}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Routes ({routes.length})
        </h2>
        {onCreateRoute && (
          <Button onClick={onCreateRoute} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Route
          </Button>
        )}
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No routes yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first route to plan your journey with multiple
                stops.
              </p>
              {onCreateRoute && (
                <Button onClick={onCreateRoute}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Route
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => {
            const profileInfo = getProfileInfo(route.profile);
            return (
              <Card
                key={route.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start justify-between">
                    <span className="flex-1 truncate">{route.title}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {onEditRoute && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRoute(route)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {route.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {route.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <span>{profileInfo.icon}</span>
                      {profileInfo.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Stops:</span>
                        <span className="font-medium">Coming soon</span>
                      </div>
                    </div>

                    {route.total_distance && (
                      <div className="flex items-center gap-1 text-sm">
                        <Ruler className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">
                          {formatDistance(route.total_distance)}
                        </span>
                      </div>
                    )}

                    {route.total_duration && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {formatDuration(route.total_duration)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-2">
                    Created: {new Date(route.created_at).toLocaleDateString()}
                    {route.updated_at !== route.created_at && (
                      <>
                        {" "}
                        • Updated:{" "}
                        {new Date(route.updated_at).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
