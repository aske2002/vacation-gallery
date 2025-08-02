import { Photo } from "@common/types/photo";

export interface LocationFormatOptions {
  maxParts?: number;
  includeCountry?: boolean | 'auto';
  prioritizeLandmark?: boolean;
  showCoordinates?: boolean;
}

/**
 * Formats photo location data into a readable, concise address string
 */
export function formatPhotoLocation(
  photo: Photo, 
  options: LocationFormatOptions = {}
): string {
  const {
    maxParts = 3,
    includeCountry = 'auto',
    prioritizeLandmark = true,
    showCoordinates = false
  } = options;

  const parts: string[] = [];
  
  // Priority 1: Landmark (most specific and interesting)
  if (prioritizeLandmark && photo.landmark) {
    parts.push(photo.landmark);
  }
  
  // Priority 2: City (most commonly useful)
  if (photo.city) {
    parts.push(photo.city);
  }
  
  // Priority 3: State/Province (for context)
  if (photo.state && photo.state !== photo.city) {
    parts.push(photo.state);
  }
  
  // Priority 4: Country (conditional)
  if (photo.country) {
    const shouldShowCountry = 
      includeCountry === true ||
      (includeCountry === 'auto' && (
        parts.length === 0 || // No other location info
        (photo.country_code && !['US', 'CA', 'GB'].includes(photo.country_code)) || // International
        parts.length === 1 // Only have one piece of info, add country for context
      ));
      
    if (shouldShowCountry) {
      parts.push(photo.country);
    }
  }
  
  // If we have structured data, format it nicely
  if (parts.length > 0) {
    return parts.slice(0, maxParts).join(', ');
  }
  
  // Fallback to location_name but make it shorter and cleaner
  if (photo.location_name) {
    return cleanLocationName(photo.location_name, maxParts);
  }
  
  // Show coordinates if requested and available
  if (showCoordinates && photo.latitude && photo.longitude) {
    return `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`;
  }
  
  return "Location not available";
}

/**
 * Cleans up a full location name string to be more readable
 */
function cleanLocationName(locationName: string, maxParts: number = 2): string {
  // Split by comma and take the most relevant parts
  const addressParts = locationName.split(',').map(part => part.trim());
  
  // Filter out less useful parts
  const relevantParts = addressParts.filter(part => {
    // Filter out things like postal codes, long administrative names, etc.
    return !/^\d+$/.test(part) && // Not just numbers
           !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(part) && // Not Canadian postal codes
           !/^\d{5}(-\d{4})?$/.test(part) && // Not US ZIP codes
           !/^Area [A-Z]/.test(part) && // Administrative areas
           !part.includes('Regional District') && // Administrative regions
           part.length < 50 && // Not too long
           part.length > 1; // Not too short
  });
  
  // Take the first few relevant parts
  const selectedParts = relevantParts.slice(0, maxParts);
  
  return selectedParts.length > 0 
    ? selectedParts.join(', ')
    : addressParts.slice(0, 2).join(', ') || addressParts[0] || 'Unknown location';
}

/**
 * Gets a short location string suitable for compact displays
 */
export function getShortLocation(photo: Photo): string {
  return formatPhotoLocation(photo, {
    maxParts: 2,
    includeCountry: false,
    prioritizeLandmark: true
  });
}

/**
 * Gets a medium length location string with more context
 */
export function getMediumLocation(photo: Photo): string {
  return formatPhotoLocation(photo, {
    maxParts: 3,
    includeCountry: 'auto',
    prioritizeLandmark: true
  });
}

/**
 * Gets the full location with all available details
 */
export function getFullLocation(photo: Photo): string {
  const parts: string[] = [];
  
  if (photo.landmark) parts.push(photo.landmark);
  if (photo.city) parts.push(photo.city);
  if (photo.state) parts.push(photo.state);
  if (photo.country) parts.push(photo.country);
  
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  return photo.location_name || 'Location not available';
}

/**
 * Creates a hierarchical location object for more complex displays
 */
export function getLocationHierarchy(photo: Photo) {
  return {
    landmark: photo.landmark || null,
    city: photo.city || null,
    state: photo.state || null,
    country: photo.country || null,
    countryCode: photo.country_code || null,
    coordinates: photo.latitude && photo.longitude 
      ? { lat: photo.latitude, lng: photo.longitude }
      : null,
    fullAddress: photo.location_name || null
  };
}
