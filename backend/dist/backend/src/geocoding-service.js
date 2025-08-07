"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodingService = void 0;
class GeocodingService {
    constructor() {
        this.baseUrl = 'https://nominatim.openstreetmap.org';
        this.requestDelay = 1000; // 1 second delay between requests (Nominatim usage policy)
        this.lastRequestTime = 0;
    }
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    reverseGeocode(latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Respect rate limiting
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequestTime;
                if (timeSinceLastRequest < this.requestDelay) {
                    yield this.delay(this.requestDelay - timeSinceLastRequest);
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
                const response = yield fetch(url, {
                    headers: {
                        'User-Agent': 'VacationGallery/1.0 (your-email@example.com)' // Required by Nominatim
                    }
                });
                if (!response.ok) {
                    throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
                }
                const data = yield response.json();
                if (!data || !data.address) {
                    console.log('No geocoding data found for coordinates');
                    return null;
                }
                // Extract location information
                const locationInfo = {
                    location_name: data.display_name,
                    city: this.extractCity(data.address),
                    state: data.address.state || data.address.region,
                    country: data.address.country,
                    country_code: (_a = data.address.country_code) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
                    landmark: this.extractLandmark(data)
                };
                return locationInfo;
            }
            catch (error) {
                console.error('Geocoding error:', error);
                return null;
            }
        });
    }
    extractCity(address) {
        // Try different city-related fields in order of preference
        return address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.suburb;
    }
    extractLandmark(data) {
        // Extract landmark information from various sources
        if (data.name && data.type &&
            ['attraction', 'tourism', 'historic', 'natural'].includes(data.class || '')) {
            return data.name;
        }
        // You can add more logic here to identify landmarks
        return undefined;
    }
    batchReverseGeocode(coordinates) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const coord of coordinates) {
                try {
                    const result = yield this.reverseGeocode(coord.latitude, coord.longitude);
                    results.push(result);
                }
                catch (error) {
                    console.error(`Failed to geocode ${coord.latitude}, ${coord.longitude}:`, error);
                    results.push(null);
                }
            }
            return results;
        });
    }
}
exports.geocodingService = new GeocodingService();
