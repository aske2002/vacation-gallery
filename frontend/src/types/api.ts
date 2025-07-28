export type ListApiResponse<T> = {
  success: boolean;
  data: {
    list: T[];
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type Album = {
  flex_section: number[];
  provider_count: number;
  sharing_info: {
    enable_password: boolean;
    expiration: number;
    is_expired: boolean;
    mtime: number;
    owner: {
      id: number;
      name: string;
    };
    passphrase: string;
    privacy_type: string; // e.g., "public-download"
    sharing_link: string;
    type: string; // e.g., "album"
    thumbnail: {
      cache_key: string;
      m: string; // e.g., "ready"
      preview: string; // e.g., "broken"
      sm: string;
      xl: string;
      unit_id: number;
    };
  };
  cant_migrate_condition: Record<string, unknown>;
  condition: Record<string, unknown>;
  create_time: number;
  end_time: number;
  freeze_album: boolean;
  id: number;
  item_count: number;
  name: string;
  owner_user_id: number;
  passphrase: string;
  shared: boolean;
  sort_by: string; // e.g., "default"
  sort_direction: string; // e.g., "default"
  start_time: number;
  temporary_shared: boolean;
  type: string; // e.g., "normal"
  version: number;
};

export type AlbumItem = {
  id: number;
  filename: string;
  filesize: number;
  time: number;
  indexed_time: number;
  owner_user_id: number;
  folder_id: number;
  type: "photo" | string;
  additional: {
    description: string;
    resolution: {
      width: number;
      height: number;
    };
    orientation: number;
    orientation_original: number;
    gps?: {
      latitude: number;
      longitude: number;
    };
    address?: Address;
    thumbnail: {
      m: "ready" | "broken" | string;
      xl: "ready" | "broken" | string;
      preview: "ready" | "broken" | string;
      sm: "ready" | "broken" | string;
      cache_key: string;
      unit_id: number;
    };
    provider_user_id: number;
  };
};

export type Address = {
  city: string;
  city_id: string;
  country: string;
  country_id: string;
  county: string;
  county_id: string;
  district: string;
  district_id: string;
  landmark: string;
  landmark_id: string;
  route: string;
  route_id: string;
  state: string;
  state_id: string;
  town: string;
  town_id: string;
  village: string;
  village_id: string;
};
