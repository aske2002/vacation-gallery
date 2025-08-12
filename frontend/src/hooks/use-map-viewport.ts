import { useEffect, useState } from "react";
import { BBox } from "geojson";
import { useMap } from "react-leaflet";

type MapViewportOptions = {
  padding?: number;
};

export function useMapViewport({ padding = 0 }: MapViewportOptions = {}) {
  const map = useMap();
  const [bbox, setBbox] = useState<BBox>([-180, -90, 180, 90]);
  const [zoom, setZoom] = useState(0);

  // observe the map to get current bounds
  useEffect(() => {
    if (!map) return;

    const boundsChanged = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      if (!bounds || !zoom) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const paddingDegrees = degreesPerPixel(zoom) * padding;

      const n = Math.min(90, ne.lat + paddingDegrees);
      const s = Math.max(-90, sw.lng - paddingDegrees);

      const w = sw.lng - paddingDegrees;
      const e = ne.lng + paddingDegrees;

      setBbox([w, s, e, n]);
      setZoom(zoom);
    }

    map.addEventListener("move", boundsChanged);

    return () => {
      map.removeEventListener("move", boundsChanged);
    };
  }, [map, padding]);

  return { bbox, zoom };
}

function degreesPerPixel(zoomLevel: number) {
  // 360° divided by the number of pixels at the zoom-level
  return 360 / (Math.pow(2, zoomLevel) * 256);
}
