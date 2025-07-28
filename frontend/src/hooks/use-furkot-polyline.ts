import { useMemo } from "react";
import polyline from "@mapbox/polyline";

export default function useFurkotPolyline(encoded: string) {
  return useMemo((): google.maps.LatLngLiteral[] => {
    return encoded
      ? encoded[0] === "6"
        ? polyline
            .decode(encoded, 6)
            .map(([lng, lat]) => ({ lat, lng }))
            .slice(1, -1)
        : polyline.decode(encoded, 5).map(([lng, lat]) => ({ lat, lng }))
      : [];
  }, [encoded]);
}
