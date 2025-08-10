import sqlite3 from "sqlite3";
import { open, Database as SqliteDatabase } from "sqlite";
import path, { resolve } from "path";
import { v4 as uuidv4 } from "uuid";
import { geocodingService, LocationInfo } from "./geocoding-service";
import { PhotoType } from "../../common/src/types/photo";
import { Trip } from "../../common/src/types/trip";
import { Route, RouteSegment, RouteStop } from "../../common/src/types/route";
import {
  Coordinate,
  openRouteService,
  RouteRequest,
  RouteResponse,
} from "./openroute-service";
import crypto from "crypto";

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

class Database {
  private db: SqliteDatabase;

  constructor() {
    const dbPath = path.join(__dirname, "..", "data", "vacation_gallery.db");
    this.db = new SqliteDatabase({
      driver: sqlite3.Database,
      filename: dbPath,
    });
    this.init();
  }

  private async init() {
    await this.db.open();
    await this.db.run(`
          CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            start_date TEXT,
            end_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);

    // Create photos table
    await this.db.run(`
          CREATE TABLE IF NOT EXISTS photos (
            id TEXT PRIMARY KEY,
            trip_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            title TEXT,
            description TEXT,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            location_name TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            country_code TEXT,
            landmark TEXT,
            taken_at TEXT,
            camera_make TEXT,
            camera_model TEXT,
            iso INTEGER,
            aperture TEXT,
            shutter_speed TEXT,
            focal_length REAL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
          )
        `);

    // Create indexes
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON photos (trip_id)`
    );
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_photos_coordinates ON photos (latitude, longitude)`
    );
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos (taken_at)`
    );

    // Create users table
    await this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);

    // Create routes table
    await this.db.run(`
          CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            trip_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            profile TEXT NOT NULL DEFAULT 'driving-car',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
          )
        `);

    // Create route_stops table
    await this.db.run(`
          CREATE TABLE IF NOT EXISTS route_stops (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            order_index INTEGER NOT NULL,
            location_name TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            country_code TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE
          )
        `);

    // Create user indexes
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`
    );
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`
    );

    // Create route indexes
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_routes_trip_id ON routes (trip_id)`
    );
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops (route_id)`
    );
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops (route_id, order_index)`
    );

    // Create route_segments table
    await this.db.run(`
  CREATE TABLE IF NOT EXISTS route_segments (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    start_stop_id TEXT NOT NULL,
    end_stop_id TEXT NOT NULL,
    distance INTEGER,
    duration INTEGER,
    geometry TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    coordinates_hash TEXT NOT NULL,
    FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE,
    FOREIGN KEY (start_stop_id) REFERENCES route_stops (id) ON DELETE CASCADE,
    FOREIGN KEY (end_stop_id) REFERENCES route_stops (id) ON DELETE CASCADE
  )
