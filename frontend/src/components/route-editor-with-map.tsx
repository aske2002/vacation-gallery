import { useState, useEffect, useMemo, useRef } from "react";
import {
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import {
  X,
  Save,
  MapPin,
  Navigation,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Target,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RouteStop, RouteWithStops } from "@common/types/route";
import {
  UpdateRouteRequest,
  UpdateRouteStop,
} from "@common/types/request/create-route-request";
import { toast } from "sonner";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";
import L, { Map } from "leaflet";
import polyline from "@mapbox/polyline";
import {
  useRoute,
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
} from "./ui/form";
import { LoadingButton } from "./loading-button";
import { OpenStreetMap } from "./openstreetmap";
import LocationSearch from "./location-search";

interface RouteEditorWithMapProps {
  routeId: string;
  onCancel?: () => void;
  onDelete?: (routeId: string) => void;
}

interface EditableRouteStop
  extends Omit<RouteStop, "id" | "route_id" | "created_at" | "updated_at"> {
  id?: string;
  isNew?: boolean;
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

export function RouteEditorWithMap({
  routeId,
  onCancel,
  onDelete,
}: RouteEditorWithMapProps) {
  const createRouteStopMutation = useCreateRouteStop();
  const updateRouteStopMutation = useUpdateRouteStop();
  const deleteRouteStopMutation = useDeleteRouteStop();
  const deleteRouteMutation = useDeleteRoute();
  const { data } = useRoute(routeId);

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
          route_id: routeId,
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
    } as RouteWithStops;

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

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [mapZoom, setMapZoom] = useState(10);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const getDefaultValues = (route: RouteWithStops): UpdateRouteRequest => {
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
        updateRouteStopMutation.isPending &&
        updateRouteStopMutation.variables.stopId === stop.id
    )?.id;
  }, [
    updateRouteStopMutation.isPending,
    updateRouteStopMutation.variables?.stopId,
    stops,
  ]);

  // Initialize map center and zoom based on existing stops
  useEffect(() => {
    if (stops.length > 0) {
      const validStops = stops.filter(
        (stop) => stop.latitude !== 0 && stop.longitude !== 0
      );
      if (validStops.length > 0) {
        // Calculate center of all stops
        const avgLat =
          validStops.reduce((sum, stop) => sum + stop.latitude, 0) /
          validStops.length;
        const avgLng =
          validStops.reduce((sum, stop) => sum + stop.longitude, 0) /
          validStops.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
      }
    }
  }, []);

  const formatDistance = (meters?: number) => {
    if (!meters) return "";
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const addStopFromSearch = async (result: NominatimResult) => {
    const newStopData = {
      title: result.display_name.split(",")[0],
      description: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      order_index: stops.length,
    };

    try {
      await createRouteStopMutation.mutateAsync({
        routeId: routeId,
        data: newStopData,
      });
      setSearchQuery("");
      setShowSearchResults(false);
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
        routeId: routeId,
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

  const updateStop = async (
    index: number,
    value: Partial<EditableRouteStop>
  ) => {
    if (!route) return;

    const stop = stops[index];
    try {
      await updateRouteStopMutation.mutateAsync({
        routeId: route.id,
        stopId: stop.id,
        data: value,
      });

      if (value.latitude !== undefined || value.longitude !== undefined) {
        toast.success("Stop position updated");
      }
    } catch (error) {
      toast.error("Failed to update stop");
      console.error("Error updating stop:", error);
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

  const deleteRoute = async () => {
    if (!route || !onDelete) return;

    if (
      confirm(
        "Are you sure you want to delete this route? This action cannot be undone."
      )
    ) {
      try {
        await deleteRouteMutation.mutateAsync(route.id);
        toast.success("Route deleted successfully");
        onDelete(route.id);
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

  // Component to fit map bounds to show all stops
  function FitBounds() {
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
  }

  useEffect(() => {
    FitBounds();
  }, [route?.id, reset]);

  const polyLineCoords: [number, number][] = useMemo(() => {
    if (!route?.segments || route.segments.length === 0) return [];
    console.log(route.segments)
    try {
      const mergedCoords: [number, number][] = [];

      for (const segment of route.segments) {
        let segmentCoords: [number, number][] = [];
        if (typeof segment.geometry === "string") {
          // Handle encoded polyline string
          try {
            segmentCoords = polyline.decode(segment.geometry);
          } catch (e) {
            console.warn("Failed to decode polyline segment:", e);
          }
        } else if (
          segment.geometry &&
          segment.geometry.type === "LineString" &&
          Array.isArray(segment.geometry.coordinates)
        ) {
          // Handle GeoJSON LineString
          segmentCoords = segment.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );
        }

        // Merge while avoiding duplicate point between segments
        if (segmentCoords.length > 0) {
          if (mergedCoords.length === 0) {
            mergedCoords.push(...segmentCoords);
          } else {
            mergedCoords.push(...segmentCoords.slice(1)); // skip duplicate
          }
        }
      } 
      return mergedCoords;
    } catch (error) {
      console.error("Failed to parse route segments into polyline:", error);
      return [];
    }
  }, [route?.segments]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(saveRoute)}>
        <div className="space-y-4">
          <Card>
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
                  <Button variant="destructive" onClick={deleteRoute} size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
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
              <LocationSearch className="mb-2" onSelect={(_, r) => addStopFromSearch(r)} />

              {stops.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No stops added yet. Search for places or click on the map to
                  add stops.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto gap-2 flex flex-col">
                  {stops.map((stop, index) => (
                    <div
                      key={index}
                      className={`p-2 border rounded-md  ${"border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div className="flex-1 min-w-0">
                          <Input
                            value={stop.title}
                            onChange={(e) =>
                              updateStop(index, { title: e.target.value })
                            }
                            placeholder="Stop name..."
                            className="text-sm border-none p-0 h-auto"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="text-xs text-gray-500">
                            {stop.latitude.toFixed(4)},{" "}
                            {stop.longitude.toFixed(4)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStop(index, "up");
                            }}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStop(index, "down");
                            }}
                            disabled={index === stops.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStop(index);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardContent className="p-0">
              <div className="h-96 rounded-lg overflow-hidden">
                <OpenStreetMap
                  center={mapCenter}
                  zoom={mapZoom}
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
                              routeId: routeId,
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
