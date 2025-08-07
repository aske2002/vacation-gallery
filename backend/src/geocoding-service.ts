export interface LocationInfo {
  location_name?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  landmark?: string;
}

export interface GeocodingResult {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
  name?: string;
  type?: string;
  class?: string;
}

class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly requestDelay = 1000; // 1 second delay between requests (Nominatim usage policy)
  private lastRequestTime = 0;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationInfo | null> {
    try {
      // Respect rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.requestDelay) {
        await this.delay(this.requestDelay - timeSinceLastRequest);
      }
      this.lastRequestTime = Date.now();

      const url = `${this.baseUrl}/reverse?` + new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1'
      });
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VacationGallery/1.0 (your-email@example.com)' // Required by Nominatim
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
      }

      const data: GeocodingResult = await response.json();
      
      if (!data || !data.address) {
        console.log('No geocoding data found for coordinates');
        return null;
      }

      // Extract location information
      const locationInfo: LocationInfo = {
        location_name: data.display_name,
        city: this.extractCity(data.address),
        state: data.address.state || data.address.region,
        country: data.address.country,
        country_code: data.address.country_code?.toUpperCase(),
        landmark: this.extractLandmark(data)
      };

      return locationInfo;

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private extractCity(address: any): string | undefined {
    // Try different city-related fields in order of preference
    return address.city || 
           address.town || 
           address.village || 
           address.municipality ||
           address.suburb;
  }

  private extractLandmark(data: GeocodingResult): string | undefined {
    // Extract landmark information from various sources
    if (data.name && data.type && 
        ['attraction', 'tourism', 'historic', 'natural'].includes(data.class || '')) {
      return data.name;
    }
    
    // You can add more logic here to identify landmarks
    return undefined;
  }

  async batchReverseGeocode(coordinates: Array<{latitude: number, longitude: number}>): Promise<Array<LocationInfo | null>> {
    const results: Array<LocationInfo | null> = [];
    
    for (const coord of coordinates) {
      try {
        const result = await this.reverseGeocode(coord.latitude, coord.longitude);
        results.push(result);
      } catch (error) {
        console.error(`Failed to geocode ${coord.latitude}, ${coord.longitude}:`, error);
        results.push(null);
      }
    }
    
    return results;
  }
}

export const geocodingService = new GeocodingService();
