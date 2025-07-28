import { TripStep } from "@/types/trip";
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface TripStepMarkerProps {
  step: TripStep;
  index: number;
  handleClick?: (step: TripStep) => void;
}

export default function TripStepMarker({
  step,
  handleClick,
  index
}: TripStepMarkerProps) {
  return (
    <AdvancedMarker
      position={{
        lat: step.coordinates.lat,
        lng: step.coordinates.lon,
      }}
      onClick={() => handleClick?.(step)}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      className={" hover:scale-105 transition-all group"}
    >
      <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-lg">
        <div className="w-3/4 h-3/4 m-auto flex items-center justify-center bg-blue-500 rounded-full">
          <div className="bg-white w-2/3 h-2/3 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-all">
          </div>
        </div>
      </div>
    </AdvancedMarker>
  );
}
