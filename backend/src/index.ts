import express from "express";
import cors from "cors";
import path from "path";
import tripRoutes from "./trip-routes";
import photoRoutes from "./photo-routes";
import authRoutes from "./auth-routes";
import openrouteRoutes from "./openroute-routes";
import routeRoutes from "./route-routes";
import { database } from "./database";
import { configDotenv } from "dotenv";

configDotenv({
  path: path.resolve(__dirname, "../.env"),
})

const app = express();
const PORT = 1798;

app.on("error", (err) => {
  console.error("Server error:", err);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    message: "Vacation Gallery API is running!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api", tripRoutes);
app.use("/api", photoRoutes);
app.use("/api", routeRoutes);
app.use("/api/openroute", openrouteRoutes);

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File size too large" });
    }

    if (error.message.includes("Invalid file type")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use("*route", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    await database.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database:", error);
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Vacation Gallery API running at http://localhost:${PORT}`);
  console.log(`📸 Upload photos to trips via POST /api/trips/:tripId/photos`);
  console.log(
    `🗺️  View all photos with coordinates at GET /api/photos/with-coordinates`
  );
  console.log(`🧳 Manage trips via /api/trips endpoints`);
});
