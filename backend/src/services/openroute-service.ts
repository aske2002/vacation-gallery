import {
  Coordinate,
  IsochroneRequest,
  IsochroneResponse,
  MatrixRequest,
  MatrixResponse,
  ORSDirectionsRequest,
  ORSRouteResponse,
  RouteRequest,
} from "vacation-gallery-common";

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
  async getDirections(request: RouteRequest): Promise<ORSRouteResponse> {
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
      radiuses: [10000],
    };

    const profile = request.profile || "driving-car";
    return await this.makeRequest<ORSRouteResponse>(
      `/v2/directions/${profile}`,
      body
    );
  }

  /**
   * Get simple directions between two points
   */
  async getSimpleDirections(
    request: ORSDirectionsRequest
  ): Promise<ORSRouteResponse> {
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
  ): Promise<ORSRouteResponse> {
    const routeRequest: RouteRequest = {
      coordinates,
      profile,
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
