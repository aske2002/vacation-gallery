"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
class Database {
    constructor() {
        const dbPath = path_1.default.join(__dirname, '..', 'data', 'vacation_gallery.db');
        this.db = new sqlite3_1.default.Database(dbPath);
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
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
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`);
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
                    resolve();
                });
            });
        });
    }
    // Trip methods
    createTrip(trip) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const tripData = Object.assign(Object.assign({}, trip), { created_at: now, updated_at: now });
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
                ], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(tripData);
                });
                stmt.finalize();
            });
        });
    }
    getAllTrips() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM trips ORDER BY created_at DESC', (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    getTripById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    updateTrip(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE trips SET ${fields}, updated_at = ? WHERE id = ?`, [...values, now, id], function (err) {
                    if (err)
                        reject(err);
                    else if (this.changes === 0)
                        resolve(null);
                    else {
                        // Fetch the updated trip
                        exports.database.getTripById(id).then(resolve).catch(reject);
                    }
                });
            });
        });
    }
    deleteTrip(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM trips WHERE id = ?', [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    // Photo methods
    createPhoto(photo) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const photoData = Object.assign(Object.assign({}, photo), { created_at: now, updated_at: now });
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
                ], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(photoData);
                });
                stmt.finalize();
            });
        });
    }
    getAllPhotos() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC', (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    getPhotosByTripId(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM photos WHERE trip_id = ? ORDER BY taken_at DESC, created_at DESC', [tripId], (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    getPhotoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM photos WHERE id = ?', [id], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    updatePhoto(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE photos SET ${fields}, updated_at = ? WHERE id = ?`, [...values, now, id], function (err) {
                    if (err)
                        reject(err);
                    else if (this.changes === 0)
                        resolve(null);
                    else {
                        // Fetch the updated photo
                        exports.database.getPhotoById(id).then(resolve).catch(reject);
                    }
                });
            });
        });
    }
    deletePhoto(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM photos WHERE id = ?', [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    getPhotosWithCoordinates() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY taken_at DESC, created_at DESC', (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    // User methods
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const userWithTimestamps = Object.assign(Object.assign({}, user), { created_at: now, updated_at: now });
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [user.id, user.username, user.email, user.password_hash, user.role, now, now], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(userWithTimestamps);
                });
            });
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    getUserByUsernameOrEmail(username, email) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const fields = [];
            const values = [];
            if (updates.username !== undefined) {
                fields.push('username = ?');
                values.push(updates.username);
            }
            if (updates.email !== undefined) {
                fields.push('email = ?');
                values.push(updates.email);
            }
            fields.push('updated_at = ?');
            values.push(now);
            values.push(id);
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
                    if (err)
                        reject(err);
                    else {
                        // Get updated user
                        exports.database.getUserById(id).then((user) => {
                            if (user)
                                resolve(user);
                            else
                                reject(new Error('User not found after update'));
                        }).catch(reject);
                    }
                });
            });
        });
    }
    updateUserPassword(id, passwordHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            return new Promise((resolve, reject) => {
                this.db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
}
exports.database = new Database();
