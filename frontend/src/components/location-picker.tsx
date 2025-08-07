import { TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MapPin, RotateCcw, Crosshair, Navigation } from "lucide-react";
import { toast } from "sonner";
import L, { LeafletMouseEvent, Map } from "leaflet";
import { OpenStreetMap } from "./openstreetmap";
import { LatLng } from "@common/types/nominatim";
import LocationSearch from "./location-search";

interface LocationPickerProps {
  open: boolean;
  onLocationPicked: (location: LatLng) => void;
  onCancel: () => void;
  initialLocation?: LatLng;
}

export const LocationPicker = ({
  onLocationPicked,
  initialLocation,
  open,
  onCancel,
}: LocationPickerProps) => {
  const [selected, setSelected] = useState<LatLng | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    const mapClicked = (e: LeafletMouseEvent) => {
      setSelected(e.latlng);
    };

    if (open) {
      if (
        initialLocation &&
        (initialLocation.lat !== 0 || initialLocation.lng !== 0)
      ) {
        mapRef.current?.setView(initialLocation, 8);
      } else {
        // Otherwise, try to get user's current location
        getCurrentLocation();
      }
    }

    if (mapRef.current) {
      mapRef.current?.addEventListener("click", mapClicked);
      return () => {
        mapRef.current?.removeEventListener("click", mapClicked);
      };
    }
  }, [initialLocation, open, mapRef.current]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelected(userLocation);
        toast.success("Located your current position");
      });
    }
  };

  useEffect(() => {
    selected && mapRef.current?.setView(selected, 4);
  }, [selected]);

  const resetLocation = () => {
    setSelected(null);
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

                <LocationSearch onSelect={(v) => setSelected(v) } />
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
            <OpenStreetMap
              ref={mapRef}
              className="rounded-lg overflow-hidden w-full max-h-full grow"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selected && (
                <Marker
                  position={[selected.lat, selected.lng]}
                  icon={L.divIcon({
                    className: "custom-div-icon",
                    html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                />
              )}
            </OpenStreetMap>
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
