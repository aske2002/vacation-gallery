import express from "express";
import { v4 as uuidv4 } from "uuid";
import { database } from "..";
import { CreateTripRequestSchema } from "vacation-gallery-common";

const router = express.Router();

// Get all trips
router.get("/trips", async (req, res) => {
  try {
    const trips = await database.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// Get a specific trip
router.get("/trips/:id", async (req, res) => {
  try {
    const trip = await database.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

// Create a new trip
router.post("/trips", async (req, res) => {
  try {
    const { name, description, start_date, end_date } =
      CreateTripRequestSchema.parse(req.body);

    if (!name) {
      return res.status(400).json({ error: "Trip name is required" });
    }

    const trip = await database.createTrip({
      id: uuidv4(),
      name,
      description,
      start_date,
      end_date,
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

// Update a trip
router.put("/trips/:id", async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    const trip = await database.updateTrip(req.params.id, {
      name,
      description,
      start_date,
      end_date,
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ error: "Failed to update trip" });
  }
});

// Delete a trip
router.delete("/trips/:id", async (req, res) => {
  try {
    const deleted = await database.deleteTrip(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

// Get photos for a specific trip
router.get("/trips/:id/photos", async (req, res) => {
  try {
    const trip = await database.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const photos = await database.getPhotosByTripId(req.params.id);
    res.json(photos);
  } catch (error) {
    console.error("Error fetching trip photos:", error);
    res.status(500).json({ error: "Failed to fetch trip photos" });
  }
});

// Get routes for a specific trip
router.get("/trips/:id/routes", async (req, res) => {
  try {
    const trip = await database.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const routes = await database.getRoutesByTripId(req.params.id);
    res.json(routes);
  } catch (error) {
    console.error("Error fetching trip routes:", error);
    res.status(500).json({ error: "Failed to fetch trip routes" });
  }
});

export default router;
