export interface ExifData {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    taken_at?: string;
    camera_make?: string;
    camera_model?: string;
    iso?: number;
    aperture?: string;
    shutter_speed?: string;
    focal_length?: number;
}
export declare function extractExifData(buffer: Buffer | File): Promise<ExifData>;
