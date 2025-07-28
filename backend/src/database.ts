import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  filename: string;
  original_filename: string;
  title?: string;
  description?: string;
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
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

class Database {
  private db: sqlite3.Database;
  
  constructor() {
    const dbPath = path.join(__dirname, '..', 'data', 'vacation_gallery.db');
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
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON photos (trip_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_coordinates ON photos (latitude, longitude)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos (taken_at)`);
        
        resolve();
      });
    });
  }

  // Trip methods
  async createTrip(trip: Omit<Trip, 'created_at' | 'updated_at'>): Promise<Trip> {
    const now = new Date().toISOString();
    const tripData: Trip = {
      ...trip,
      created_at: now,
      updated_at: now
    };

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO trips (id, name, description, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        tripData.id,
        tripData.name,
        tripData.description,
        tripData.start_date,
        tripData.end_date,
        tripData.created_at,
        tripData.updated_at
      ], function(err) {
        if (err) reject(err);
        else resolve(tripData);
      });
      
      stmt.finalize();
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM trips ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Trip[]);
      });
    });
  }

  async getTripById(id: string): Promise<Trip | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Trip || null);
      });
    });
  }

  async updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'created_at' | 'updated_at'>>): Promise<Trip | null> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE trips SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, now, id],
        function(err) {
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
      this.db.run('DELETE FROM trips WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // Photo methods
  async createPhoto(photo: Omit<Photo, 'created_at' | 'updated_at'>): Promise<Photo> {
    const now = new Date().toISOString();
    const photoData: Photo = {
      ...photo,
      created_at: now,
      updated_at: now
    };

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO photos (
          id, trip_id, filename, original_filename, title, description,
          latitude, longitude, altitude, taken_at, camera_make, camera_model,
          iso, aperture, shutter_speed, focal_length, file_size, mime_type,
          width, height, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        photoData.updated_at
      ], function(err) {
        if (err) reject(err);
        else resolve(photoData);
      });
      
      stmt.finalize();
    });
  }

  async getAllPhotos(): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Photo[]);
      });
    });
  }

  async getPhotosByTripId(tripId: string): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM photos WHERE trip_id = ? ORDER BY taken_at DESC, created_at DESC', [tripId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Photo[]);
      });
    });
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM photos WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Photo || null);
      });
    });
  }

  async updatePhoto(id: string, updates: Partial<Omit<Photo, 'id' | 'created_at' | 'updated_at'>>): Promise<Photo | null> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE photos SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, now, id],
        function(err) {
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
      this.db.run('DELETE FROM photos WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async getPhotosWithCoordinates(): Promise<Photo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY taken_at DESC, created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Photo[]);
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
}

export const database = new Database();
