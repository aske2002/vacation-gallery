import { TripStep } from "@/types/trip";
import { Polyline } from "react-leaflet";
import React from "react";
import TripStepMarkerOSM from "./markers/trip-step-marker-osm";

interface TripOSMProps {
  steps: TripStep[];
  route: google.maps.LatLngLiteral[];
}

const TripOSM = ({ steps, route }: TripOSMProps) => {
  // Convert Google Maps LatLngLiteral to Leaflet LatLng format
  const routePositions: [number, number][] = route.map((point) => [
    point.lat,
    point.lng,
  ]);

  return (
    <>
      <Polyline
        positions={routePositions}
        color="#2b7fff"
        opacity={1}
        weight={5}
      />
      {steps.map((s, index) => (
        <TripStepMarkerOSM index={index} step={s} key={index} />
      ))}
    </>
  );
};

export default React.memo(TripOSM);
