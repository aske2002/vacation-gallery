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
const uuid_1 = require("uuid");
const database_1 = require("./database");
const create_trip_request_1 = require("../../common/src/types/request/create-trip-request");
const router = express_1.default.Router();
// Get all trips
router.get("/trips", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trips = yield database_1.database.getAllTrips();
        res.json(trips);
    }
    catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ error: "Failed to fetch trips" });
    }
}));
// Get a specific trip
router.get("/trips/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trip = yield database_1.database.getTripById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        res.json(trip);
    }
    catch (error) {
        console.error("Error fetching trip:", error);
        res.status(500).json({ error: "Failed to fetch trip" });
    }
}));
// Create a new trip
router.post("/trips", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, start_date, end_date } = create_trip_request_1.CreateTripRequestSchema.parse(req.body);
        if (!name) {
            return res.status(400).json({ error: "Trip name is required" });
        }
        const trip = yield database_1.database.createTrip({
            id: (0, uuid_1.v4)(),
            name,
            description,
            start_date,
            end_date,
        });
        res.status(201).json(trip);
    }
    catch (error) {
        console.error("Error creating trip:", error);
        res.status(500).json({ error: "Failed to create trip" });
    }
}));
// Update a trip
router.put("/trips/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, start_date, end_date } = req.body;
        const trip = yield database_1.database.updateTrip(req.params.id, {
            name,
            description,
            start_date,
            end_date,
        });
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        res.json(trip);
    }
    catch (error) {
        console.error("Error updating trip:", error);
        res.status(500).json({ error: "Failed to update trip" });
    }
}));
// Delete a trip
router.delete("/trips/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield database_1.database.deleteTrip(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Trip not found" });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: "Failed to delete trip" });
    }
}));
// Get photos for a specific trip
router.get("/trips/:id/photos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trip = yield database_1.database.getTripById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        const photos = yield database_1.database.getPhotosByTripId(req.params.id);
        res.json(photos);
    }
    catch (error) {
        console.error("Error fetching trip photos:", error);
        res.status(500).json({ error: "Failed to fetch trip photos" });
    }
}));
// Get routes for a specific trip
router.get("/trips/:id/routes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trip = yield database_1.database.getTripById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        const routes = yield database_1.database.getRoutesByTripId(req.params.id);
        res.json(routes);
    }
    catch (error) {
        console.error("Error fetching trip routes:", error);
        res.status(500).json({ error: "Failed to fetch trip routes" });
    }
}));
exports.default = router;
