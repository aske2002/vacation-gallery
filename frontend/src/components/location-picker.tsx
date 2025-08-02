import {
  Map,
  MapMouseEvent,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { MapPin, RotateCcw, Crosshair, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: google.maps.LatLng;
  };
  types: string[];
}

interface LocationPickerProps {
  open: boolean;
  onLocationPicked: (location: google.maps.LatLngLiteral) => void;
  onCancel: () => void;
  initialLocation?: google.maps.LatLngLiteral;
}

export const LocationPicker = ({
  onLocationPicked,
  initialLocation,
  open,
  onCancel,
}: LocationPickerProps) => {
  const placesLibrary = useMapsLibrary("places");
  const [selected, setSelected] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [lastKnownLocation, setLastKnownLocation] =
    useState<google.maps.LatLngLiteral>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [zoom, setZoom] = useState(3);
  const map = useMap();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ["reverseGeocode", debouncedSearch, placesLibrary],
    queryFn: async () => {
      if (!placesLibrary) return [];
      const request = {
        textQuery: debouncedSearch,
        locationBias: lastKnownLocation,
        fields: ["types", "displayName", "formattedAddress", "location"],
      } satisfies google.maps.places.SearchByTextRequest;
      const { places } = await placesLibrary.Place.searchByText(request);
      const searchResults: SearchResult[] = places
        .slice(0, 8)
        .filter((place) => place.location)
        .map((place) => ({
          place_id: place.id,
          name: place.displayName || "",
          formatted_address: place.formattedAddress || "",
          geometry: {
            location: place.location!,
          },
          types: place.types || [],
        }));
      setShowResults(true);
      return searchResults;
    },
    initialData: [],
    enabled: !!placesLibrary && searchQuery.length > 2,
  });

  const selectSearchResult = (result: SearchResult) => {
    const latLng = {
      lat: result.geometry.location.lat(),
      lng: result.geometry.location.lng(),
    };

    setSelected(latLng);
    setShowResults(false);
    searchTimeoutRef.current && clearTimeout(searchTimeoutRef.current);

    map?.panTo(latLng);
    map?.setZoom(15);
    setZoom(15);

    toast.success(`Selected: ${result.name || result.formatted_address}`);
  };

  useEffect(() => {
    if (open && map) {
      if (
        initialLocation &&
        (initialLocation.lat !== 0 || initialLocation.lng !== 0)
      ) {
        setSelected(initialLocation);
        setZoom(15);
        map?.panTo(initialLocation);
        map?.setZoom(15);
      } else {
        // Otherwise, try to get user's current location
        getCurrentLocation();
      }
      setTimeout(() => {
        if (map) {
          google.maps.event.trigger(map, "resize");
        }
      }, 100);
    } else {
      setSearchQuery("");
      setShowResults(false);
    }
  }, [map, initialLocation, open]);

  const getCurrentLocation = () => {
    console.log("Located your current position");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map?.panTo(userLocation);
          map?.setZoom(12);
          setZoom(12);
          setSelected(userLocation);
          setLastKnownLocation(userLocation);
          toast.success("Located your current position");
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to a default location (e.g., New York)
          const fallbackLocation = { lat: 40.7128, lng: -74.006 };
          map?.panTo(fallbackLocation);
          map?.setZoom(10);
          setZoom(10);
        }
      );
    }
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      setSelected(e.detail.latLng);
      setShowResults(false);
    }
  };
  // Helper function to get appropriate icon for place type
  const getPlaceTypeIcon = (types: string[]): string => {
    if (!types || types.length === 0) return "📍";

    if (
      types.includes("restaurant") ||
      types.includes("food") ||
      types.includes("meal_takeaway")
    )
      return "🍽️";
    if (types.includes("lodging")) return "🏨";
    if (types.includes("tourist_attraction")) return "🎯";
    if (types.includes("park")) return "🌳";
    if (types.includes("museum")) return "🏛️";
    if (types.includes("shopping_mall") || types.includes("store")) return "🛍️";
    if (types.includes("gas_station")) return "⛽";
    if (types.includes("hospital")) return "🏥";
    if (types.includes("school") || types.includes("university")) return "🎓";
    if (types.includes("bank")) return "🏦";
    if (types.includes("church") || types.includes("place_of_worship"))
      return "⛪";
    if (types.includes("airport")) return "✈️";
    if (types.includes("subway_station") || types.includes("train_station"))
      return "🚇";
    if (types.includes("bus_station")) return "🚌";

    return "📍";
  };

  const resetLocation = () => {
    setSelected(null);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSubmit = () => {
    if (selected) {
      onLocationPicked(selected);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-7xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Set Photo Location
          </DialogTitle>
          <DialogDescription>
            Search for places, click on the map, or enter coordinates manually
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(95vh-200px)] grid-rows-[auto_1fr] lg:grid-rows-1">
            {/* Search and Controls Panel */}
            <div className="lg:col-span-1 space-y-4 max-h-full pr-2">
              {/* Live Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Places</label>
                <div className="relative">
                  <Input
                    placeholder="Search restaurants, landmarks, addresses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchResults.length > 0 && setShowResults(true)
                    }
                    onBlur={() => {
                      // Hide results after a small delay to allow clicking on results
                      setTimeout(() => setShowResults(false), 100);
                    }}
                    className="pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {/* Live Search Results */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1">
                      <Command className="rounded-lg border shadow-md bg-popover">
                        <CommandList className="max-h-60">
                          <CommandGroup>
                            {searchResults.map((result) => (
                              <CommandItem
                                key={result.place_id}
                                onSelect={() => selectSearchResult(result)}
                                className="cursor-pointer"
                              >
                                <span className="mr-2 text-lg">
                                  {getPlaceTypeIcon(result.types)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {result.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {result.formatted_address}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Try: "Eiffel Tower", "restaurants near Central Park", or any
                  address
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="flex-1"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Current Location
                </Button>
                <Button variant="outline" size="sm" onClick={resetLocation}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected Location Info */}
              {selected && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Selected Location
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-mono">
                    Lat: {selected.lat.toFixed(6)}
                    <br />
                    Lng: {selected.lng.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <Map
              defaultCenter={initialLocation}
              defaultZoom={zoom}
              onClick={handleMapClick}
              className="rounded-lg overflow-hidden w-full max-h-full grow"
              mapId="location-picker-map"
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              scaleControl={true}
              streetViewControl={false}
              rotateControl={false}
              fullscreenControl={true}
            >
              {selected && (
                <Marker
                  position={selected}
                  title={`Lat: ${selected.lat.toFixed(6)}, Lng: ${selected.lng.toFixed(6)}`}
                />
              )}
            </Map>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 mt-4">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-muted-foreground">
              {selected
                ? `Location: ${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`
                : "Search, click on map, or enter coordinates to select location"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selected}
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Confirm Location
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
