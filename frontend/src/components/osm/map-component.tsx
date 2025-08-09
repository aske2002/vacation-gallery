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
import { Route } from "@common/types/route";
import { Photo } from "@/lib/photo-sorting";
import StopSheet from "./stop-sheet";

interface MapComponentProps {
  onClickPhoto?: (photo: Photo) => void;
  tripId: string;
  animate?: boolean;
}

export default function MapComponent({
  onClickPhoto,
  tripId,
  animate = true,
}: MapComponentProps) {
  const [showStops, setShowStops] = useState(false);
  const { data: photos } = useTripPhotos(tripId);
  const { data: routes } = useTripRoutes(tripId);
  const route = useMemo(() => {
    return routes?.at(0);
  }, [routes]);
  const mapref = useRef<Map>(null);

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
    if (!mapref.current) return;
    const validStops =
      route?.stops.filter(
        (stop) => stop.latitude !== 0 && stop.longitude !== 0
      ) || [];

    if (validStops.length > 1) {
      const bounds = L.latLngBounds(
        validStops.map((stop) => [stop.latitude, stop.longitude])
      );
      mapref.current.fitBounds(bounds, { padding: [15, 15] });
    } else if (validStops.length === 1) {
      mapref.current.setView(
        [validStops[0].latitude, validStops[0].longitude],
        15
      );
    }
  };

  // Initialize map center and zoom based on existing stops
  useEffect(() => {
    route && fitToRoute(route);
  }, [route, mapref.current]);

  return (
    <div className="w-full h-full relative">
      <StopSheet
        stops={route?.stops || []}
        photos={photos}
        open={showStops}
        onClickStop={(s) => {
          console.log("Clicked stop", s);
          mapref.current?.flyTo(
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
      <OpenStreetMap
        className="h-full w-full z-0"
        zoomControl={false}
        ref={(r) => {
          mapref.current = r;
        }}
      >
        {route && photos && <MapTrip photos={photos} route={route} />}

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
      </OpenStreetMap>
      <div className="absolute right-2 top-2 flex-col flex gap-2">
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
    </div>
  );
}
