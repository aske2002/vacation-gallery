import express from "express";

const router = express.Router();

// Get all trips
router.get("/info", async (req, res) => {
  try {
    const info = await fetch(
      "https://services.inflightpanasonic.aero/inflight/services/flightdata/v2/flightdata",
      {
        headers: {
          accept: "*/*",
          "accept-language":
            "da-DK,da;q=0.9,en-DK;q=0.8,en;q=0.7,en-US;q=0.6,de;q=0.5",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua":
            '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "host": "services.inflightpanasonic.aero",
          "origin": "https://www.lufthansa-flynet.com",
          Referer: "https://www.lufthansa-flynet.com/",
        },
        body: null,
        method: "GET",
      }
    );
    const data = await info.json()
    res.json(data);
  } catch (error) {
    console.error("Error fetching flight info:", error);
    res.status(500).json({ error: "Failed to flight info" });
  }
});

export default router;
