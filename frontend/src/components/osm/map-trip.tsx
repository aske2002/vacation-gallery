import React, { useMemo } from "react";
import TripStepMarkerOSM from "./markers/trip-step-marker";
import { Route } from "vacation-gallery-common";
import { usePolylineFromRoute } from "@/hooks/useCombinePolylines";
import AnimatedPolylineWithMarker from "./animated-polyline-marker";
import { getRouteInformation } from "@/lib/location-utils";
import { PhotoCollection } from "@/lib/photo-sorting";
import { MapZIndexes } from "@/lib/map-indexes";
import { useQuery } from "@tanstack/react-query";

interface MapTripProps {
  route: Route;
  photos: PhotoCollection;
}

let hasShownAnimation = false;

const MapTrip = ({ route, photos }: MapTripProps) => {
  const polyLineCoords = usePolylineFromRoute(route);

  const { data: routeInformation } = useQuery({
    queryKey: ["routeInformation", photos.hash],
    queryFn: () => {
      const latestPhoto = photos
        .sortByKey("time")
        .filter((p) => !!p.latLng)
        .at(-1);
      if (latestPhoto?.latLng) {
        return getRouteInformation(polyLineCoords, photos);
      } else {
        return null;
      }
    },
  });

  console.log("Route Information:", routeInformation);

  return (
    <>
      {route.stops.map((s, index) => (
        <TripStepMarkerOSM index={index} stop={s} key={index} />
      ))}
      <AnimatedPolylineWithMarker
        positions={polyLineCoords}
        color="#2b7fff"
        progress={routeInformation?.percentage || 0}
        totalDuration={hasShownAnimation ? 0 : 10000}
        weight={5}
        onFinish={() => (hasShownAnimation = true)}
        markerZIndex={MapZIndexes.tripMarker}
      >
        <p className="text-3xl">🚗</p>
      </AnimatedPolylineWithMarker>
    </>
  );
};

export default React.memo(MapTrip);

const CarIcon: React.FC = () => (
  <div
    style={{
      width: 30,
      height: 30,
      backgroundColor: "red",
      borderRadius: "50%",
      border: "2px solid white",
    }}
  />
);
