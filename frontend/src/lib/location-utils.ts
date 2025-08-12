import { PhotoType } from "vacation-gallery-common";
import L from "leaflet";
import { LatLng, LatLngExpression } from "leaflet";
import { point, lineString } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import length from "@turf/length";
import lineSlice from "@turf/line-slice";
import { Position } from "geojson";
import { PhotoCollection } from "./photo-sorting";

/**
 * Cleans up a full location name string to be more readable
 */
export function cleanLocationName(
  locationName: string,
  maxParts: number = 2
): string {
  // Split by comma and take the most relevant parts
  const addressParts = locationName.split(",").map((part) => part.trim());

  // Filter out less useful parts
  const relevantParts = addressParts.filter((part) => {
    // Filter out things like postal codes, long administrative names, etc.
    return (
      !/^\d+$/.test(part) && // Not just numbers
      !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(part) && // Not Canadian postal codes
      !/^\d{5}(-\d{4})?$/.test(part) && // Not US ZIP codes
      !/^Area [A-Z]/.test(part) && // Administrative areas
      !part.includes("Regional District") && // Administrative regions
      part.length < 50 && // Not too long
      part.length > 1
    ); // Not too short
  });

  // Take the first few relevant parts
  const selectedParts = relevantParts.slice(0, maxParts);

  return selectedParts.length > 0
    ? selectedParts.join(", ")
    : addressParts.slice(0, 2).join(", ") ||
        addressParts[0] ||
        "Unknown location";
}

/**
 * Gets the full location with all available details
 */
export function getFullLocation(photo: PhotoType): string {
  const parts: string[] = [];

  if (photo.landmark) parts.push(photo.landmark);
  if (photo.city) parts.push(photo.city);
  if (photo.state) parts.push(photo.state);
  if (photo.country) parts.push(photo.country);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return photo.location_name || "Location not available";
}

/**
 * Creates a hierarchical location object for more complex displays
 */
export function getLocationHierarchy(photo: PhotoType) {
  return {
    landmark: photo.landmark || null,
    city: photo.city || null,
    state: photo.state || null,
    country: photo.country || null,
    countryCode: photo.country_code || null,
    coordinates:
      photo.latitude && photo.longitude
        ? { lat: photo.latitude, lng: photo.longitude }
        : null,
    fullAddress: photo.location_name || null,
  };
}

export function getRouteInformation(
  routeLatLng: LatLngExpression[],
  collection: PhotoCollection,
  thresholdKm = 50
) {
  // Convert to GeoJSON coordinate order [lng, lat]
  const positionRoute = routeLatLng.map((latlng): Position => {
    const latLng = L.latLng(latlng);
    return [latLng.lng, latLng.lat];
  });
  const line = lineString(positionRoute);
  const totalKm = length(line, { units: "kilometers" });

  const candidates = collection
    .sortByKey("time")
    .all.filter((p) => p.coordinates)
    .map((p) => {
      const pt = point([p.coordinates!.longitude, p.coordinates!.latitude]);
      const snapped = nearestPointOnLine(line, pt, { units: "kilometers" });

      const distKm = snapped.properties?.dist ?? Infinity; // perpendicular distance to route

      return {
        photo: p,
        snapped,
        distKm,
      };
    })
    .filter(Boolean)
    .filter((x: any) => x.distKm <= thresholdKm);

  if (candidates.length === 0) {
    // No photo is within the threshold
    return {
      photoId: null,
      reason: `No geotagged photo within ${thresholdKm} km of the route.`,
      progressKm: 0,
      totalKm,
      percentage: 0,
    };
  }

  const last = candidates[candidates.length - 1];
  const photoPt = last.photo.position!;

  // Snap the photo to the route
  const snapped = nearestPointOnLine(line, photoPt, {
    units: "kilometers",
  });
  const snappedLngLat = snapped.geometry.coordinates;
  const snappedLatLng = [snappedLngLat[1], snappedLngLat[0]];

  // Distance along the route up to the snapped point
  const startPt = point(positionRoute[0]);
  const sliced = lineSlice(startPt, snapped, line);
  const progressKm = length(sliced, { units: "kilometers" });

  const percentage = totalKm > 0 ? progressKm / totalKm : 0;
  // Extra metadata Turf gives you
  const segmentIndex = (snapped.properties?.index as number) ?? null; // the segment it snapped to
  const distanceOffRouteKm = (snapped.properties?.dist as number) ?? null; // perpendicular distance to line

  return {
    latLng: L.latLng(snappedLatLng[1], snappedLatLng[0]),
    progressKm,
    percentage,
    segmentIndex,
    distanceOffRouteKm,
  };
}
