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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const trip_routes_1 = __importDefault(require("./trip-routes"));
const photo_routes_1 = __importDefault(require("./photo-routes"));
const auth_routes_1 = __importDefault(require("./auth-routes"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = 1798;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check endpoint
app.get("/api/health", (_req, res) => {
    res.json({
        message: "Vacation Gallery API is running!",
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api", trip_routes_1.default);
app.use("/api", photo_routes_1.default);
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size too large' });
    }
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use('*route', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down gracefully...');
    try {
        yield database_1.database.close();
        console.log('Database connection closed.');
    }
    catch (error) {
        console.error('Error closing database:', error);
    }
    process.exit(0);
}));
app.listen(PORT, () => {
    console.log(`🚀 Vacation Gallery API running at http://localhost:${PORT}`);
    console.log(`📸 Upload photos to trips via POST /api/trips/:tripId/photos`);
    console.log(`🗺️  View all photos with coordinates at GET /api/photos/with-coordinates`);
    console.log(`🧳 Manage trips via /api/trips endpoints`);
});
