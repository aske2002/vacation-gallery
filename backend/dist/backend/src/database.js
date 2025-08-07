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
const uuid_1 = require("uuid");
const geocoding_service_1 = require("./geocoding-service");
const openroute_service_1 = require("./openroute-service");
class Database {
    constructor() {
        const dbPath = path_1.default.join(__dirname, "..", "data", "vacation_gallery.db");
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
                    this.db.run(`ALTER TABLE photos ADD COLUMN location_name TEXT`, () => { });
                    this.db.run(`ALTER TABLE photos ADD COLUMN city TEXT`, () => { });
                    this.db.run(`ALTER TABLE photos ADD COLUMN state TEXT`, () => { });
                    this.db.run(`ALTER TABLE photos ADD COLUMN country TEXT`, () => { });
                    this.db.run(`ALTER TABLE photos ADD COLUMN country_code TEXT`, () => { });
                    this.db.run(`ALTER TABLE photos ADD COLUMN landmark TEXT`, () => { });
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
                    // Create routes table
                    this.db.run(`
          CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            trip_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            profile TEXT NOT NULL DEFAULT 'driving-car',
            total_distance INTEGER,
            total_duration INTEGER,
            geometry TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
          )
        `);
                    // Create route_stops table
                    this.db.run(`
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
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`);
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
                    // Create route indexes
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_routes_trip_id ON routes (trip_id)`);
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops (route_id)`);
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops (route_id, order_index)`);
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
                    tripData.updated_at,
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
                this.db.all("SELECT * FROM trips ORDER BY created_at DESC", (err, rows) => {
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
                this.db.get("SELECT * FROM trips WHERE id = ?", [id], (err, row) => {
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
            const fields = Object.keys(updates)
                .map((key) => `${key} = ?`)
                .join(", ");
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
                this.db.run("DELETE FROM trips WHERE id = ?", [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    // Helper method to enhance photo with location information
    enhancePhotoWithLocation(photoData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only geocode if coordinates are provided and location info is missing
            if (photoData.latitude && photoData.longitude && !photoData.location_name) {
                try {
                    console.log(`Extracting location for coordinates: ${photoData.latitude}, ${photoData.longitude}`);
                    const locationInfo = yield geocoding_service_1.geocodingService.reverseGeocode(photoData.latitude, photoData.longitude);
                    if (locationInfo) {
                        return Object.assign(Object.assign({}, photoData), { location_name: locationInfo.location_name, city: locationInfo.city, state: locationInfo.state, country: locationInfo.country, country_code: locationInfo.country_code, landmark: locationInfo.landmark });
                    }
                }
                catch (error) {
                    console.error("Failed to extract location information:", error);
                    // Continue without location info rather than failing the entire operation
                }
            }
            return photoData;
        });
    }
    // Photo methods
    createPhoto(photo) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            // Enhance photo data with location information if coordinates are provided
            const enhancedPhoto = yield this.enhancePhotoWithLocation(photo);
            const photoData = Object.assign(Object.assign({}, enhancedPhoto), { created_at: now, updated_at: now });
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
                this.db.all("SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC", (err, rows) => {
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
                this.db.all("SELECT * FROM photos WHERE trip_id = ? ORDER BY taken_at DESC, created_at DESC", [tripId], (err, rows) => {
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
                this.db.get("SELECT * FROM photos WHERE id = ?", [id], (err, row) => {
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
            // Enhance updates with location information if coordinates are being updated
            const enhancedUpdates = yield this.enhancePhotoWithLocation(updates);
            const fields = Object.keys(enhancedUpdates)
                .map((key) => `${key} = ?`)
                .join(", ");
            const values = Object.values(enhancedUpdates);
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
                this.db.run("DELETE FROM photos WHERE id = ?", [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    deletePhotos(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ids.length === 0) {
                return { successful: [], failed: [] };
            }
            const successful = [];
            const failed = [];
            // Use IN clause for bulk delete - more efficient
            const placeholders = ids.map(() => "?").join(",");
            const query = `DELETE FROM photos WHERE id IN (${placeholders})`;
            return new Promise((resolve, reject) => {
                this.db.run(query, ids, function (err) {
                    if (err) {
                        // If bulk delete fails, fall back to individual deletes
                        reject(err);
                    }
                    else {
                        // All provided IDs were attempted to be deleted
                        // Since we can't easily determine which specific ones failed with IN clause,
                        // we'll assume all were successful if no error occurred
                        successful.push(...ids);
                        resolve({ successful, failed });
                    }
                });
            });
        });
    }
    getPhotosWithCoordinates() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY taken_at DESC, created_at DESC", (err, rows) => {
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
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    user.id,
                    user.username,
                    user.email,
                    user.password_hash,
                    user.role,
                    now,
                    now,
                ], function (err) {
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
                this.db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
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
                this.db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
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
                this.db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
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
                this.db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], (err, row) => {
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
                this.db.run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values, function (err) {
                    if (err)
                        reject(err);
                    else {
                        // Get updated user
                        exports.database
                            .getUserById(id)
                            .then((user) => {
                            if (user)
                                resolve(user);
                            else
                                reject(new Error("User not found after update"));
                        })
                            .catch(reject);
                    }
                });
            });
        });
    }
    updateUserPassword(id, passwordHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            return new Promise((resolve, reject) => {
                this.db.run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [passwordHash, now, id], function (err) {
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
                this.db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
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
                this.db.all("SELECT * FROM users ORDER BY created_at DESC", (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    // Route methods
    createRoute(route, stops) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const routeData = Object.assign(Object.assign({}, route), { created_at: now, updated_at: now });
            yield new Promise((resolve, reject) => {
                this.db.serialize(() => {
                    this.db.run("BEGIN TRANSACTION");
                    // Insert route
                    const routeStmt = this.db.prepare(`
          INSERT INTO routes (id, trip_id, title, description, profile, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                    routeStmt.run([
                        routeData.id,
                        routeData.trip_id,
                        routeData.title,
                        routeData.description,
                        routeData.profile,
                        routeData.created_at,
                        routeData.updated_at,
                    ], (err) => __awaiter(this, void 0, void 0, function* () {
                        console.log("Got here 4");
                        if (err) {
                            this.db.run("ROLLBACK");
                            console.log("Error inserting route:", err);
                            return reject(err);
                        }
                        console.log("Got here 5");
                        return this.db.run("COMMIT", (err) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                console.log("Error committing transaction:", err);
                                this.db.run("ROLLBACK");
                                return reject(err);
                            }
                            resolve(void 0);
                        }));
                    }));
                    routeStmt.finalize();
                });
            });
            console.log("Got here 6");
            for (const routeStop of stops) {
                yield exports.database.createRouteStop(routeData.id, routeStop);
            }
            return yield exports.database.getRouteWithStops(routeData.id);
        });
    }
    getAllRoutes() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM routes ORDER BY created_at DESC", (err, rows) => {
                    if (err)
                        reject(err);
                    else {
                        const routes = rows.map((row) => (Object.assign(Object.assign({}, row), { geometry: row.geometry ? JSON.parse(row.geometry) : null })));
                        resolve(routes);
                    }
                });
            });
        });
    }
    getRoutesByTripId(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM routes WHERE trip_id = ? ORDER BY created_at DESC", [tripId], (err, rows) => {
                    if (err)
                        reject(err);
                    else {
                        const routes = rows.map((row) => (Object.assign(Object.assign({}, row), { geometry: row.geometry ? JSON.parse(row.geometry) : null })));
                        resolve(routes);
                    }
                });
            });
        });
    }
    getRouteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get("SELECT * FROM routes WHERE id = ?", [id], (err, row) => {
                    if (err)
                        reject(err);
                    else if (!row)
                        resolve(null);
                    else {
                        const route = Object.assign(Object.assign({}, row), { geometry: row.geometry ? JSON.parse(row.geometry) : null });
                        resolve(route);
                    }
                });
            });
        });
    }
    getRouteWithStops(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get("SELECT * FROM routes WHERE id = ?", [id], (err, routeRow) => {
                    if (err)
                        reject(err);
                    else if (!routeRow)
                        reject(new Error(`Route with ID ${id} not found`));
                    else {
                        // Get stops for this route
                        this.db.all("SELECT * FROM route_stops WHERE route_id = ? ORDER BY order_index", [id], (err, stopRows) => {
                            if (err)
                                reject(err);
                            else {
                                const route = Object.assign(Object.assign({}, routeRow), { geometry: routeRow.geometry
                                        ? JSON.parse(routeRow.geometry)
                                        : null, stops: stopRows });
                                resolve(route);
                            }
                        });
                    }
                });
            });
        });
    }
    updateRoute(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const routeWithStops = yield this.getRouteWithStops(id);
            console.log("Updating route with stops:", routeWithStops);
            if (!routeWithStops) {
                throw new Error(`Route with ID ${id} not found`);
            }
            const updated = Object.assign(Object.assign({}, routeWithStops), updates);
            if (!updated) {
                throw new Error(`Route with ID ${id} not found`);
            }
            console.log("Got here 1", updated);
            const route = yield this.getRouteDirections(updated);
            updated.geometry = route === null || route === void 0 ? void 0 : route.geometry;
            updated.total_distance = route === null || route === void 0 ? void 0 : route.summary.distance;
            updated.total_duration = route === null || route === void 0 ? void 0 : route.summary.duration;
            updated.updated_at = new Date().toISOString();
            console.log("Got here 2", updated);
            const fields = Object.keys(updates || {}).map((key) => `${key} = ?`);
            const values = Object.entries(updates || {}).map(([, value]) => value || null);
            console.log("Got here 3", fields, values, id);
            if (fields.length > 0) {
                yield new Promise((resolve, reject) => {
                    this.db.run(`UPDATE routes SET ${fields.join(", ")} WHERE id = ?`, [...values, id], function (err) {
                        console.log("Got here 4", err);
                        if (err)
                            reject(err);
                        else if (this.changes === 0)
                            resolve(null);
                        else {
                            exports.database.getRouteById(id).then(resolve).catch(reject);
                        }
                    });
                });
            }
            return updated;
        });
    }
    getRouteDirections(route) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!openroute_service_1.openRouteService.isConfigured()) {
                throw new Error("OpenRouteService API key not configured");
            }
            if (route.stops.length < 2) {
                return null;
            }
            const coordinates = route.stops
                .sort((a, b) => a.order_index - b.order_index)
                .map((stop) => ({
                latitude: stop.latitude,
                longitude: stop.longitude,
            }));
            const routeRequest = {
                coordinates,
                profile: route.profile,
                geometry: true,
                instructions: false,
            };
            const routeResponse = yield openroute_service_1.openRouteService.getDirections(routeRequest);
            if (routeResponse.routes && routeResponse.routes.length > 0) {
                const routeInfo = routeResponse.routes[0];
                if (!routeInfo) {
                    throw new Error("No route found in the response");
                }
                return routeInfo;
            }
            else {
                throw new Error("No route found for the given coordinates");
            }
        });
    }
    deleteRoute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run("DELETE FROM routes WHERE id = ?", [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.changes > 0);
                });
            });
        });
    }
    getRouteStops(routeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM route_stops WHERE route_id = ? ORDER BY order_index", [routeId], (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    createRouteStop(routeId, stopData) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().toISOString();
            const stopId = (0, uuid_1.v4)();
            console.log("Got here 7");
            // Enhance stop with location information if needed
            let enhancedStopData = Object.assign({}, stopData);
            if (!stopData.location_name && stopData.latitude && stopData.longitude) {
                try {
                    const locationInfo = yield geocoding_service_1.geocodingService.reverseGeocode(stopData.latitude, stopData.longitude);
                    console.log("Got here 8");
                    if (locationInfo) {
                        enhancedStopData = Object.assign(Object.assign({}, stopData), { location_name: locationInfo.location_name, city: locationInfo.city, state: locationInfo.state, country: locationInfo.country, country_code: locationInfo.country_code });
                    }
                }
                catch (error) {
                    console.error("Failed to extract location information for stop:", error);
                }
            }
            console.log("Got here 9");
            const finalStopData = Object.assign(Object.assign({ id: stopId, route_id: routeId }, enhancedStopData), { created_at: now, updated_at: now });
            console.log("Got here 10");
            yield new Promise((resolve, reject) => {
                const stmt = this.db.prepare(`
        INSERT INTO route_stops (id, route_id, title, description, latitude, longitude, order_index, location_name, city, state, country, country_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
                stmt.run([
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
                ], function (err) {
                    console.log("Got here 11", err);
                    if (err)
                        reject(err);
                    else
                        resolve(finalStopData);
                });
                stmt.finalize();
            });
            return yield this.updateRoute(routeId);
        });
    }
    updateRouteStop(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const now = new Date().toISOString();
            // Enhance updates with location information if coordinates are being updated
            let enhancedUpdates = Object.assign({}, updates);
            if ((updates.latitude || updates.longitude) && !updates.location_name) {
                try {
                    const currentStop = yield this.getRouteStopById(id);
                    if (currentStop) {
                        const lat = (_a = updates.latitude) !== null && _a !== void 0 ? _a : currentStop.latitude;
                        const lng = (_b = updates.longitude) !== null && _b !== void 0 ? _b : currentStop.longitude;
                        const locationInfo = yield geocoding_service_1.geocodingService.reverseGeocode(lat, lng);
                        if (locationInfo) {
                            enhancedUpdates = Object.assign(Object.assign({}, updates), { location_name: locationInfo.location_name, city: locationInfo.city, state: locationInfo.state, country: locationInfo.country, country_code: locationInfo.country_code });
                        }
                    }
                }
                catch (error) {
                    console.error("Failed to extract location information for route stop:", error);
                }
            }
            const fields = Object.keys(enhancedUpdates)
                .map((key) => `${key} = ?`)
                .join(", ");
            const values = Object.values(enhancedUpdates);
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE route_stops SET ${fields}, updated_at = ? WHERE id = ?`, [...values, now, id], function (err) {
                    if (err)
                        reject(err);
                    else if (this.changes === 0)
                        exports.database.getRouteWithStops(id).then(resolve).catch(reject);
                    else {
                        exports.database.updateRoute(id).then(resolve).catch(reject);
                    }
                });
            });
        });
    }
    getRouteStopById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get("SELECT * FROM route_stops WHERE id = ?", [id], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row || null);
                });
            });
        });
    }
    deleteRouteStop(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run("DELETE FROM route_stops WHERE id = ?", [id], function (err) {
                    if (err)
                        reject(err);
                    else
                        exports.database.updateRoute(id).then(resolve).catch(reject);
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
    // Method to backfill location information for existing photos
    backfillLocationData() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Starting location data backfill...");
            const photosWithCoords = yield this.getPhotosWithCoordinatesButNoLocation();
            const stats = { processed: 0, updated: 0, errors: 0 };
            for (const photo of photosWithCoords) {
                try {
                    stats.processed++;
                    console.log(`Processing photo ${photo.id} (${stats.processed}/${photosWithCoords.length})`);
                    const locationInfo = yield geocoding_service_1.geocodingService.reverseGeocode(photo.latitude, photo.longitude);
                    if (locationInfo) {
                        yield this.updatePhotoLocationInfo(photo.id, locationInfo);
                        stats.updated++;
                        console.log(`Updated location for photo ${photo.id}`);
                    }
                    // Add a delay to respect rate limits
                    yield new Promise((resolve) => setTimeout(resolve, 1100)); // 1.1 second delay
                }
                catch (error) {
                    stats.errors++;
                    console.error(`Error processing photo ${photo.id}:`, error);
                }
            }
            console.log("Location data backfill completed:", stats);
            return stats;
        });
    }
    getPhotosWithCoordinatesButNoLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_name IS NULL", (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows);
                });
            });
        });
    }
    // Public method to get photos that need location data
    getPhotosNeedingLocationData() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getPhotosWithCoordinatesButNoLocation();
        });
    }
    updatePhotoLocationInfo(id, locationInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const now = new Date().toISOString();
                this.db.run(`UPDATE photos SET 
         location_name = ?, city = ?, state = ?, country = ?, country_code = ?, landmark = ?, updated_at = ?
         WHERE id = ?`, [
                    locationInfo.location_name,
                    locationInfo.city,
                    locationInfo.state,
                    locationInfo.country,
                    locationInfo.country_code,
                    locationInfo.landmark,
                    now,
                    id,
                ], function (err) {
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
