import { OpenStreetMap } from "@/components/openstreetmap";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import useFlightData from "@/hooks/useFlightData";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import L, { LatLngLiteral } from "leaflet";
import { Marker, Polyline, Tooltip } from "react-leaflet";
import { renderToString } from "react-dom/server";
import { Plane } from "lucide-react";
import { GeodesicLine } from "leaflet.geodesic";

export const Route = createFileRoute("/flight")({
  component: RouteComponent,
});

const formatAsHoursAndMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

function RouteComponent() {
  const { data: flightData } = useFlightData();

  const center = useMemo(() => {
    const c = flightData?.current_coordinates;
    if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
      return { lat: c.latitude, lng: c.longitude };
    }
    // fallback: SEA
    return { lat: 47.45, lng: -122.3 };
  }, [flightData?.current_coordinates]);

  const aircraftMarkerProps = useMemo(() => {
    const c = flightData?.current_coordinates;
    if (!c) return undefined;
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude))
      return undefined;

    return {
      location: [c.latitude, c.longitude] as [number, number],
      altitude: flightData?.altitude_feet ?? 0,
      heading: flightData?.true_heading_degree ?? 0,
      label: `${flightData?.flight_number ?? ""} (${flightData?.aircraft_type ?? ""})`,
    };
  }, [
    flightData?.current_coordinates,
    flightData?.altitude_feet,
    flightData?.true_heading_degree,
    flightData?.flight_number,
    flightData?.aircraft_type,
  ]);

  const positions = useMemo(() => {
    return new GeodesicLine([
      {
        lat: flightData?.departure_coordinates.latitude || 0,
        lng: flightData?.departure_coordinates.longitude || 0,
      },
      {
        lat: flightData?.current_coordinates.latitude || 0,
        lng: flightData?.current_coordinates.longitude || 0,
      },
      {
        lat: flightData?.destination_coordinates.latitude || 0,
        lng: flightData?.destination_coordinates.longitude || 0,
      },
    ]).getLatLngs()
  }, [flightData]);

  return (
    <div className="flex grow flex-col w-full">
      <div className="flex flex-row items-center justify-start mb-2 gap-2">
        <p className="text-nowrap text-muted-foreground">
          {flightData?.distance_covered_percentage}% Flown
        </p>
        <Progress value={flightData?.distance_covered_percentage || 0} />
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-3 grid-rows-3 gap-4">
            <p className="row-1 col-1">
              <span className="font-bold">Altitude</span>
              <br />
              {flightData?.altitude_feet} ft
            </p>
            <p className="row-2 col-1">
              <span className="font-bold">Heading</span>
              <br />
              {flightData?.true_heading_degree}°
            </p>
            <p className="row-3 col-1">
              <span className="font-bold">Speed</span>
              <br />
              {flightData?.ground_speed_knots} kts
            </p>
            <p className="row-1 col-2">
              <span className="font-bold">Destination</span>
              <br />
              {flightData?.destination_iata}
            </p>
            <p className="row-2 col-2">
              <span className="font-bold">Flight Number</span>
              <br />
              {flightData?.flight_number}
            </p>
            <p className="row-3 col-2">
              <span className="font-bold">Aircraft</span>
              <br />
              {flightData?.aircraft_type}
            </p>
            <p className="row-1 col-3">
              <span className="font-bold">Departure</span>
              <br />
              {flightData?.departure_iata}
            </p>
            <p className="row-2 col-3">
              <span className="font-bold">
                Time To {flightData?.destination_iata}
              </span>
              <br />
              {formatAsHoursAndMinutes(
                flightData?.time_to_destination_minutes || 0
              )}
            </p>
            <p className="row-3 col-3">
              <span className="font-bold">
                Distance To {flightData?.destination_iata}
              </span>
              <br />
              {flightData?.distance_to_destination_nautical_miles} nm
            </p>
          </div>
        </CardContent>
      </Card>

      <OpenStreetMap center={center} zoom={6} className="grow w-full h-10">
        {aircraftMarkerProps && (
          <AircraftMarker
            location={aircraftMarkerProps.location}
            altitude={aircraftMarkerProps.altitude}
            heading={aircraftMarkerProps.heading}
            label={aircraftMarkerProps.label}
          />
        )}
        <Polyline positions={positions.flat().flat()} color="gray" fillColor="gray"/>
      </OpenStreetMap>
    </div>
  );
}

interface AircraftMarkerProps {
  location: [number, number]; // [lat, lng]
  altitude: number;
  heading: number; // degrees, 0..359
  label?: string;
}

function AircraftMarker({
  location,
  altitude,
  heading,
  label,
}: AircraftMarkerProps) {
  const icon = useMemo(() => {
    const planeSvg = renderToString(
      <Plane
        size={32}
        strokeWidth={2}
        className="aircraft-icon-svg fill-blue-600"
        style={{ transform: `rotate(${-45 + heading}deg)` }}
      />
    );

    return L.divIcon({
      html: `
        <div class="aircraft-marker fill-blue-600 text-blue-600">
          ${planeSvg}
        </div>
      `,
      className: "aircraft-marker-container",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, [heading]);

  return (
    <Marker position={location} icon={icon} zIndexOffset={1000}>
      <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={false}>
        <div className="text-xs">
          <div>{label || "Aircraft"}</div>
          <div>Alt: {altitude.toLocaleString()} ft</div>
          <div>Hdg: {heading}°</div>
        </div>
      </Tooltip>
    </Marker>
  );
}
