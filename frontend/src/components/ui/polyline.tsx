import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useState, useEffect, useMemo } from "react";

type PolylineCustomProps = {
  path: google.maps.LatLng[] | google.maps.LatLngLiteral[];
};

const windowSize = 3; // Number of points to average for smoothing
const animationSpeed = 2; // Milliseconds between each point update

export type PolylineProps = google.maps.PolylineOptions & PolylineCustomProps;

export const Polyline = ({ path, ...rest }: PolylineProps) => {
  const map = useMap();
  const geometryLibrary = useMapsLibrary("geometry");
  const mapsLibrary = useMapsLibrary("maps");

  const smoothedPath = useMemo(() => {
    const smoothed: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(path.length, i + windowSize + 1);
      const window = path.slice(start, end).map((p) =>
        p instanceof google.maps.LatLng ? p.toJSON() : p
      );
      const avgLat = window.reduce((sum, p) => sum + p.lat, 0) / window.length;
      const avgLng = window.reduce((sum, p) => sum + p.lng, 0) / window.length;
      smoothed.push({ lat: avgLat, lng: avgLng });
    }
    return smoothed;
  }, [path]);

  const [mapPolyline, setMapPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!mapsLibrary) return;
    setMapPolyline(new mapsLibrary.Polyline());
  }, [mapsLibrary]);

  useEffect(() => {
    if (!mapPolyline) return;
    mapPolyline.setOptions({ geodesic: true, ...rest });
  }, [mapPolyline, rest]);

  useEffect(() => {
    if (!map || !mapPolyline || !smoothedPath) return;

    mapPolyline.setMap(map);

    // Animate the polyline drawing
    let index = 0;
    const animatedPath: google.maps.LatLngLiteral[] = [];
    mapPolyline.setPath(animatedPath);

    const interval = setInterval(() => {
      if (index >= smoothedPath.length) {
        clearInterval(interval);
        return;
      }

      animatedPath.push(smoothedPath[index]);
      mapPolyline.setPath([...animatedPath]);
      index++;
    }, animationSpeed);

    return () => {
      clearInterval(interval);
      mapPolyline.setMap(null);
    };
  }, [map, mapPolyline, smoothedPath]);

  return null;
};