`);
    await this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_route_segments_route_id ON route_segments (route_id)`
    );
  }

  // Trip methods
  async createTrip(
    trip: Omit<Trip, "created_at" | "updated_at">
  ): Promise<Trip> {
    const now = new Date().toISOString();
    const tripData: Trip = {
      ...trip,
      created_at: now,
      updated_at: now,
    };

    const stmt = await this.db.prepare(`
        INSERT INTO trips (id, name, description, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

    await stmt.run([
      tripData.id,
      tripData.name,
      tripData.description,
      tripData.start_date,
      tripData.end_date,
      tripData.created_at,
      tripData.updated_at,
    ]);
    return tripData;
  }

  async getAllTrips(): Promise<Trip[]> {
    return this.db.all(
      "SELECT * FROM trips ORDER BY created_at DESC"
    ) as Promise<Trip[]>;
  }

  async getTripById(id: string): Promise<Trip | null> {
    return this.db.get("SELECT * FROM trips WHERE id = ?", [
      id,
    ]) as Promise<Trip>;
  }

  async updateTrip(
    id: string,
    updates: Partial<Omit<Trip, "id" | "created_at" | "updated_at">>
  ): Promise<Trip | null> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    const result = await this.db.run(
      `UPDATE trips SET ${fields}, updated_at = ? WHERE id = ?`,
      [...values, now, id]
    );
    return await this.getTripById(id);
  }

  async deleteTrip(id: string): Promise<boolean> {
    return this.db
      .run("DELETE FROM trips WHERE id = ?", [id])
      .then((r) => !!r.changes && r.changes > 0);
  }

  // Helper method to enhance photo with location information
  private async enhancePhotoWithLocation(
    photoData: Partial<PhotoType>
  ): Promise<Partial<PhotoType>> {
    // Only geocode if coordinates are provided and location info is missing
    if (photoData.latitude && photoData.longitude && !photoData.location_name) {
      try {
        console.log(
          `Extracting location for coordinates: ${photoData.latitude}, ${photoData.longitude}`
        );
        const locationInfo = await geocodingService.reverseGeocode(
          photoData.latitude,
          photoData.longitude
        );

        if (locationInfo) {
          return {
            ...photoData,
            location_name: locationInfo.location_name,
            city: locationInfo.city,
            state: locationInfo.state,
            country: locationInfo.country,
            country_code: locationInfo.country_code,
            landmark: locationInfo.landmark,
          };
        }
      } catch (error) {
        console.error("Failed to extract location information:", error);
        // Continue without location info rather than failing the entire operation
      }
    }

    return photoData;
  }

  // Photo methods
  async createPhoto(
    photo: Omit<PhotoType, "created_at" | "updated_at">
  ): Promise<PhotoType> {
    const now = new Date().toISOString();

    // Enhance photo data with location information if coordinates are provided
    const enhancedPhoto = await this.enhancePhotoWithLocation(photo);

    const photoData: PhotoType = {
      ...enhancedPhoto,
      created_at: now,
      updated_at: now,
    } as PhotoType;
    const stmt = await this.db.prepare(`
        INSERT INTO photos (
          id, trip_id, filename, original_filename, title, description,
          latitude, longitude, altitude, location_name, city, state, country, country_code, landmark,
          taken_at, camera_make, camera_model,
          iso, aperture, shutter_speed, focal_length, file_size, mime_type,
          width, height, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run([
      photoData.id,
      photoData.trip_id,
      photoData.filename,
      photoData.original_filename,
      photoData.title,
      photoData.description,
      photoData.latitude,
      photoData.longitude,
      photoData.altitude,
      photoData.location_name,
      photoData.city,
      photoData.state,
      photoData.country,
      photoData.country_code,
      photoData.landmark,
      photoData.taken_at,
      photoData.camera_make,
      photoData.camera_model,
      photoData.iso,
      photoData.aperture,
      photoData.shutter_speed,
      photoData.focal_length,
      photoData.file_size,
      photoData.mime_type,
      photoData.width,
      photoData.height,
      photoData.created_at,
      photoData.updated_at,
    ]);
    return photoData;
  }

  async getAllPhotos(): Promise<PhotoType[]> {
    return this.db.all(
      "SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC"
    );
  }

  async getPhotosByTripId(tripId: string): Promise<PhotoType[]> {
    return this.db.all(
      "SELECT * FROM photos WHERE trip_id = ? ORDER BY taken_at DESC, created_at DESC",
      [tripId]
    );
  }

  async getPhotoById(id: string): Promise<PhotoType | null> {
    return this.db
      .get<PhotoType | null>("SELECT * FROM photos WHERE id = ?", [id])
      .then((p) => p || null);
  }

  async updatePhoto(
    id: string,
    updates: Partial<Omit<PhotoType, "id">>
  ): Promise<PhotoType | null> {
    const now = new Date().toISOString();

    // Enhance updates with location information if coordinates are being updated
    const enhancedUpdates = await this.enhancePhotoWithLocation(updates);

    const fields = Object.keys(enhancedUpdates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(enhancedUpdates);

    return this.db
      .run(`UPDATE photos SET ${fields}, updated_at = ? WHERE id = ?`, [
        ...values,
        now,
        id,
      ])
      .then((r) => (r.changes === 0 ? null : database.getPhotoById(id)));
  }

  async deletePhoto(id: string): Promise<boolean> {
    return this.db
      .run("DELETE FROM photos WHERE id = ?", [id])
      .then((r) => !!r.changes && r.changes > 0);
  }

  async deletePhotos(
    ids: string[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    if (ids.length === 0) {
      return { successful: [], failed: [] };
    }

    const successful: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
        const results = await this.db.run("DELETE FROM photos WHERE id = ?", [
        id,
      ]);
      if (results.changes === 0) {
        failed.push(id);
        continue;
      }
    }
    successful.push(...ids);
    return {
      successful,
      failed,
    };
  }

  async getPhotosWithCoordinates(): Promise<PhotoType[]> {
    return this.db.all(
      "SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY taken_at DESC, created_at DESC"
    );
  }

  // User methods
  async createUser(
    user: Omit<User, "created_at" | "updated_at">
  ): Promise<User> {
    const now = new Date().toISOString();
    const userWithTimestamps = { ...user, created_at: now, updated_at: now };
    await this.db.run(
      `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.email,
        user.password_hash,
        user.role,
        now,
        now,
      ]
    );
    return userWithTimestamps;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db
      .get("SELECT * FROM users WHERE id = ?", [id])
      .then((u) => u || null);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.db
      .get("SELECT * FROM users WHERE username = ?", [username])
      .then((u) => u || null);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db
      .get("SELECT * FROM users WHERE email = ?", [email])
      .then((u) => u || null);
  }

  async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<User | null> {
    return this.db
      .get("SELECT * FROM users WHERE username = ? OR email = ?", [
        username,
        email,
      ])
      .then((u) => u || null);
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<User, "username" | "email">>
  ): Promise<User> {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.username !== undefined) {
      fields.push("username = ?");
      values.push(updates.username);
    }
    if (updates.email !== undefined) {
      fields.push("email = ?");
      values.push(updates.email);
    }

    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);
    await this.db.run(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    return this.getUserById(id).then((user) => {
      if (!user) throw new Error("User not found after update");
      return user;
    });
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const now = new Date().toISOString();
    return await this.db
      .run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [
        passwordHash,
        now,
        id,
      ])
      .then((r) => !!r.changes && r.changes > 0);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.run("DELETE FROM users WHERE id = ?", [id]);
    return !!result.changes && result.changes > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.all(
      "SELECT * FROM users ORDER BY created_at DESC"
    ) as Promise<User[]>;
  }

  // Route methods
  async createRoute(
    route: Omit<Route, "created_at" | "updated_at" | "geometry">,
    stops: Omit<RouteStop, "id" | "route_id" | "created_at" | "updated_at">[]
  ): Promise<Route> {
    const now = new Date().toISOString();
    const routeData = {
      ...route,
      created_at: now,
      updated_at: now,
    };

    // Insert route
    const stmt = await this.db.prepare(`
      INSERT INTO routes (id, trip_id, title, description, profile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.run([
      routeData.id,
      routeData.trip_id,
      routeData.title,
      routeData.description,
      routeData.profile,
      routeData.created_at,
      routeData.updated_at,
    ]);

    // Create route stops
    for (const routeStop of stops) {
      await this.createRouteStop(routeData.id, routeStop);
    }
    return await this.getRoute(routeData.id);
  }

  async getAllRoutes(): Promise<Route[]> {
    const rows = (await this.db.all(
      "SELECT * FROM routes ORDER BY created_at DESC"
    )) as any[];
    const routes = rows.map((row) => ({
      ...row,
    }));
    return routes as Route[];
  }

  async getRoutesByTripId(tripId: string): Promise<Route[]> {
    const rows = await this.db.all<any>(
      `
    SELECT 
      r.*,
      COALESCE(
        (
          SELECT json_group_array(json_object(
            'id', s.id,
            'route_id', s.route_id,
            'title', s.title,
            'description', s.description,
            'latitude', s.latitude,
            'longitude', s.longitude,
            'order_index', s.order_index,
            'location_name', s.location_name,
            'city', s.city,
            'state', s.state,
            'country', s.country,
            'country_code', s.country_code,
            'created_at', s.created_at,
            'updated_at', s.updated_at
          ))
          FROM route_stops s
          WHERE s.route_id = r.id
          ORDER BY s.order_index
        ), '[]'
      ) AS stops,
      COALESCE(
        (
          SELECT json_group_array(json_object(
            'id', g.id,
            'route_id', g.route_id,
            'start_stop_id', g.start_stop_id,
            'end_stop_id', g.end_stop_id,
            'distance', g.distance,
            'duration', g.duration,
            'geometry', g.geometry,
            'coordinates_hash', g.coordinates_hash,
            'created_at', g.created_at,
            'updated_at', g.updated_at
          ))
          FROM route_segments g
          WHERE g.route_id = r.id
        ), '[]'
      ) AS segments
    FROM routes r
    WHERE r.trip_id = ?
    ORDER BY r.created_at DESC
    `,
      [tripId]
    );

    return rows.map((r: any) => ({
      ...r,
      stops: JSON.parse(r.stops),
      segments: JSON.parse(r.segments).map((seg: any) => ({
        ...seg,
        geometry: JSON.parse(seg.geometry), // keep geometry as object
      })),
    })) as Route[];
  }

  async getRouteById(id: string): Promise<Route> {
    const row = (await this.db.get("SELECT * FROM routes WHERE id = ?", [
      id,
    ])) as any;
    if (!row) throw new Error("Route could not be found");
    const route = {
      ...row,
    };
    return route as Route;
  }

  async getRoute(id: string): Promise<Route> {
    const routeRow = (await this.db.get("SELECT * FROM routes WHERE id = ?", [
      id,
    ])) as any;

    if (!routeRow) {
      throw new Error(`Route with ID ${id} not found`);
    }

    // Get stops for this route
    const stopRows = (await this.db.all(
      "SELECT * FROM route_stops WHERE route_id = ? ORDER BY order_index",
      [id]
    )) as RouteStop[];

    const segmentRows = (await this.db.all(
      "SELECT * FROM route_segments WHERE route_id = ?",
      [id]
    )) as any[];

    const segments = segmentRows
      .map((segment) => {
        try {
          return {
            ...segment,
            geometry: JSON.parse(segment.geometry),
          };
        } catch (e) {
          console.error(
            `Failed to parse geometry for segment ${segment.id}`,
            e
          );
          return null;
        }
      })
      .filter((s) => s !== null) as RouteSegment[];

    const route = {
      ...routeRow,
      stops: stopRows,
      segments: segments,
    };
    return route as Route;
  }

  private async getSegmentDirections(
    start: Coordinate,
    end: Coordinate,
    profile: RouteRequest["profile"]
  ): Promise<RouteResponse["routes"][number]> {
    if (!openRouteService.isConfigured()) {
      throw new Error("OpenRouteService API key not configured");
    }

    const routeRequest: RouteRequest = {
      coordinates: [start, end],
      profile: profile,
      geometry: true,
      instructions: false,
    };

    const routeResponse = await openRouteService.getDirections(routeRequest);

    if (routeResponse.routes && routeResponse.routes.length > 0) {
      return routeResponse.routes[0];
    } else {
      throw new Error("No route found for the segment");
    }
  }

  hashCoordinates(start: Coordinate, end: Coordinate): string {
    const data = `${start.latitude},${start.longitude}:${end.latitude},${end.longitude}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  async regenerateRoutePath(routeId: string, timestamp?: Date): Promise<Route> {
    const {
      segments: existingSegments,
      stops,
      ...route
    } = await this.getRoute(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    const segments: RouteSegment[] = [];
    const now = timestamp?.toISOString() ?? new Date().toISOString();

    if (stops.length < 2) {
      await this.db.run("DELETE FROM route_segments WHERE route_id = ?", [
        routeId,
      ]);
      await this.db.run(`UPDATE routes SET updated_at = ? WHERE id = ?`, [
        now,
        route.id,
      ]);
      return {
        ...route,
        stops,
        segments: [],
        updated_at: now,
      };
    }

    const existingSegmentsMap = new Map(
      existingSegments.map((s) => [s.start_stop_id, s])
    );
    const newSegmentIds = new Set<string>();

    for (let i = 0; i < stops.length - 1; i++) {
      const start = stops[i];
      const end = stops[i + 1];
      const currentHash = this.hashCoordinates(
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: end.latitude, longitude: end.longitude }
      );

      const existingSegment = existingSegmentsMap.get(start.id);

      if (
        existingSegment &&
        existingSegment.end_stop_id === end.id &&
        existingSegment.coordinates_hash === currentHash
      ) {
        segments.push(existingSegment);
        newSegmentIds.add(existingSegment.id);
      } else {
        try {
          const segmentDirections = await this.getSegmentDirections(
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: end.latitude, longitude: end.longitude },
            route.profile
          );

          if (segmentDirections.geometry) {
            const segmentId = uuidv4();
            const segmentData: RouteSegment = {
              id: segmentId,
              route_id: route.id,
              start_stop_id: start.id,
              end_stop_id: end.id,
              distance: segmentDirections.summary.distance,
              duration: segmentDirections.summary.duration,
              geometry: segmentDirections.geometry,
              coordinates_hash: currentHash,
              created_at: now,
              updated_at: now,
            };

            await this.db.run(
              `INSERT INTO route_segments 
               (id, route_id, start_stop_id, end_stop_id, distance, duration, geometry, coordinates_hash, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                segmentId,
                route.id,
                start.id,
                end.id,
                segmentData.distance,
                segmentData.duration,
                JSON.stringify(segmentData.geometry),
                currentHash,
                now,
                now,
              ]
            );
            segments.push(segmentData);
            newSegmentIds.add(segmentId);
          }
        } catch (error) {
          console.error(
            `Failed to get directions for segment from ${start.title} to ${end.title}:`,
            error
          );
        }
      }
    }

    // Delete old segments that are no longer part of the route
    const segmentsToDelete = existingSegments.filter(
      (s) => !newSegmentIds.has(s.id)
    );
    if (segmentsToDelete.length > 0) {
      const idsToDelete = segmentsToDelete.map((s) => s.id);
      await this.db.run(
        `DELETE FROM route_segments WHERE id IN (${idsToDelete
          .map(() => "?")
          .join(",")})`,
        idsToDelete
      );
    }

    // Update parent route's timestamp
    await this.db.run(`UPDATE routes SET updated_at = ? WHERE id = ?`, [
      now,
      route.id,
    ]);

    return {
      ...route,
      updated_at: now,
      stops,
      segments,
    };
  }

  async updateRoute(
    id: string,
    updates?: Partial<
      Omit<Route, "id" | "trip_id" | "created_at" | "updated_at">
    >
  ) {
    const routeWithStops = await this.getRoute(id);
    if (!routeWithStops) {
      throw new Error(`Route with ID ${id} not found`);
    }

    const combined = {
      ...routeWithStops,
      ...updates,
    };

    const updated: Partial<Omit<Route, "id" | "trip_id" | "created_at">> = {
      updated_at: new Date().toISOString(),
      title: combined.title,
      description: combined.description,
      profile: combined.profile,
    };

    const fields = Object.keys(updated || {}).map((key) => `${key} = ?`);
    const values: any[] = Object.entries(updated || {}).map(
      ([, value]) => value || null
    );
    await this.db.run(`UPDATE routes SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return await this.regenerateRoutePath(id);
  }

  async deleteRoute(id: string): Promise<boolean> {
    const result = await this.db.run("DELETE FROM routes WHERE id = ?", [id]);
    return !!result.changes && result.changes > 0;
  }

  async getRouteStops(routeId: string): Promise<RouteStop[]> {
    return this.db.all(
      "SELECT * FROM route_stops WHERE route_id = ? ORDER BY order_index",
      [routeId]
    ) as Promise<RouteStop[]>;
  }

  async createRouteStop(
    routeId: string,
    stopData: Omit<RouteStop, "id" | "route_id" | "created_at" | "updated_at">
  ): Promise<Route> {
    const now = new Date().toISOString();
    const stopId = uuidv4();
    // Enhance stop with location information if needed
    let enhancedStopData = { ...stopData };
    if (!stopData.location_name && stopData.latitude && stopData.longitude) {
      try {
        const locationInfo = await geocodingService.reverseGeocode(
          stopData.latitude,
          stopData.longitude
        );
        if (locationInfo) {
          enhancedStopData = {
            ...stopData,
            location_name: locationInfo.location_name,
            city: locationInfo.city,
            state: locationInfo.state,
            country: locationInfo.country,
            country_code: locationInfo.country_code,
          };
        }
      } catch (error) {
        console.error(
          "Failed to extract location information for stop:",
          error
        );
      }
    }

    const oldRoute = await this.getRoute(routeId);
    const finalStopData: RouteStop = {
      id: stopId,
      route_id: routeId,
      ...enhancedStopData,
      created_at: now,
      order_index: oldRoute.stops.length,
      updated_at: now,
    };

    const stmt = await this.db.prepare(`
        INSERT INTO route_stops (id, route_id, title, description, latitude, longitude, order_index, location_name, city, state, country, country_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
    await stmt.run([
      finalStopData.id,
      finalStopData.route_id,
      finalStopData.title,
      finalStopData.description,
      finalStopData.latitude,
      finalStopData.longitude,
      finalStopData.order_index,
      finalStopData.location_name,
      finalStopData.city,
      finalStopData.state,
      finalStopData.country,
      finalStopData.country_code,
      finalStopData.created_at,
      finalStopData.updated_at,
    ]);

    return await this.regenerateRoutePath(routeId);
  }

  private async reorderAllRouteStops(
    routeId: string,
    move?: {
      stopId: string;
      newStopIndex: number;
    }
  ): Promise<RouteStop[]> {
    const allStops = await this.getRouteStops(routeId);
    const sortedStops = [...allStops].sort(
      (a, b) => a.order_index - b.order_index
    );

    if (move) {
      const oldIndex = sortedStops.findIndex((stop) => stop.id === move.stopId);
      if (oldIndex === -1) throw new Error("Could not find stop to move");
      if (move.newStopIndex < 0 || move.newStopIndex >= sortedStops.length)
        throw new Error("Invalid new index of stop");

      const [movedStop] = sortedStops.splice(oldIndex, 1);
      sortedStops.splice(move.newStopIndex, 0, movedStop);
    }

    const reorderedStops: RouteStop[] = sortedStops.map((stop, index) => ({
      ...stop,
      order_index: index,
    }));

    await this.db.run("BEGIN TRANSACTION");

    try {
      for (const stop of reorderedStops) {
        const stmt = await this.db.prepare(
          "UPDATE route_stops SET order_index = ? WHERE id = ?"
        );
        await stmt.run([stop.order_index, stop.id]);
      }
      await this.db.run("COMMIT");
    } catch (err) {
      await this.db.run("ROLLBACK");
      throw err;
    }

    return reorderedStops;
  }

  async updateRouteStop(
    id: string,
    updates: Partial<
      Omit<RouteStop, "id" | "route_id" | "created_at" | "updated_at">
    >
  ): Promise<Route> {
    const now = new Date().toISOString();
    const currentStop = await this.getRouteStopById(id);

    // Enhance updates with location information if coordinates are being updated
    let enhancedUpdates = { ...updates };
    if (updates.latitude || updates.longitude) {
      const lat = updates.latitude ?? currentStop.latitude;
      const lng = updates.longitude ?? currentStop.longitude;
      const locationInfo = await geocodingService.reverseGeocode(lat, lng);
      if (locationInfo) {
        enhancedUpdates = {
          ...updates,
          location_name: locationInfo.location_name,
          city: locationInfo.city,
          state: locationInfo.state,
          country: locationInfo.country,
          country_code: locationInfo.country_code,
        };
      }
    }

    const updateFields = Object.keys(enhancedUpdates);
    if (updateFields.length > 0) {
      const fields = updateFields.map((key) => `${key} = ?`).join(", ");
      const values = Object.values(enhancedUpdates);
      await this.db.run(
        `UPDATE route_stops SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, now, id]
      );
    }

    const needsRegeneration =
      updates.latitude !== undefined ||
      updates.longitude !== undefined ||
      updates.order_index !== undefined;

    if (updates.order_index !== undefined) {
      await this.reorderAllRouteStops(currentStop.route_id, {
        stopId: id,
        newStopIndex: updates.order_index,
      });
    }

    if (needsRegeneration) {
      return await this.regenerateRoutePath(currentStop.route_id);
    }

    return this.getRoute(currentStop.route_id);
  }

  async getRouteStopById(id: string): Promise<RouteStop> {
    const out = await this.db.get<RouteStop>(
      "SELECT * FROM route_stops WHERE id = ?",
      [id]
    );

    if (!out) throw new Error(`Route stop with ID ${id} not found`);
    return out;
  }

  async deleteRouteStop(id: string): Promise<Route> {
    const routeStop = await this.getRouteStopById(id);
    await this.db.run("DELETE FROM route_stops WHERE id = ?", [id]);
    await this.reorderAllRouteStops(routeStop.route_id);
    return await this.regenerateRoutePath(routeStop.route_id);
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  // Method to backfill location information for existing photos
  async backfillLocationData(): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    console.log("Starting location data backfill...");

    const photosWithCoords = await this.getPhotosWithCoordinatesButNoLocation();
    const stats = { processed: 0, updated: 0, errors: 0 };

    for (const photo of photosWithCoords) {
      try {
        stats.processed++;
        console.log(
          `Processing photo ${photo.id} (${stats.processed}/${photosWithCoords.length})`
        );

        const locationInfo = await geocodingService.reverseGeocode(
          photo.latitude!,
          photo.longitude!
        );

        if (locationInfo) {
          await this.updatePhotoLocationInfo(photo.id, locationInfo);
          stats.updated++;
          console.log(`Updated location for photo ${photo.id}`);
        }

        // Add a delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1100)); // 1.1 second delay
      } catch (error) {
        stats.errors++;
        console.error(`Error processing photo ${photo.id}:`, error);
      }
    }

    console.log("Location data backfill completed:", stats);
    return stats;
  }

  private async getPhotosWithCoordinatesButNoLocation(): Promise<PhotoType[]> {
    return await this.db.all(
      "SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_name IS NULL"
    );
  }

  // Public method to get photos that need location data
  async getPhotosNeedingLocationData(): Promise<PhotoType[]> {
    return this.getPhotosWithCoordinatesButNoLocation();
  }

  private async updatePhotoLocationInfo(
    id: string,
    locationInfo: LocationInfo
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE photos SET 
         location_name = ?, city = ?, state = ?, country = ?, country_code = ?, landmark = ?, updated_at = ?
         WHERE id = ?`,
      [
        locationInfo.location_name,
        locationInfo.city,
        locationInfo.state,
        locationInfo.country,
        locationInfo.country_code,
        locationInfo.landmark,
        now,
        id,
      ]
    );
  }
}

export const database = new Database();
