import { Position } from "geojson";

export type AnyCoordinate =
  | google.maps.LatLngLiteral
  | { lat: number; lon: number }
  | Position;

export default function normalizeCoordinates(
  ...coordinates: AnyCoordinate[]
): google.maps.LatLngLiteral[] {
  return coordinates.map((c) => {
    if ("lon" in c) {
      return {
        lat: c.lat,
        lng: c.lon,
      };
    } else if (Array.isArray(c)) {
      const [lng, lat] = c;
      return {
        lat,
        lng,
      };
    } else {
      return c;
    }
  });
}
