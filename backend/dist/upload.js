"use strict";
// This file has been replaced by the new photo-routes.ts and trip-routes.ts
// The new API provides comprehensive photo management with trip organization,
// EXIF data extraction, database storage, and proper file management.
//
// See:
// - photo-routes.ts for photo upload and management
// - trip-routes.ts for trip management
// - API.md for complete documentation
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Legacy endpoint - redirects to new API documentation
router.get('/upload-info', (req, res) => {
    res.status(410).json({
        error: 'This endpoint has been replaced',
        message: 'Please use the new API endpoints. See API.md for documentation.',
        new_endpoints: {
            trips: '/api/trips',
            photos: '/api/photos',
            upload: 'POST /api/trips/:tripId/photos'
        }
    });
});
exports.default = router;
