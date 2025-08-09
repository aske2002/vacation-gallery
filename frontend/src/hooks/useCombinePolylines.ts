import { Route } from "@common/types/route";
import polyline from "@mapbox/polyline";
import { LatLngTuple } from "leaflet";
import { useMemo } from "react";

import { lineString } from "@turf/helpers";
import bezierSpline from "@turf/bezier-spline";
import { useQuery } from "@tanstack/react-query";

export function usePolylineFromRoute(route?: Route): LatLngTuple[] {
  return useQuery({
    queryKey: ["polylineFromRoute", route?.id],
    queryFn: () => {
      if (!route?.segments || route.segments.length === 0) return [];
      try {
        const orderedSegments = route.segments
          .map((se) => {
            const startStop = route.stops.find(
              (st) => st.id == se.start_stop_id
            );
            return {
              ...se,
              order_index: startStop?.order_index,
            };
          })
          .sort((a, b) => {
            return (a.order_index || 0) - (b.order_index || 0);
          });
        const mergedCoords: LatLngTuple[] = [];
        for (const segment of orderedSegments) {
          let segmentCoords: LatLngTuple[] = [];
          if (typeof segment.geometry === "string") {
            // Handle encoded polyline string
            try {
              segmentCoords = polyline.decode(segment.geometry);
            } catch (e) {
              console.warn("Failed to decode polyline segment:", e);
            }
          } else if (
            segment.geometry &&
            segment.geometry.type === "LineString" &&
            Array.isArray(segment.geometry.coordinates)
          ) {
            // Handle GeoJSON LineString
            segmentCoords = segment.geometry.coordinates.map(
              ([lng, lat]) => [lat, lng] as LatLngTuple
            );
          }

          // Merge while avoiding duplicate point between segments
          if (segmentCoords.length > 0) {
            if (mergedCoords.length === 0) {
              mergedCoords.push(...segmentCoords);
            } else {
              mergedCoords.push(...segmentCoords.slice(1)); // skip duplicate
            }
          }
        }
        const line = lineString(mergedCoords.map(([lat, lng]) => [lng, lat])); // GeoJSON is [lng,lat]
        const curved = bezierSpline(line, {
          resolution: 50000,
          sharpness: 0.5,
        });
        const coords = curved.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as LatLngTuple
        );
        return coords;
      } catch (error) {
        console.error("Failed to parse route segments into polyline:", error);
        return [];
      }
    },

    enabled: !!route?.segments,
    initialData: [],
  }).data;
}
