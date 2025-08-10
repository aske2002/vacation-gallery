export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteRequest {
  coordinates: Coordinate[];
  profile?:
    | "driving-car"
    | "driving-hgv"
    | "cycling-regular"
    | "cycling-road"
    | "cycling-mountain"
    | "cycling-electric"
    | "foot-walking"
    | "foot-hiking"
    | "wheelchair";
  format?: "json" | "geojson";
  units?: "km" | "m";
  language?: string;
  geometry?: boolean;
  instructions?: boolean;
  elevation?: boolean;
  extra_info?: string[];
  optimized?: boolean;
  radiuses?: number[];
}

export interface RouteResponse {
  routes: Route[];
  bbox?: number[];
  metadata?: any;
}

export interface Route {
  summary: {
    distance: number; // in meters
    duration: number; // in seconds
  };
  geometry?: string | { type: "LineString"; coordinates: [number, number][] };
  segments?: RouteSegment[];
  bbox?: number[];
  way_points?: number[];
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps?: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name?: string;
  way_points?: number[];
}

export interface DirectionsRequest {
  start: Coordinate;
  end: Coordinate;
  profile?: RouteRequest["profile"];
  alternatives?: boolean;
  avoid_features?: string[];
  avoid_borders?: "all" | "controlled" | "none";
  avoid_countries?: string[];
}

export interface IsochroneRequest {
  locations: Coordinate[];
  range: number[]; // time in seconds or distance in meters
  range_type?: "time" | "distance";
  profile?: RouteRequest["profile"];
  units?: "km" | "m";
  location_type?: "start" | "destination";
  smoothing?: number;
  area_units?: "km" | "m";
  attributes?: string[];
}

export interface IsochroneResponse {
  type: "FeatureCollection";
  features: IsochroneFeature[];
  bbox?: number[];
  metadata?: any;
}

export interface IsochroneFeature {
  type: "Feature";
  properties: {
    group_index: number;
    value: number;
    center: number[];
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface MatrixRequest {
  locations: Coordinate[];
  profile?: RouteRequest["profile"];
  sources?: number[];
  destinations?: number[];
  metrics?: ("distance" | "duration")[];
  resolve_locations?: boolean;
  units?: "km" | "m";
}

export interface MatrixResponse {
  distances?: number[][];
  durations?: number[][];
  destinations?: any[];
  sources?: any[];
  metadata?: any;
}

class OpenRouteService {
  private readonly baseUrl = "https://api.openrouteservice.org";
  private get apiKey(): string {
    return process.env.OPENROUTE_API_KEY || "";
  }

  private readonly requestDelay = 100; // Small delay to avoid rate limiting
  private lastRequestTime = 0;

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(endpoint: string, body: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error("OpenRouteService API key not configured");
    }

    // Respect rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await this.delay(this.requestDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouteService request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  private coordinateToArray(coord: Coordinate): [number, number] {
    return [coord.longitude, coord.latitude];
  }

  /**
   * Get directions between multiple points
   */
  async getDirections(request: RouteRequest): Promise<RouteResponse> {
    const body = {
      coordinates: request.coordinates.map((coord) =>
        this.coordinateToArray(coord)
      ),
      format: request.format || "json",
      units: request.units || "km",
      language: request.language || "en",
      geometry: request.geometry !== false,
      instructions: request.instructions !== false,
      elevation: request.elevation || false,
      extra_info: request.extra_info || [],
      optimized: request.optimized || false,
      radiuses: [10000],
    };

    const profile = request.profile || "driving-car";
    return await this.makeRequest<RouteResponse>(
      `/v2/directions/${profile}`,
      body
    );
  }

  /**
   * Get simple directions between two points
   */
  async getSimpleDirections(
    request: DirectionsRequest
  ): Promise<RouteResponse> {
    const routeRequest: RouteRequest = {
      coordinates: [request.start, request.end],
      profile: request.profile || "driving-car",
      geometry: true,
      instructions: true,
    };

    return await this.getDirections(routeRequest);
  }

  /**
   * Get isochrones (travel time/distance areas)
   */
  async getIsochrones(request: IsochroneRequest): Promise<IsochroneResponse> {
    const body = {
      locations: request.locations.map((coord) =>
        this.coordinateToArray(coord)
      ),
      range: request.range,
      range_type: request.range_type || "time",
      units: request.units || "km",
      location_type: request.location_type || "start",
      smoothing: request.smoothing || 25,
      area_units: request.area_units || "km",
      attributes: request.attributes || ["area", "reachfactor", "total_pop"],
    };

    const profile = request.profile || "driving-car";
    return await this.makeRequest<IsochroneResponse>(
      `/v2/isochrones/${profile}`,
      body
    );
  }

  /**
   * Get distance/time matrix between multiple points
   */
  async getMatrix(request: MatrixRequest): Promise<MatrixResponse> {
    const body = {
      locations: request.locations.map((coord) =>
        this.coordinateToArray(coord)
      ),
      sources: request.sources,
      destinations: request.destinations,
      metrics: request.metrics || ["distance", "duration"],
      resolve_locations: request.resolve_locations || false,
      units: request.units || "km",
    };

    const profile = request.profile || "driving-car";
    return await this.makeRequest<MatrixResponse>(
      `/v2/matrix/${profile}`,
      body
    );
  }

  /**
   * Optimize route order for multiple waypoints
   */
  async optimizeRoute(
    coordinates: Coordinate[],
    profile: RouteRequest["profile"] = "driving-car"
  ): Promise<RouteResponse> {
    const routeRequest: RouteRequest = {
      coordinates,
      profile,
      optimized: true,
      geometry: true,
      instructions: true,
    };

    return await this.getDirections(routeRequest);
  }

  /**
   * Get travel time between two points
   */
  async getTravelTime(
    start: Coordinate,
    end: Coordinate,
    profile: RouteRequest["profile"] = "driving-car"
  ): Promise<{ distance: number; duration: number }> {
    const response = await this.getSimpleDirections({ start, end, profile });

    if (!response.routes || response.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = response.routes[0];
    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const openRouteService = new OpenRouteService();
