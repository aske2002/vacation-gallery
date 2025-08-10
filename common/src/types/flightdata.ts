import { Coordinate } from "./routing";


export interface FlightData {
  decompression_state: boolean;
  weight_on_wheels: boolean;
  all_doors_closed: boolean;
  ground_speed_knots: number;
  time_to_destination_minutes: number;
  wind_speed_knots: number;
  flight_speed_mach: number;
  true_heading_degree: number;
  current_utc_time: string; // "HH:mm"
  outside_air_temp_celsius: number;
  head_wind_speed_knots: number | null;
  current_utc_date: string; // "YYYY-MM-DD"
  distance_to_destination_nautical_miles: number;
  altitude_feet: number;
  destination_icao: string;
  departure_icao: string;
  flight_number: string;
  destination_iata: string;
  departure_iata: string;
  tail_number: string;
  flight_phase: string;
  departure_utc_offset_minutes: number;
  destination_utc_offset_minutes: number;
  route_id: string | null;
  time_at_origin: string; // "HH:mm"
  time_at_destination: string; // "HH:mm"
  distance_from_departure_nautical_miles: number;
  distance_traveled_nautical_miles: number;
  estimated_arrival_time_utc: string; // "HH:mm"
  takeoff_time_utc: string; // ISO 8601
  wind_direction_degree: number;
  media_date: string;
  extv_channel_listing_version: number;
  current_coordinates: Coordinate;
  departure_coordinates: Coordinate;
  destination_coordinates: Coordinate;
  aircraft_type: string;
  all_doors_state: string;
  disclaimer: string;
  flight_id: string; // UUID
  flight_state: string;
  passenger_anouncement: any[]; // Empty array in your sample
  weight_on_wheels_state: string;
  distance_covered_percentage: number;
}
