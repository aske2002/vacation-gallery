import { Map, MapMouseEvent, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface LocationPickerProps {
  imageSrc: string;
  open: boolean;
  onLocationPicked: (location: google.maps.LatLngLiteral) => void;
  onCancel: () => void;
  initialLocation: google.maps.LatLngLiteral;
}

export const LocationPicker = ({
  onLocationPicked,
  initialLocation,
  open,
  imageSrc,
  onCancel,
}: LocationPickerProps) => {
  const [selected, setSelected] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const map = useMap();

  useEffect(() => {
    if (open) {
      map?.panTo(initialLocation);
    }
  }, [initialLocation, open]);

  useEffect(() => {
    if (open) {
      setSelected(null);
    }
  }, [open]);

  const handleClick = (e: MapMouseEvent) => {
    e.detail.latLng && setSelected(e.detail.latLng);
  };

  const handleSubmit = () => {
    if (selected) {
      onLocationPicked(selected);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Image Location</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <img
            src={imageSrc}
            alt="Selected"
            className="w-full h-auto rounded-lg object-contain border"
          />

          <div className="h-[300px] w-full rounded-lg overflow-hidden">
            <Map
              defaultCenter={initialLocation}
              defaultZoom={3}
              onClick={handleClick}
              style={{ width: "100%", height: "100%" }}
            >
              {selected && <Marker position={selected} />}
            </Map>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selected}
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
