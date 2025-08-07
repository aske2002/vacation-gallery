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
exports.openRouteService = void 0;
class OpenRouteService {
    constructor() {
        this.baseUrl = "https://api.openrouteservice.org";
        this.requestDelay = 100; // Small delay to avoid rate limiting
        this.lastRequestTime = 0;
    }
    get apiKey() {
        return process.env.OPENROUTE_API_KEY || "";
    }
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(resolve, ms));
        });
    }
    makeRequest(endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey) {
                throw new Error("OpenRouteService API key not configured");
            }
            // Respect rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.requestDelay) {
                yield this.delay(this.requestDelay - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();
            const url = `${this.baseUrl}${endpoint}`;
            const response = yield fetch(url, {
                method: "POST",
                headers: {
                    Authorization: this.apiKey,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`OpenRouteService request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            return yield response.json();
        });
    }
    coordinateToArray(coord) {
        return [coord.longitude, coord.latitude];
    }
    /**
     * Get directions between multiple points
     */
    getDirections(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                coordinates: request.coordinates.map((coord) => this.coordinateToArray(coord)),
                format: request.format || "json",
                units: request.units || "km",
                language: request.language || "en",
                geometry: request.geometry !== false,
                instructions: request.instructions !== false,
                elevation: request.elevation || false,
                extra_info: request.extra_info || [],
                optimized: request.optimized || false,
            };
            const profile = request.profile || "driving-car";
            return yield this.makeRequest(`/v2/directions/${profile}`, body);
        });
    }
    /**
     * Get simple directions between two points
     */
    getSimpleDirections(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const routeRequest = {
                coordinates: [request.start, request.end],
                profile: request.profile || "driving-car",
                geometry: true,
                instructions: true,
            };
            return yield this.getDirections(routeRequest);
        });
    }
    /**
     * Get isochrones (travel time/distance areas)
     */
    getIsochrones(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                locations: request.locations.map((coord) => this.coordinateToArray(coord)),
                range: request.range,
                range_type: request.range_type || "time",
                units: request.units || "km",
                location_type: request.location_type || "start",
                smoothing: request.smoothing || 25,
                area_units: request.area_units || "km",
                attributes: request.attributes || ["area", "reachfactor", "total_pop"],
            };
            const profile = request.profile || "driving-car";
            return yield this.makeRequest(`/v2/isochrones/${profile}`, body);
        });
    }
    /**
     * Get distance/time matrix between multiple points
     */
    getMatrix(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                locations: request.locations.map((coord) => this.coordinateToArray(coord)),
                sources: request.sources,
                destinations: request.destinations,
                metrics: request.metrics || ["distance", "duration"],
                resolve_locations: request.resolve_locations || false,
                units: request.units || "km",
            };
            const profile = request.profile || "driving-car";
            return yield this.makeRequest(`/v2/matrix/${profile}`, body);
        });
    }
    /**
     * Optimize route order for multiple waypoints
     */
    optimizeRoute(coordinates_1) {
        return __awaiter(this, arguments, void 0, function* (coordinates, profile = "driving-car") {
            const routeRequest = {
                coordinates,
                profile,
                optimized: true,
                geometry: true,
                instructions: true,
            };
            return yield this.getDirections(routeRequest);
        });
    }
    /**
     * Get travel time between two points
     */
    getTravelTime(start_1, end_1) {
        return __awaiter(this, arguments, void 0, function* (start, end, profile = "driving-car") {
            const response = yield this.getSimpleDirections({ start, end, profile });
            if (!response.routes || response.routes.length === 0) {
                throw new Error("No route found");
            }
            const route = response.routes[0];
            return {
                distance: route.summary.distance,
                duration: route.summary.duration,
            };
        });
    }
    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!this.apiKey;
    }
}
exports.openRouteService = new OpenRouteService();
