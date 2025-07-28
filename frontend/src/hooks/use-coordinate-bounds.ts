export interface BoundsAndCenter {
  bounds: google.maps.LatLngBoundsLiteral;
  center: google.maps.LatLngLiteral;
}

/**
 * Wraps longitude to the [-180, 180) range.
 */
function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/**
 * Clamps latitude to [-90, 90].
 */
function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Computes bounds and center from an array of google.maps.LatLngLiteral points.
 */
export function computeBoundsAndCenter(
  points: google.maps.LatLngLiteral[]
): BoundsAndCenter {
  if (!points.length) {
    throw new Error("Empty array of google.maps.LatLngLiteral");
  }

  let north = -Infinity;
  let south = Infinity;
  let west = Infinity;
  let east = -Infinity;

  const longitudes: number[] = [];

  for (const { lat, lng } of points) {
    const clampedLat = clampLatitude(lat);
    const wrappedLng = wrapLongitude(lng);

    longitudes.push(wrappedLng);
    north = Math.max(north, clampedLat);
    south = Math.min(south, clampedLat);
    east = Math.max(east, wrappedLng);
    west = Math.min(west, wrappedLng);
  }

  const spansAntimeridian = east - west > 180;
  let centerLng: number;

  if (spansAntimeridian) {
    // Shift longitudes into [0, 360) to calculate average properly
    const adjustedLongitudes = longitudes.map((lng) =>
      lng < 0 ? lng + 360 : lng
    );
    const avg =
      adjustedLongitudes.reduce((sum, val) => sum + val, 0) /
      adjustedLongitudes.length;
    centerLng = wrapLongitude(avg);
  } else {
    centerLng = wrapLongitude((east + west) / 2);
  }

  const centerLat = (north + south) / 2;

  return {
    bounds: {
      north: clampLatitude(north),
      south: clampLatitude(south),
      east: wrapLongitude(east),
      west: wrapLongitude(west),
    },
    center: {
      lat: clampLatitude(centerLat),
      lng: centerLng,
    },
  };
}
