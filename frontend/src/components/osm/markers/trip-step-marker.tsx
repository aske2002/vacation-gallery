import { TripStep } from "@/types/trip";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useMemo, useCallback } from "react";
import { RouteStop } from "vacation-gallery-common";
import { MapZIndexes } from "@/lib/map-indexes";

interface TripStepMarkerProps {
  stop: RouteStop;
  index: number;
  handleClick?: (step: RouteStop) => void;
}

export default function TripStepMarkerOSM({
  stop,
  handleClick,
  index,
}: TripStepMarkerProps) {
  const position: [number, number] = useMemo(
    () => [stop.latitude, stop.longitude],
    [stop]
  );

  const onClick = useCallback(() => {
    handleClick?.(stop);
  }, [handleClick, stop]);

  const stepIcon = useMemo(() => {
    return L.divIcon({
      html: `<div class="trip-step-marker">
        <div class="trip-step-outer">
          <div class="trip-step-inner">
            <div class="trip-step-center"></div>
          </div>
        </div>
      </div>`,
      className: "trip-step-marker-container",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }, []);

  return (
    <Marker
      position={position}
      icon={stepIcon}
      zIndexOffset={MapZIndexes.stop}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={false}>
        <h1 className="text-md font-bold">{stop.title}</h1>
        <p>{stop.description}</p>
      </Tooltip>
    </Marker>
  );
}

// Add styles for the trip step markers
const tripStepMarkerStyles = `
  .trip-step-marker-container {
    background: transparent !important;
    border: none !important;
    z-index: ${MapZIndexes.stop};
  }

  .trip-step-marker {
    width: 24px;
    height: 24px;
    position: relative;
    cursor: pointer;
    transition: transform 0.2s ease-in-out;
  }

  .trip-step-marker:hover {
    transform: scale(1.05);
  }

  .trip-step-outer {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .trip-step-inner {
    width: 75%;
    height: 75%;
    background-color: #3b82f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .trip-step-center {
    width: 66.67%;
    height: 66.67%;
    background-color: white;
    border-radius: 50%;
    transition: background-color 0.2s ease-in-out;
  }

  .trip-step-marker:hover .trip-step-center {
    background-color: #3b82f6;
  }
`;

// Inject styles only once
if (
  typeof document !== "undefined" &&
  !document.getElementById("osm-trip-step-marker-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "osm-trip-step-marker-styles";
  styleElement.textContent = tripStepMarkerStyles;
  document.head.appendChild(styleElement);
}
