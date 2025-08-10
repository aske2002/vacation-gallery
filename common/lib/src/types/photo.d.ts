export interface PhotoType {
    id: string;
    trip_id: string;
    filename: string;
    original_filename: string;
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    location_name?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    landmark?: string;
    taken_at?: string;
    camera_make?: string;
    camera_model?: string;
    iso?: number;
    aperture?: string;
    shutter_speed?: string;
    focal_length?: number;
    file_size: number;
    mime_type: string;
    width: number;
    height: number;
    created_at: string;
    updated_at: string;
}
export type PhotoEditableMetadata = {
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    taken_at?: string;
};
