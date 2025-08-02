import useRoute from "@/hooks/use-route";
import { Feature, FeatureCollection, Point } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { ClusteredMarkers } from "./markers/image-marker";
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import ImagePopupContent from "./image-popup-content";
import Trip from "./trip";
import { LocateFixed } from "lucide-react";
import { Button } from "./ui/button";
import normalizeCoordinates from "@/lib/normalize-coordinates";
import { usePhotos } from "@/hooks/useVacationGalleryApi";
import { Photo } from "@common/types/photo";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface MapComponentOSMProps {
  onClickPhoto?: (photo: Photo) => void;
}

export default function MapComponentOSM({
  onClickPhoto,
}: MapComponentOSMProps) {
  const { data: photos } = usePhotos();
  const { stops, route } = useRoute();
  const map = useMap();
  const mapsLibrary = useMapsLibrary("core");
  const [tilesLoaded, setTilesLoaded] = useState(false);

  const photosGeoJson = useMemo((): FeatureCollection<Point, Photo> => {
    return {
      features:
        photos
          ?.filter((photo) => {
            return (
              photo.latitude !== undefined && photo.longitude !== undefined
            );
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
    anchor: google.maps.marker.AdvancedMarkerElement;
    features: Feature<Point, Photo>[];
  } | null>(null);

  const bounds = useMemo(() => {
    return mapsLibrary ? new mapsLibrary.LatLngBounds() : undefined;
  }, [mapsLibrary]);

  const fitToContent = () => {
    if (!bounds) return;

    normalizeCoordinates(
      ...[
        ...(stops?.map((s) => s.coordinates) || []),
        ...photosGeoJson.features.map((f) => f.geometry.coordinates),
      ]
    ).forEach((c) => bounds.extend(c));

    map?.fitBounds(bounds);
  };

  useEffect(fitToContent, [stops, photosGeoJson, bounds, tilesLoaded]);

  return (
    <div className="w-full h-full relative">
      {/* <Map
        gestureHandling={"greedy"}
        disableDefaultUI
        defaultZoom={3}
        onTilesLoaded={() => setTilesLoaded(true)}
        defaultCenter={bounds?.getCenter().toJSON() || { lat: 0, lng: 0 }}
        mapId={"6eb07290b335e56bf609226c"}
        className="w-full h-full"
      >
        <ClusteredMarkers
          geojson={photosGeoJson}
          setInfowindowData={setInfowindowData}
          setNumClusters={() => {}}
        />
        {infowindowData && (
          <ImagePopupContent
            anchor={infowindowData.anchor}
            items={infowindowData.features}
            onClose={() => setInfowindowData(null)}
            onClickPhoto={onClickPhoto}
          />
        )}
        {stops && <Trip steps={stops} route={route} />}
      </Map> */}
      <MapContainer className="h-full w-full" center={[51.505, -0.09]} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
      <Button
        size={"icon"}
        variant={"secondary"}
        onClick={fitToContent}
        className="absolute right-2 top-2"
      >
        <LocateFixed />
      </Button>
    </div>
  );
}
