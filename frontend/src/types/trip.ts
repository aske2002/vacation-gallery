export interface TripStep {
  position: number[]; // Position array with any number of float values
  name?: string;
  notes: string;
  visit_duration: number;
  coordinates: Coordinates;
  address?: string;
  ack_warnings: boolean;
  url?: string;
  auto?: boolean;
  pin?: number;
  icon?: string;
  skip: boolean;
  arrival?: string;
  lodging?: Lodging;
  expander: Expander[];
  trip: Reference;
  nomad: Reference;
  tzoffset: number;
  tzname: string;
  tzabbr: string;
  id: string;
  uri: string;
}

interface Coordinates {
  lat: number;
  lon: number;
}

interface Lodging {
  active?: boolean;
  alternative?: LodgingAlternative[];
}

interface LodgingAlternative {
  name: string;
  coordinates: Coordinates;
  address: string;
  url: string;
}

interface Expander {
  position: number;
  route: Route[];
}

export interface Route {
  mode?: number;
  duration: number;
  distance: number;
  coordinates: Coordinates;
  polyline: string;
  name?: string;
  url?: string;
  auto?: number;
  pin?: number;
  visit?: number;
  tzoffset: number;
  tzname: string;
  tzabbr: string;
  tolls?: boolean;
  rough?: boolean;
}

interface Reference {
  id: string;
}
