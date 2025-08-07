import express from 'express';
import { openRouteService } from './openroute-service';
import type { 
  RouteRequest, 
  DirectionsRequest, 
  IsochroneRequest, 
  MatrixRequest,
  Coordinate 
} from './openroute-service';

const router = express.Router();

// Health check for OpenRouteService
router.get('/health', (req, res) => {
  const isConfigured = openRouteService.isConfigured();
  res.json({
    service: 'OpenRouteService',
    configured: isConfigured,
    message: isConfigured ? 'Service ready' : 'API key not configured'
  });
});

// Get directions between multiple points
router.post('/directions', async (req, res) => {
  try {
    const request: RouteRequest = req.body;
    
    if (!request.coordinates || request.coordinates.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 coordinates are required' 
      });
    }

    // Validate coordinates
    for (const coord of request.coordinates) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.getDirections(request);
    res.json(result);
  } catch (error) {
    console.error('Directions error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get simple directions between two points
router.post('/directions/simple', async (req, res) => {
  try {
    const request: DirectionsRequest = req.body;
    
    if (!request.start || !request.end) {
      return res.status(400).json({ 
        error: 'Both start and end coordinates are required' 
      });
    }

    // Validate coordinates
    const coords = [request.start, request.end];
    for (const coord of coords) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.getSimpleDirections(request);
    res.json(result);
  } catch (error) {
    console.error('Simple directions error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get isochrones (travel time/distance areas)
router.post('/isochrones', async (req, res) => {
  try {
    const request: IsochroneRequest = req.body;
    
    if (!request.locations || request.locations.length === 0) {
      return res.status(400).json({ 
        error: 'At least one location is required' 
      });
    }

    if (!request.range || request.range.length === 0) {
      return res.status(400).json({ 
        error: 'Range values are required' 
      });
    }

    // Validate coordinates
    for (const coord of request.locations) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.getIsochrones(request);
    res.json(result);
  } catch (error) {
    console.error('Isochrones error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get distance/time matrix
router.post('/matrix', async (req, res) => {
  try {
    const request: MatrixRequest = req.body;
    
    if (!request.locations || request.locations.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 locations are required' 
      });
    }

    // Validate coordinates
    for (const coord of request.locations) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.getMatrix(request);
    res.json(result);
  } catch (error) {
    console.error('Matrix error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Optimize route order
router.post('/optimize', async (req, res) => {
  try {
    const { coordinates, profile } = req.body;
    
    if (!coordinates || coordinates.length < 3) {
      return res.status(400).json({ 
        error: 'At least 3 coordinates are required for route optimization' 
      });
    }

    // Validate coordinates
    for (const coord of coordinates) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.optimizeRoute(coordinates, profile);
    res.json(result);
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get travel time between two points
router.post('/travel-time', async (req, res) => {
  try {
    const { start, end, profile } = req.body;
    
    if (!start || !end) {
      return res.status(400).json({ 
        error: 'Both start and end coordinates are required' 
      });
    }

    // Validate coordinates
    const coords = [start, end];
    for (const coord of coords) {
      if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid coordinate format. Expected { latitude: number, longitude: number }' 
        });
      }
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        return res.status(400).json({ 
          error: 'Coordinates out of valid range' 
        });
      }
    }

    const result = await openRouteService.getTravelTime(start, end, profile);
    res.json(result);
  } catch (error) {
    console.error('Travel time error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get available profiles
router.get('/profiles', (req, res) => {
  const profiles = [
    'driving-car',
    'driving-hgv',
    'cycling-regular',
    'cycling-road', 
    'cycling-mountain',
    'cycling-electric',
    'foot-walking',
    'foot-hiking',
    'wheelchair'
  ];
  
  res.json({ profiles });
});

export default router;
