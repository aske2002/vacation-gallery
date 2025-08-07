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
const openroute_service_1 = require("./openroute-service");
const create_route_request_1 = require("../../common/src/types/request/create-route-request");
const router = express_1.default.Router();
// Get all routes for a trip
router.get("/trips/:tripId/routes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const routes = yield database_1.database.getRoutesByTripId(req.params.tripId);
        res.json(routes);
    }
    catch (error) {
        console.error("Error fetching routes:", error);
        res.status(500).json({ error: "Failed to fetch routes" });
    }
}));
// Get a specific route with stops
router.get("/routes/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const route = yield database_1.database.getRouteWithStops(req.params.id);
        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }
        res.json(route);
    }
    catch (error) {
        console.error("Error fetching route:", error);
        res.status(500).json({ error: "Failed to fetch route" });
    }
}));
// Create a new route with stops
router.post("/routes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { trip_id, title, description, profile, stops } = create_route_request_1.CreateRouteRequestSchema.parse(req.body);
        // Verify trip exists
        const trip = yield database_1.database.getTripById(trip_id);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        // Check if OpenRouteService is configured
        if (!openroute_service_1.openRouteService.isConfigured()) {
            return res.status(503).json({
                error: "Route generation service not configured. Please set OPENROUTE_API_KEY environment variable.",
            });
        }
        let routeData = {
            id: (0, uuid_1.v4)(),
            trip_id,
            title,
            description,
            profile,
        };
        console.log("Got to here!");
        const createdRoute = yield database_1.database.createRoute(routeData, stops);
        res.status(201).json(createdRoute);
    }
    catch (error) {
        console.error("Error creating route:", error);
        if (error instanceof Error && error.message.includes("parse")) {
            res.status(400).json({ error: "Invalid request data" });
        }
        else {
            res.status(500).json({ error: "Failed to create route" });
        }
    }
}));
// Update a route
router.put("/routes/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = create_route_request_1.UpdateRouteRequestSchema.parse(req.body);
        const route = yield database_1.database.updateRoute(req.params.id, updates);
        res.json(route);
    }
    catch (error) {
        console.error("Error updating route:", error);
        if (error instanceof Error && error.message.includes("parse")) {
            res.status(400).json({ error: "Invalid request data" });
        }
        else {
            res.status(500).json({ error: "Failed to update route" });
        }
    }
}));
// Delete a route
router.delete("/routes/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield database_1.database.deleteRoute(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Route not found" });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting route:", error);
        res.status(500).json({ error: "Failed to delete route" });
    }
}));
// Get route stops
router.get("/routes/:id/stops", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stops = yield database_1.database.getRouteStops(req.params.id);
        res.json(stops);
    }
    catch (error) {
        console.error("Error fetching route stops:", error);
        res.status(500).json({ error: "Failed to fetch route stops" });
    }
}));
// Create a new route stop
router.post("/routes/:routeId/stops", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const routeStopData = {
            title: req.body.title,
            description: req.body.description || "",
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            order_index: req.body.order_index,
        };
        // Verify route exists
        const route = yield database_1.database.getRouteById(req.params.routeId);
        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }
        const updatedRoute = yield database_1.database.createRouteStop(req.params.routeId, routeStopData);
        res.json(updatedRoute);
    }
    catch (error) {
        console.error("Error creating route stop:", error);
        res.status(500).json({ error: "Failed to create route stop" });
    }
}));
// Update a route stop
router.put("/routes/:routeId/stops/:stopId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = create_route_request_1.UpdateRouteStopSchema.parse(req.body);
        const updatedRoute = yield database_1.database.updateRouteStop(req.params.stopId, updates);
        res.json(updatedRoute);
    }
    catch (error) {
        console.error("Error updating route stop:", error);
        if (error instanceof Error && error.message.includes("parse")) {
            res.status(400).json({ error: "Invalid request data" });
        }
        else {
            res.status(500).json({ error: "Failed to update route stop" });
        }
    }
}));
// Delete a route stop
router.delete("/routes/:routeId/stops/:stopId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedRoute = yield database_1.database.deleteRouteStop(req.params.stopId);
        res.status(200).json(updatedRoute);
    }
    catch (error) {
        console.error("Error deleting route stop:", error);
        res.status(500).json({ error: "Failed to delete route stop" });
    }
}));
exports.default = router;
