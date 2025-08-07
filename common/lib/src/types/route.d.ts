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
export interface Route {
    id: string;
    trip_id: string;
    title: string;
    description?: string;
    profile: "driving-car" | "driving-hgv" | "cycling-regular" | "cycling-road" | "cycling-mountain" | "cycling-electric" | "foot-walking" | "foot-hiking" | "wheelchair";
    total_distance?: number;
    total_duration?: number;
    geometry?: string | {
        type: string;
        coordinates: [number, number][];
    };
    optimized: boolean;
    created_at: string;
    updated_at: string;
}
export interface RouteWithStops extends Route {
    stops: RouteStop[];
}
export interface RouteSegment {
    from_stop_id: string;
    to_stop_id: string;
    distance: number;
    duration: number;
    geometry?: any;
}
