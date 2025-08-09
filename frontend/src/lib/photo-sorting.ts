import { PhotoType } from "@common/types/photo";
import dayjs, { Dayjs } from "dayjs";
import formatDate from "./format-date";
import { Coordinate } from "@common/types/routing";
import { api } from "@/api/api";
import { cleanLocationName } from "./location-utils";
import { Position } from "geojson";
import { LatLngExpression } from "leaflet";

type PhotosSortKey = "time" | "name";

export interface LocationFormatOptions {
  maxParts?: number;
  includeCountry?: boolean | "auto";
  prioritizeLandmark?: boolean;
  showCoordinates?: boolean;
}

export class Photo {
  constructor(private readonly Data: PhotoType) {}

  get id(): string {
    return this.Data.id;
  }

  get time(): Dayjs {
    return dayjs(this.Data.created_at);
  }

  get timeISO(): string {
    return this.Data.created_at;
  }

  get formattedTime(): string {
    return formatDate(this.time);
  }

  get title(): string {
    return this.Data.title || "No title";
  }

  get coordinates(): Coordinate | null {
    if (this.Data.latitude && this.Data.longitude) {
      return {
        latitude: this.Data.latitude,
        longitude: this.Data.longitude,
        altitude: this.Data.altitude || 0,
      };
    }
    return null;
  }

  get latLng(): LatLngExpression | null {
    if (this.Data.latitude && this.Data.longitude) {
      return [this.Data.latitude, this.Data.longitude];
    }
    return null;
  }

  get position(): Position | null {
    if (this.Data.latitude && this.Data.longitude) {
      return [this.Data.longitude, this.Data.latitude];
    }
    return null;
  }

  get description(): string {
    return this.Data.description || "No description";
  }

  get thumbnailUrl(): string {
    return api.getThumbnailUrl(this.Data.filename);
  }

  get originalUrl(): string {
    return api.getImageUrl(this.Data.filename);
  }

  get filename(): string {
    return this.Data.filename || "unknown.jpg";
  }

  get dimensions(): { width: number; height: number } {
    return {
      width: this.Data.width || 0,
      height: this.Data.height || 0,
    };
  }

  get shortLocation(): string {
    return this.formatPhotoLocation({
      maxParts: 2,
      includeCountry: false,
      prioritizeLandmark: true,
    });
  }

  get mediumLocation(): string {
    return this.formatPhotoLocation({
      maxParts: 3,
      includeCountry: "auto",
      prioritizeLandmark: true,
    });
  }

  get cameraInfo() {
    return {
      make: this.Data.camera_make || "Unknown",
      model: this.Data.camera_model || "Unknown",
      focalLength: this.Data.focal_length || "Unknown",
      aperture: this.Data.aperture || "Unknown",
      shutterSpeed: this.Data.shutter_speed || "Unknown",
      iso: this.Data.iso || "Unknown",
    };
  }

  private formatPhotoLocation(options: LocationFormatOptions = {}): string {
    const {
      maxParts = 3,
      includeCountry = "auto",
      prioritizeLandmark = true,
      showCoordinates = false,
    } = options;

    const parts: string[] = [];

    // Priority 1: Landmark (most specific and interesting)
    if (prioritizeLandmark && this.Data.landmark) {
      parts.push(this.Data.landmark);
    }

    // Priority 2: City (most commonly useful)
    if (this.Data.city) {
      parts.push(this.Data.city);
    }

    // Priority 3: State/Province (for context)
    if (this.Data.state && this.Data.state !== this.Data.city) {
      parts.push(this.Data.state);
    }

    // Priority 4: Country (conditional)
    if (this.Data.country) {
      const shouldShowCountry =
        includeCountry === true ||
        (includeCountry === "auto" &&
          (parts.length === 0 || // No other location info
            (this.Data.country_code &&
              !["US", "CA", "GB"].includes(this.Data.country_code)) || // International
            parts.length === 1)); // Only have one piece of info, add country for context

      if (shouldShowCountry) {
        parts.push(this.Data.country);
      }
    }

    // If we have structured data, format it nicely
    if (parts.length > 0) {
      return parts.slice(0, maxParts).join(", ");
    }

    // Fallback to location_name but make it shorter and cleaner
    if (this.Data.location_name) {
      return cleanLocationName(this.Data.location_name, maxParts);
    }

    return "Location not available";
  }

  get fullLocation(): string {
    const parts: string[] = [];

    if (this.location.landmark) parts.push(this.location.landmark);
    if (this.location.city) parts.push(this.location.city);
    if (this.location.state) parts.push(this.location.state);
    if (this.location.country) parts.push(this.location.country);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return this.location.location_name || "Location not available";
  }

