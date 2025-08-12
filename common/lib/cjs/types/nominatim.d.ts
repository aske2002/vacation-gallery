export interface NominatimResult {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    class: string;
    icon?: string;
}
export interface LatLng {
    lat: number;
    lng: number;
}
