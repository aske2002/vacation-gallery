"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractExifData = extractExifData;
const exifr_1 = __importDefault(require("exifr"));
async function extractExifData(buffer) {
    try {
        const exif = await exifr_1.default.parse(buffer);
        console.log(exif);
        const result = {};
        // GPS coordinates
        if ((exif === null || exif === void 0 ? void 0 : exif.latitude) && (exif === null || exif === void 0 ? void 0 : exif.longitude)) {
            result.latitude = exif.latitude;
            result.longitude = exif.longitude;
        }
        if (exif === null || exif === void 0 ? void 0 : exif.altitude) {
            result.altitude = exif.altitude;
        }
        // Date taken
        if (exif === null || exif === void 0 ? void 0 : exif.DateTimeOriginal) {
            result.taken_at = new Date(exif.DateTimeOriginal).toISOString();
        }
        else if (exif === null || exif === void 0 ? void 0 : exif.DateTime) {
            result.taken_at = new Date(exif.DateTime).toISOString();
        }
        // Camera infox
        if (exif === null || exif === void 0 ? void 0 : exif.Make) {
            result.camera_make = exif.Make.toString().trim();
        }
        if (exif === null || exif === void 0 ? void 0 : exif.Model) {
            result.camera_model = exif.Model.toString().trim();
        }
        // Technical details
        if (exif === null || exif === void 0 ? void 0 : exif.ISO) {
            result.iso = parseInt(exif.ISO.toString());
        }
        if (exif === null || exif === void 0 ? void 0 : exif.FNumber) {
            result.aperture = `f/${exif.FNumber}`;
        }
        if (exif === null || exif === void 0 ? void 0 : exif.ExposureTime) {
            const exposureTime = parseFloat(exif.ExposureTime.toString());
            if (exposureTime < 1) {
                result.shutter_speed = `1/${Math.round(1 / exposureTime)}`;
            }
            else {
                result.shutter_speed = `${exposureTime}s`;
            }
        }
        if (exif === null || exif === void 0 ? void 0 : exif.FocalLength) {
            result.focal_length = parseFloat(exif.FocalLength.toString());
        }
        return result;
    }
    catch (error) {
        console.warn('Failed to extract EXIF data:', error);
        return {};
    }
}
//# sourceMappingURL=exif.js.map