  get location() {
    return {
      location_name: this.Data.location_name || null,
      landmark: this.Data.landmark || null,
      city: this.Data.city || null,
      state: this.Data.state || null,
      country: this.Data.country || null,
      countryCode: this.Data.country_code || null,
      coordinates:
        this.Data.latitude && this.Data.longitude
          ? { lat: this.Data.latitude, lng: this.Data.longitude }
          : null,
      fullAddress: this.Data.location_name || null,
    };
  }
}

abstract class PhotoCollectionBase {
  abstract get all(): ReadonlyArray<Photo>;

  findById(id: string): Photo | undefined {
    return this.all.find((photo) => photo.id === id);
  }

  filterByLocation(coordinate: Coordinate): ReadonlyArray<Photo> {
    return this.all.filter((photo) => {
      const loc = photo.coordinates;
      return (
        loc &&
        loc.latitude === coordinate.latitude &&
        loc.longitude === coordinate.longitude
      );
    });
  }

  sortByKey<T extends PhotosSortKey>(sortKey: T): SortedPhotosCollection<T> {
    return new SortedPhotosCollection(this.all, sortKey);
  }

  get last(): Photo | null {
    return this.all.at(-1) || null;
  }

  get first(): Photo | null {
    return this.all.at(0) || null;
  }

  get count(): number {
    return this.all.length;
  }

  get hasPhotos(): boolean {
    return this.count > 0;
  }
}

export class PhotoCollection extends PhotoCollectionBase {
  private photos: Photo[];
  public readonly hash: string = "";

  constructor(photos: PhotoType[]) {
    super();
    this.photos = photos.map((photoData) => new Photo(photoData));
    this.hash = this.generateHash();
  }

  private generateHash(): string {
    return this.photos.map((p) => p.id).join("");
  }

  get all(): ReadonlyArray<Photo> {
    return this.photos;
  }

  closestTo(target: LatLngExpression, radiusKm?: number): Photo | null {
    // Normalize Leaflet's LatLngExpression into { lat, lng }
    const normalize = (pos: LatLngExpression): { lat: number; lng: number } => {
      if (Array.isArray(pos)) {
        const [lat, lng] = pos as [number, number];
        return { lat, lng };
      }
      const anyPos = pos as any;
      if (typeof anyPos.lat === "number" && typeof anyPos.lng === "number") {
        return { lat: anyPos.lat, lng: anyPos.lng };
      }
      if (typeof anyPos.lat === "number" && typeof anyPos.lon === "number") {
        return { lat: anyPos.lat, lng: anyPos.lon };
      }
      throw new Error("Invalid LatLngExpression");
    };

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    // Haversine distance in meters
    const distanceMeters = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number }
    ): number => {
      const R = 6371000; // mean Earth radius in meters
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      const sinDLat = Math.sin(dLat / 2);
      const sinDLng = Math.sin(dLng / 2);

      const h =
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    };

    const targetLL = normalize(target);
    const radiusMeters = radiusKm != null ? radiusKm * 1000 : undefined;

    let best: { photo: Photo; dist: number } | null = null;

    for (const photo of this.all) {
      const coords = photo.coordinates;
      if (!coords) continue;

      const photoLL = { lat: coords.latitude, lng: coords.longitude };
      const d = distanceMeters(targetLL, photoLL);

      if (radiusMeters != null && d > radiusMeters) {
        continue; // skip if outside radius
      }

      if (!best || d < best.dist) {
        best = { photo, dist: d };
      }
    }

    return best ? best.photo : null;
  }

  nextPhoto(current: Photo): Photo | null {
    const index = this.photos.findIndex((p) => p.id === current.id);
    if (index === -1 || index === this.photos.length - 1) return null;
    return this.photos[index + 1];
  }

  previousPhoto(current: Photo): Photo | null {
    const index = this.photos.findIndex((p) => p.id === current.id);
    if (index <= 0) return null;
    return this.photos[index - 1];
  }
}

export class SortedPhotosCollection<
  K extends PhotosSortKey,
> extends PhotoCollectionBase {
  private sortedPhotos: Photo[];
  public readonly sortKey: K;

  constructor(sortedPhotos: ReadonlyArray<Photo>, sortKey: K) {
    super();
    this.sortKey = sortKey;
    this.sortedPhotos = [...sortedPhotos].sort((a, b) => {
      switch (sortKey) {
        case "time":
          return a.time.isAfter(b.time) ? -1 : 1;
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }

  get all(): ReadonlyArray<Photo> {
    return this.sortedPhotos;
  }
}
