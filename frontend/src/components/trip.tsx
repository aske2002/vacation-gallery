import { TripStep } from "@/types/trip";
import { Polyline } from "./ui/polyline";
import React from "react";
import TripStepMarker from "./markers/trip-step-marker";

interface TripProps {
  steps: TripStep[];
  route: google.maps.LatLngLiteral[];
}

const Trip = ({ steps, route }: TripProps) => {
  return (
    <>
      <Polyline
        path={route}
        strokeColor={"#2b7fff"}
        strokeOpacity={1}
        strokeWeight={5}
        geodesic={true}
      />{" "}
      {steps.map((s, index) => (
        <TripStepMarker index={index} step={s} key={index} />
      ))}
    </>
  );
};

export default React.memo(Trip);
