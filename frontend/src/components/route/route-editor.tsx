import { useState, useEffect, useMemo, useRef } from "react";
import { Marker, Polyline, useMapEvents } from "react-leaflet";
import { Save, Navigation, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Route, RouteStop } from "vacation-gallery-common";
import { UpdateRouteRequest } from "vacation-gallery-common";
import { toast } from "sonner";
import L, { Map } from "leaflet";
import polyline from "@mapbox/polyline";
import {
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
  useUpdateRoute,
  useDeleteRoute,
} from "@/hooks/useVacationGalleryApi";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { LoadingButton } from "../loading-button";
import { OpenStreetMap } from "../openstreetmap";
import LocationSearch from "../location-search";
import RouteStopItem from "./route-stop-item";
import { useNavigate } from "@tanstack/react-router";
import { usePolylineFromRoute } from "@/hooks/useCombinePolylines";

interface RouteEditorWithMapProps {
  route: Route;
}

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  icon?: string;
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

export function RouteEditor({ route: data }: RouteEditorWithMapProps) {
  const createRouteStopMutation = useCreateRouteStop();
  const updateRouteStopMutation = useUpdateRouteStop();
  const deleteRouteStopMutation = useDeleteRouteStop();
  const deleteRouteMutation = useDeleteRoute();

  const navigate = useNavigate();

  const route = useMemo(() => {
    if (updateRouteStopMutation.isSuccess) {
      return updateRouteStopMutation.data;
    }
    if (!data) return undefined;
    const now = new Date().toISOString();
    const beingCreated =
      (createRouteStopMutation.isPending && [
        {
          ...createRouteStopMutation.variables.data,
          created_at: now,
          updated_at: now,
          route_id: data.id,
          id: "new-stop",
        } satisfies RouteStop,
      ]) ||
      [];

    const beingDeletedId = deleteRouteStopMutation.isPending
      ? deleteRouteStopMutation.variables.stopId
      : undefined;

    const isUpdatingLocation =
      updateRouteStopMutation.isPending &&
      (updateRouteStopMutation.variables.data.latitude !== undefined ||
        updateRouteStopMutation.variables.data.longitude !== undefined);

    const sortedStops = [...data.stops, ...beingCreated]
      .slice()
      .filter((stop) => stop.id !== beingDeletedId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((stop) => {
        return updateRouteStopMutation.isPending &&
          updateRouteStopMutation.variables.stopId === stop.id
          ? {
              ...stop,
              ...updateRouteStopMutation.variables.data,
            }
          : stop;
      });

    const result = {
      ...data,
      stops: sortedStops,
    } as Route;

    if (isUpdatingLocation) {
      result.segments = [];
    }

    return result;
  }, [
    data,
    createRouteStopMutation.variables,
    createRouteStopMutation.isPending,
    updateRouteStopMutation.variables,
    updateRouteStopMutation.isPending,
    updateRouteStopMutation.isSuccess,
    updateRouteStopMutation.data,
    deleteRouteStopMutation.variables,
    deleteRouteStopMutation.isPending,
  ]);

  const stops = route?.stops || [];
  const mapref = useRef<Map | null>(null);

  const getDefaultValues = (route: Route): UpdateRouteRequest => {
    return {
      title: route?.title || "",
      description: route?.description || "",
      profile: route?.profile || "driving-car",
    };
  };

  const form = useForm<UpdateRouteRequest>({
    defaultValues: route && getDefaultValues(route),
  });

  const {
    reset,
    handleSubmit,
    formState: { isValid, isDirty },
  } = form;

  useEffect(() => {
    route && reset(getDefaultValues(route));
  }, [route]);

  useEffect(() => {
    reset({
      title: route?.title || "",
      description: route?.description || "",
      profile: route?.profile || "driving-car",
    });
  }, [route, reset]);

  const currentlyUpdatingStopId = useMemo(() => {
    return stops.find(
      (stop) =>
        (updateRouteStopMutation.isPending &&
          updateRouteStopMutation.variables.stopId === stop.id) ||
        (createRouteStopMutation.isPending &&
          createRouteStopMutation.variables.data.title === stop.title)
    )?.id;
  }, [
    updateRouteStopMutation.isPending,
    updateRouteStopMutation.variables?.stopId,
    stops,
  ]);

  // Initialize map center and zoom based on existing stops
  useEffect(() => {
    if (!mapref.current) return;

    const validStops = stops.filter(
      (stop) => stop.latitude !== 0 && stop.longitude !== 0
    );

    if (validStops.length > 1) {
      const bounds = L.latLngBounds(
        validStops.map((stop) => [stop.latitude, stop.longitude])
      );
      mapref.current.fitBounds(bounds, { padding: [20, 20] });
    } else if (validStops.length === 1) {
      mapref.current.setView(
        [validStops[0].latitude, validStops[0].longitude],
        15
      );
    }
  }, [stops, route, mapref.current]);

  const addStopFromSearch = async (result: NominatimResult) => {
    const newStopData = {
      title: result.display_name.split(",")[0],
      description: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      order_index: stops.length,
    };

    try {
      mapref.current?.setView(
        [newStopData.latitude, newStopData.longitude],
        15
      );
      await createRouteStopMutation.mutateAsync({
        routeId: data.id,
        data: newStopData,
      });
      toast.success(`Added stop: ${newStopData.title}`);
    } catch (error) {
      toast.error("Failed to add stop");
      console.error("Error creating stop:", error);
    }
  };

  const addStopFromMapClick = async (lat: number, lng: number) => {
    const newStopData = {
      title: `Stop ${stops.length + 1}`,
      description: "",
      latitude: lat,
      longitude: lng,
      order_index: stops.length,
    };

    try {
      await createRouteStopMutation.mutateAsync({
        routeId: data.id,
        data: newStopData,
      });
      toast.success("Stop added and route updated");
    } catch (error) {
      toast.error("Failed to add stop");
      console.error("Error creating stop:", error);
    }
  };

  const removeStop = async (index: number) => {
    if (!route) return;

    const stop = stops[index];
    try {
      await deleteRouteStopMutation.mutateAsync({
        routeId: route.id,
        stopId: stop.id,
      });
      toast.success("Stop deleted successfully");
    } catch (error) {
      toast.error("Failed to delete stop");
      console.error("Error deleting stop:", error);
    }
  };

  const moveStop = async (index: number, direction: "up" | "down") => {
    const stop = stops.at(index);
    if (!route || !stop) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stops.length) return;

    await updateRouteStopMutation.mutateAsync({
      routeId: route.id,
      stopId: stop.id,
      data: {
        ...stop,
        order_index: newIndex,
      },
    });
  };

  const saveRouteMutation = useUpdateRoute();
  const { isPending: isSaving } = saveRouteMutation;

  const saveRoute = async (request: UpdateRouteRequest) => {
    if (!route) return;
    saveRouteMutation
      .mutateAsync({
        id: route.id,
        data: request,
      })
      .then(() => toast.success("Route has been saved"))
      .catch((e) =>
        toast.error("Error saving route", {
          description: e.toString(),
        })
      );
  };

  const navigateBack = () => {
    route &&
      navigate({ to: "/admin/$tripId", params: { tripId: route.trip_id } });
  };

  const deleteRoute = async () => {
    if (!route) return;

    if (
      confirm(
        "Are you sure you want to delete this route? This action cannot be undone."
      )
    ) {
      try {
        await deleteRouteMutation.mutateAsync(route.id);
        toast.success("Route deleted successfully");
        navigateBack();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete route";
        toast.error(errorMessage);
      }
    }
  };

  // Map click handler component
  function MapEvents() {
    useMapEvents({
      click: (e) => {
        addStopFromMapClick(e.latlng.lat, e.latlng.lng);
      },
    });

    return null;
  }

  const polyLineCoords = usePolylineFromRoute(route);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(saveRoute)}>
        <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 w-full gap-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Edit Route
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Route Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="input"
                          placeholder="Enter route title..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile *</FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transportation mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {transportationProfiles.map((prof) => (
                              <SelectItem key={prof.value} value={prof.value}>
                                {prof.icon} {prof.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="input"
                        rows={2}
                        id="description"
                        placeholder="Describe this route..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    onClick={deleteRoute}
                    type="button"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={navigateBack}>
                    Cancel
                  </Button>
                  <LoadingButton
                    type="submit"
                    loading={isSaving}
                    disabled={!isValid || !isDirty}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </LoadingButton>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full pb-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Route Map
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationSearch
                className="mb-4"
                referenceLocation={
                  stops.at(0)
                    ? {
                        lat: stops[0].latitude,
                        lng: stops[0].longitude,
                      }
                    : undefined
                }
                onSelect={(_, r) => addStopFromSearch(r)}
              />

              {stops.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No stops added yet. Search for places or click on the map to
                  add stops.
                </div>
              ) : (
                <div className=" gap-2 flex flex-col">
                  {stops.map((stop, index) => (
                    <RouteStopItem
                      stop={stop}
                      onNavigateClicked={() => {
                        mapref.current?.setView(
                          [stop.latitude, stop.longitude],
                          12
                        );
                      }}
                      key={stop.id}
                      moveStop={(dir) => moveStop(index, dir)}
                      totalStops={stops.length}
                    />
                  ))}
                </div>
              )}
            </CardContent>
            <CardContent className="p-0">
              <div className="h-96 rounded-lg overflow-hidden">
                <OpenStreetMap
                  className="h-full w-full"
                  zoomControl={true}
                  ref={mapref}
                  scrollWheelZoom={true}
                >
                  <MapEvents />
                  {polyLineCoords.length > 1 && (
                    <Polyline
                      key={`polyline-${stops.length}-${stops.map((s) => `${s.latitude},${s.longitude}`).join("-")}`}
                      positions={polyLineCoords}
                      color="#3b82f6"
                      weight={6}
                      opacity={0.8}
                      dashArray="5, 10"
                    />
                  )}

                  {/* Stop markers */}
                  {stops.map((stop, index) => {
                    if (stop.latitude === 0 && stop.longitude === 0)
                      return null;
                    const isCurrentlyUpdating =
                      currentlyUpdatingStopId === stop.id;

                    return (
                      <Marker
                        draggable={!isCurrentlyUpdating}
                        key={`${index}-${stop.latitude}-${stop.longitude}`}
                        position={{
                          lat: stop.latitude,
                          lng: stop.longitude,
                        }}
                        eventHandlers={{
                          moveend: (e) => {
                            updateRouteStopMutation.mutateAsync({
                              routeId: data.id,
                              stopId: stop.id,
                              data: {
                                latitude: e.target.getLatLng().lat,
                                longitude: e.target.getLatLng().lng,
                              },
                            });
                          },
                        }}
                        icon={L.divIcon({
                          // Gray if updating
                          className: "custom-div-icon",
                          html: `
                          <div style="
                            background-color: ${!isCurrentlyUpdating ? "#3b82f6" : "#707070"};
                            width: 24px; 
                            height: 24px; 
                            border-radius: 50%; 
                            border: 2px solid white; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: white;
                            font-size: 10px;
                          ">
                            ${index + 1}
                          </div>
                        `,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12],
                        })}
                      />
                    );
                  })}
                </OpenStreetMap>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
