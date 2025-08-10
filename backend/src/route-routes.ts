import express from "express";
import { v4 as uuidv4 } from "uuid";
import { database } from "./database";
import { openRouteService } from "./openroute-service";
import {
  CreateRouteRequestSchema,
  UpdateRouteRequestSchema,
  UpdateRouteStopSchema,
} from "../../common/src/types/request/create-route-request";
import type { Coordinate, RouteRequest } from "./openroute-service";

const router = express.Router();

// Get all routes for a trip
router.get("/trips/:tripId/routes", async (req, res) => {
  try {
    const routes = await database.getRoutesByTripId(req.params.tripId);
    res.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// Get a specific route with stops
router.get("/routes/:id", async (req, res) => {
  try {
    const route = await database.getRoute(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ error: "Failed to fetch route" });
  }
});

// Create a new route with stops
router.post("/routes", async (req, res) => {
  try {
    const { trip_id, title, description, profile, stops } =
      CreateRouteRequestSchema.parse(req.body);

    // Verify trip exists
    const trip = await database.getTripById(trip_id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Check if OpenRouteService is configured
    if (!openRouteService.isConfigured()) {
      return res.status(503).json({
        error:
          "Route generation service not configured. Please set OPENROUTE_API_KEY environment variable.",
      });
    }

    let routeData: any = {
      id: uuidv4(),
      trip_id,
      title,
      description,
      profile,
    };
    console.log("Got to here!")
    const createdRoute = await database.createRoute(routeData, stops);
    res.status(201).json(createdRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    if (error instanceof Error && error.message.includes("parse")) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      res.status(500).json({ error: "Failed to create route" });
    }
  }
});

// Update a route
router.put("/routes/:id", async (req, res) => {
  try {
    const updates = UpdateRouteRequestSchema.parse(req.body);

    const route = await database.updateRoute(req.params.id, updates);
    res.json(route);
  } catch (error) {
    console.error("Error updating route:", error);
    if (error instanceof Error && error.message.includes("parse")) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      res.status(500).json({ error: "Failed to update route" });
    }
  }
});

// Delete a route
router.delete("/routes/:id", async (req, res) => {
  try {
    const deleted = await database.deleteRoute(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ error: "Failed to delete route" });
  }
});

// Get route stops
router.get("/routes/:id/stops", async (req, res) => {
  try {
    const stops = await database.getRouteStops(req.params.id);
    res.json(stops);
  } catch (error) {
    console.error("Error fetching route stops:", error);
    res.status(500).json({ error: "Failed to fetch route stops" });
  }
});

// Create a new route stop
router.post("/routes/:routeId/stops", async (req, res) => {
  try {
    const routeStopData = {
      title: req.body.title,
      description: req.body.description || "",
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      order_index: req.body.order_index,
    };

    // Verify route exists
    const route = await database.getRouteById(req.params.routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    const updatedRoute = await database.createRouteStop(
      req.params.routeId,
      routeStopData
    );
    res.json(updatedRoute);
  } catch (error) {
    console.error("Error creating route stop:", error);
    res.status(500).json({ error: "Failed to create route stop" });
  }
});

// Update a route stop
router.put("/routes/:routeId/stops/:stopId", async (req, res) => {
  try {
    const updates = UpdateRouteStopSchema.parse(req.body);
    console.log("Updating stop with data:", updates);

    const updatedRoute = await database.updateRouteStop(
      req.params.stopId,
      updates
    );
    res.json(updatedRoute);
  } catch (error) {
    console.error("Error updating route stop:", error);
    if (error instanceof Error && error.message.includes("parse")) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      res.status(500).json({ error: "Failed to update route stop" });
    }
  }
});

// Delete a route stop
router.delete("/routes/:routeId/stops/:stopId", async (req, res) => {
  try {
    const updatedRoute = await database.deleteRouteStop(req.params.stopId);
    res.status(200).json(updatedRoute);
  } catch (error) {
    console.error("Error deleting route stop:", error);
    res.status(500).json({ error: "Failed to delete route stop" });
  }
});

export default router;
