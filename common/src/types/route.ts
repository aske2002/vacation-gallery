export interface RouteStop {
  id: string;
  route_id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  order_index: number;
  location_name?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteSegment {
  id: string;
  route_id: string;
  start_stop_id: string;
  end_stop_id: string;
  distance: number;
  duration: number;
  coordinates_hash: string; // Hash of the coordinates for quick lookup
  geometry: string | { type: "LineString"; coordinates: [number, number][] };
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  profile:
    | "driving-car"
    | "driving-hgv"
    | "cycling-regular"
    | "cycling-road"
    | "cycling-mountain"
    | "cycling-electric"
    | "foot-walking"
    | "foot-hiking"
    | "wheelchair";
  created_at: string;
  updated_at: string;
  stops: RouteStop[];
  segments: RouteSegment[];
}