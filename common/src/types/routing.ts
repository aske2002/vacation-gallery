
// OpenRouteService Types
export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number; // Optional altitude
}

export interface RouteRequest {
  coordinates: Coordinate[];
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'cycling-road' | 'cycling-mountain' | 'cycling-electric' | 'foot-walking' | 'foot-hiking' | 'wheelchair';
  format?: 'json' | 'geojson';
  units?: 'km' | 'm';
  language?: string;
  geometry?: boolean;
  instructions?: boolean;
  elevation?: boolean;
  extra_info?: string[];
}

export interface ORSRouteResponse {
  routes: ORSRoute[];
  bbox?: number[];
  metadata?: any;
}

export interface ORSRoute {
  summary: {
    distance: number; // in meters
    duration: number; // in seconds
  };
  geometry?: any; // GeoJSON LineString or encoded polyline
  segments?: ORSRouteSegment[];
  bbox?: number[];
  way_points?: number[];
}

export interface ORSRouteSegment {
  distance: number;
  duration: number;
  steps?: ORSRouteStep[];
}

export interface ORSRouteStep {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name?: string;
  way_points?: number[];
}

export interface ORSDirectionsRequest {
  start: Coordinate;
  end: Coordinate;
  profile?: RouteRequest['profile'];
  alternatives?: boolean;
  avoid_features?: string[];
  avoid_borders?: 'all' | 'controlled' | 'none';
  avoid_countries?: string[];
}

export interface IsochroneRequest {
  locations: Coordinate[];
  range: number[]; // time in seconds or distance in meters
  range_type?: 'time' | 'distance';
  profile?: RouteRequest['profile'];
  units?: 'km' | 'm';
  location_type?: 'start' | 'destination';
  smoothing?: number;
  area_units?: 'km' | 'm';
  attributes?: string[];
}

export interface IsochroneResponse {
  type: 'FeatureCollection';
  features: IsochroneFeature[];
  bbox?: number[];
  metadata?: any;
}

export interface IsochroneFeature {
  type: 'Feature';
  properties: {
    group_index: number;
    value: number;
    center: number[];
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface MatrixRequest {
  locations: Coordinate[];
  profile?: RouteRequest['profile'];
  sources?: number[];
  destinations?: number[];
  metrics?: ('distance' | 'duration')[];
  resolve_locations?: boolean;
  units?: 'km' | 'm';
}

export interface MatrixResponse {
  distances?: number[][];
  durations?: number[][];
  destinations?: any[];
  sources?: any[];
  metadata?: any;
}

export interface TravelTimeResponse {
  distance: number; // in meters
  duration: number; // in seconds
}

export interface HealthResponse {
  service: string;
  configured: boolean;
  message: string;
}

export interface ProfilesResponse {
  profiles: string[];
}