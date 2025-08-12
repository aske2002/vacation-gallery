import { Plus, MapPin, Navigation, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Route } from "vacation-gallery-common";
import { toast } from "sonner";
import {
  useCreateRoute,
  useDeleteRoute,
  useTripRoutes,
} from "@/hooks/useVacationGalleryApi";
import { DefaultLoader } from "../default-loader";
import { LoadingButton } from "../loading-button";
import { useNavigate } from "@tanstack/react-router";

interface RouteListProps {
  tripId: string;
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

export function RouteList({ tripId }: RouteListProps) {
  const navigate = useNavigate();

  const createRouteMutation = useCreateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const {
    isLoading,
    error,
    data: routes,
    refetch: refetchRoutes,
  } = useTripRoutes(tripId);

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
      navigate({
        to: "/admin/$tripId/$routeId",
        params: {
          routeId: route.id,
          tripId: route.trip_id,
        },
      });
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
      await deleteRouteMutation.mutateAsync(routeId);
      toast.success("Route deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete route";
      toast.error(errorMessage);
    }
  };

  const handleCreateRoute = async () => {
    const { id } = await createRouteMutation.mutateAsync({
      trip_id: tripId,
      title: "My New Route",
      description: "",
      profile: "driving-car",
      stops: [],
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <DefaultLoader />
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
          {error.message}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchRoutes()}
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
      <div>
        <LoadingButton
          onClick={handleCreateRoute}
          size="sm"
          loading={createRouteMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Route
        </LoadingButton>
      </div>

      {routes?.length === 0 ? (
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
              <LoadingButton
                onClick={handleCreateRoute}
                loading={createRouteMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create First Route
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {routes?.map((route) => {
            const profileInfo = getProfileInfo(route.profile);
            return (
              <Card
                key={route.id}
                className="hover:shadow-md transition-shadow-"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start justify-between">
                    <span className="flex-1 text-nowrap">{route.title}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRoute(route)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
                    <p className="text-sm text-gray-600">
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
                        <span className="text-gray-600">
                          {route.stops.length} Stops
                        </span>
                      </div>
                    </div>
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
