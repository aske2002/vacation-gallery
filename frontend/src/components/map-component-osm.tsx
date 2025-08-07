import useRoute from "@/hooks/use-route";
import { Feature, FeatureCollection, Point } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { ClusteredMarkersOSM } from "./osm/markers/image-marker-osm";
import ImagePopupContentOSM from "./osm/image-popup-content-osm";
import TripOSM from "./osm/trip-osm";
import { LocateFixed } from "lucide-react";
import { Button } from "./ui/button";
import { usePhotos } from "@/hooks/useVacationGalleryApi";
import { Photo } from "@common/types/photo";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { OpenStreetMap } from "./openstreetmap";

interface MapComponentOSMProps {
  onClickPhoto?: (photo: Photo) => void;
}

export default function MapComponentOSM({
  onClickPhoto,
}: MapComponentOSMProps) {
  const { data: photos } = usePhotos();
  const { stops, route } = useRoute();
  const [tilesLoaded, setTilesLoaded] = useState(false);

  const photosGeoJson = useMemo((): FeatureCollection<Point, Photo> => {
    return {
      features:
        photos
          ?.filter((photo) => {
            return !!photo.latitude && !!photo.longitude;
          })
          .map((p) => {
            return {
              properties: p,
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [p.longitude!, p.latitude!],
              },
            } satisfies Feature<Point, Photo>;
          }) || [],

      type: "FeatureCollection",
    };
  }, [photos]);

  const [infowindowData, setInfowindowData] = useState<{
    position: [number, number];
    features: Feature<Point, Photo>[];
  } | null>(null);

  // Component to handle map instance and fit bounds
  function MapController() {
    const map = useMap();

    const fitToContent = () => {
      if (!map) return;

      const coordinates = [
        ...(stops?.map((s) => [s.coordinates.lat, s.coordinates.lon]) || []),
        ...photosGeoJson.features.map((f) => [
          f.geometry.coordinates[1],
          f.geometry.coordinates[0],
        ]),
      ] as [number, number][];

      if (coordinates.length > 0) {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    useEffect(() => {
      if (tilesLoaded) {
        fitToContent();
      }
    }, [stops, photosGeoJson, tilesLoaded]);

    // Expose fitToContent to parent component
    useEffect(() => {
      (window as any).osmMapFitToContent = fitToContent;
    }, []);

    return null;
  }

  return (
    <div className="w-full h-full relative">
      <OpenStreetMap
        className="h-full w-full z-0"
        center={[51.505, -0.09]}
        zoom={13}
        zoomControl={false}
        whenReady={() => setTilesLoaded(true)}
      >
        {stops && <TripOSM steps={stops} route={route} />}

        <MapController />
        <ClusteredMarkersOSM
          geojson={photosGeoJson}
          setInfowindowData={setInfowindowData}
          setNumClusters={() => {}}
        />
        {infowindowData && (
          <ImagePopupContentOSM
            position={infowindowData.position}
            items={infowindowData.features}
            onClose={() => setInfowindowData(null)}
            onClickPhoto={onClickPhoto}
            isOpen={true}
          />
        )}
      </OpenStreetMap>
      <Button
        size={"icon"}
        variant={"secondary"}
        onClick={() => {
          // Trigger a re-fit by calling the exposed function
          if ((window as any).osmMapFitToContent) {
            (window as any).osmMapFitToContent();
          }
        }}
        className="absolute right-2 top-2"
      >
        <LocateFixed />
      </Button>
    </div>
  );
}
