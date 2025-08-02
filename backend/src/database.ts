import sqlite3 from "sqlite3";
import path from "path";
import { geocodingService, LocationInfo } from "./geocoding-service";
import { Photo } from "../../common/src/types/photo";
import { Trip } from "../../common/src/types/trip";

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
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(__dirname, "..", "data", "vacation_gallery.db");
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private async init() {
    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        // Create trips table
        this.db.run(`
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
        this.db.run(`
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

        // Add location columns if they don't exist (migration)
        this.db.run(
          `ALTER TABLE photos ADD COLUMN location_name TEXT`,
          () => {}
        );
        this.db.run(`ALTER TABLE photos ADD COLUMN city TEXT`, () => {});
        this.db.run(`ALTER TABLE photos ADD COLUMN state TEXT`, () => {});
        this.db.run(`ALTER TABLE photos ADD COLUMN country TEXT`, () => {});
        this.db.run(
          `ALTER TABLE photos ADD COLUMN country_code TEXT`,
          () => {}
        );
        this.db.run(`ALTER TABLE photos ADD COLUMN landmark TEXT`, () => {});

        // Create indexes
        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON photos (trip_id)`
        );
        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_photos_coordinates ON photos (latitude, longitude)`
        );
        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos (taken_at)`
        );

        // Create users table
        this.db.run(`
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

        // Create user indexes
        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`
        );
        this.db.run(
          `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`
        );

        resolve();
      });
    });
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

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO trips (id, name, description, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          tripData.id,
          tripData.name,
          tripData.description,
          tripData.start_date,
          tripData.end_date,
          tripData.created_at,
          tripData.updated_at,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(tripData);
        }
      );

      stmt.finalize();
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM trips ORDER BY created_at DESC",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Trip[]);
        }
      );
    });
  }

  async getTripById(id: string): Promise<Trip | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM trips WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve((row as Trip) || null);
      });
    });
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

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE trips SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, now, id],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) resolve(null);
          else {
            // Fetch the updated trip
            database.getTripById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  async deleteTrip(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM trips WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // Helper method to enhance photo with location information
  private async enhancePhotoWithLocation(
    photoData: Partial<Photo>
  ): Promise<Partial<Photo>> {
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
    photo: Omit<Photo, "created_at" | "updated_at">
  ): Promise<Photo> {
    const now = new Date().toISOString();

    // Enhance photo data with location information if coordinates are provided
    const enhancedPhoto = await this.enhancePhotoWithLocation(photo);

    const photoData: Photo = {
      ...enhancedPhoto,
      created_at: now,
      updated_at: now,
    } as Photo;

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO photos (
          id, trip_id, filename, original_filename, title, description,
          latitude, longitude, altitude, location_name, city, state, country, country_code, landmark,
          taken_at, camera_make, camera_model,
          iso, aperture, shutter_speed, focal_length, file_size, mime_type,
          width, height, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
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
        ],
        function (err) {
          if (err) reject(err);
          else resolve(photoData);
        }
      );

      stmt.finalize();
    });
  }

  async getAllPhotos(): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Photo[]);
        }
      );
    });
  }

  async getPhotosByTripId(tripId: string): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM photos WHERE trip_id = ? ORDER BY taken_at DESC, created_at DESC",
        [tripId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Photo[]);
        }
      );
    });
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM photos WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve((row as Photo) || null);
      });
    });
  }

  async updatePhoto(
    id: string,
    updates: Partial<Omit<Photo, "id">>
  ): Promise<Photo | null> {
    const now = new Date().toISOString();

    // Enhance updates with location information if coordinates are being updated
    const enhancedUpdates = await this.enhancePhotoWithLocation(updates);

    const fields = Object.keys(enhancedUpdates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(enhancedUpdates);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE photos SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, now, id],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) resolve(null);
          else {
            // Fetch the updated photo
            database.getPhotoById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  async deletePhoto(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM photos WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async deletePhotos(
    ids: string[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    if (ids.length === 0) {
      return { successful: [], failed: [] };
    }

    const successful: string[] = [];
    const failed: string[] = [];

    // Use IN clause for bulk delete - more efficient
    const placeholders = ids.map(() => "?").join(",");
    const query = `DELETE FROM photos WHERE id IN (${placeholders})`;

    return new Promise((resolve, reject) => {
      this.db.run(query, ids, function (err) {
        if (err) {
          // If bulk delete fails, fall back to individual deletes
          reject(err);
        } else {
          // All provided IDs were attempted to be deleted
          // Since we can't easily determine which specific ones failed with IN clause,
          // we'll assume all were successful if no error occurred
          successful.push(...ids);
          resolve({ successful, failed });
        }
      });
    });
  }

  async getPhotosWithCoordinates(): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY taken_at DESC, created_at DESC",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Photo[]);
        }
      );
    });
  }

  // User methods
  async createUser(
    user: Omit<User, "created_at" | "updated_at">
  ): Promise<User> {
    const now = new Date().toISOString();
    const userWithTimestamps = { ...user, created_at: now, updated_at: now };

    return new Promise((resolve, reject) => {
      this.db.run(
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
        ],
        function (err) {
          if (err) reject(err);
          else resolve(userWithTimestamps);
        }
      );
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve((row as User) || null);
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve((row as User) || null);
        }
      );
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve((row as User) || null);
        }
      );
    });
  }

  async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve((row as User) || null);
        }
      );
    });
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

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
        values,
        function (err) {
          if (err) reject(err);
          else {
            // Get updated user
            database
              .getUserById(id)
              .then((user) => {
                if (user) resolve(user);
                else reject(new Error("User not found after update"));
              })
              .catch(reject);
          }
        }
      );
    });
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        [passwordHash, now, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM users ORDER BY created_at DESC",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as User[]);
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
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

  private async getPhotosWithCoordinatesButNoLocation(): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_name IS NULL",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Photo[]);
        }
      );
    });
  }

  // Public method to get photos that need location data
  async getPhotosNeedingLocationData(): Promise<Photo[]> {
    return this.getPhotosWithCoordinatesButNoLocation();
  }

  private async updatePhotoLocationInfo(
    id: string,
    locationInfo: LocationInfo
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
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
        ],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

export const database = new Database();
