import { Feature, FeatureCollection, Point } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClusteredMarkersOSM } from "./markers/image-marker";
import ImagePopupContent from "./image-popup-content";
import MapTrip from "./map-trip";
import { List, LocateFixed } from "lucide-react";
import { Button } from "../ui/button";
import { useTripPhotos, useTripRoutes } from "@/hooks/useVacationGalleryApi";
import L, { LatLngExpression, Map } from "leaflet";
import { OpenStreetMap } from "../openstreetmap";
import { Route } from "vacation-gallery-common";
import { Photo } from "@/lib/photo-sorting";
import StopSheet from "./stop-sheet";
import { useMap } from "react-leaflet";

interface MapComponentProps {
  onClickPhoto?: (photo: Photo) => void;
  tripId: string;
}

function MapComponentInner({ onClickPhoto, tripId }: MapComponentProps) {
  const [showStops, setShowStops] = useState(false);
  const { data: photos } = useTripPhotos(tripId);
  const { data: routes } = useTripRoutes(tripId);
  const route = useMemo(() => {
    return routes?.at(0);
  }, [routes]);
  const map = useMap();

  const photosGeoJson = useMemo((): FeatureCollection<Point, Photo> => {
    return {
      features:
        photos?.all
          ?.filter((photo) => {
            return photo.position;
          })
          .map((p) => {
            return {
              properties: p,
              id: p.id,
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: p.position!,
              },
            } satisfies Feature<Point, Photo>;
          }) || [],

      type: "FeatureCollection",
    };
  }, [photos]);

  const [infowindowData, setInfowindowData] = useState<{
    position: LatLngExpression;
    features: Feature<Point, Photo>[];
  } | null>(null);

  const fitToRoute = (route: Route) => {
    if (!map) return;
    const validStops =
      route?.stops.filter(
        (stop) => stop.latitude !== 0 && stop.longitude !== 0
      ) || [];

    if (validStops.length > 1) {
      const bounds = L.latLngBounds(
        validStops.map((stop) => [stop.latitude, stop.longitude])
      );
      map.fitBounds(bounds, { padding: [15, 15] });
    } else if (validStops.length === 1) {
      map.setView([validStops[0].latitude, validStops[0].longitude], 15);
    }
  };

  // Initialize map center and zoom based on existing stops
  useEffect(() => {
    route && fitToRoute(route);
  }, [route, map]);

  return (
    <div className="w-full h-full relative">
      <StopSheet
        stops={route?.stops || []}
        photos={photos}
        open={showStops}
        onClickStop={(s) => {
          map?.flyTo(
            {
              lat: s.latitude,
              lng: s.longitude,
            },
            8
          );

          setShowStops(false);
        }}
        onClose={() => setShowStops(false)}
      />
      {route && photos && <MapTrip photos={photos} route={route} />}
      <div className="absolute right-2 top-2 flex-col flex gap-2 z-999">
        <Button
          size={"icon"}
          variant={"secondary"}
          onClick={() => {
            route && fitToRoute(route);
          }}
        >
          <LocateFixed />
        </Button>
        {route && (
          <Button
            size={"icon"}
            variant={"secondary"}
            onClick={() => setShowStops(true)}
          >
            <List />
          </Button>
        )}
      </div>
      <ClusteredMarkersOSM
        geojson={photosGeoJson}
        setInfowindowData={setInfowindowData}
        setNumClusters={() => {}}
      />
      {infowindowData && (
        <ImagePopupContent
          position={infowindowData.position}
          items={infowindowData.features}
          onClose={() => setInfowindowData(null)}
          onClickPhoto={onClickPhoto}
          isOpen={true}
        />
      )}
    </div>
  );
}

export default function MapComponent(props: MapComponentProps) {
  return (
    <OpenStreetMap className="h-full w-full z-0" zoomControl={false}>
      <MapComponentInner {...props} />
    </OpenStreetMap>
  );
}
