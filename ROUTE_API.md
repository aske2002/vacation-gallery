# Route Management API

This document describes the new route management functionality for the Vacation Gallery application.

## Overview

The route system allows you to create planned routes for your trips with multiple stops. Each route can have a title, description, and uses the OpenRouteService to generate optimal paths between stops.

## API Endpoints

### Create a Route

**POST** `/api/routes`

Creates a new route with multiple stops and automatically generates the path using OpenRouteService.

```json
{
  "trip_id": "uuid-of-trip",
  "title": "Day 1: City Tour",
  "description": "A walking tour of the historic city center",
  "profile": "foot-walking",
  "optimized": false,
  "stops": [
    {
      "title": "Hotel",
      "description": "Starting point - our accommodation",
      "latitude": 52.3676,
      "longitude": 4.9041,
      "order_index": 0
    },
    {
      "title": "Anne Frank House",
      "description": "Historic museum and biography",
      "latitude": 52.3752,
      "longitude": 4.8840,
      "order_index": 1
    },
    {
      "title": "Vondelpark",
      "description": "Beautiful city park for lunch break",
      "latitude": 52.3579,
      "longitude": 4.8686,
      "order_index": 2
    }
  ]
}
```

### Get Routes for a Trip

**GET** `/api/trips/{tripId}/routes`

Returns all routes associated with a specific trip.

### Get Route Details

**GET** `/api/routes/{routeId}`

Returns detailed information about a route including all stops and generated path.

### Update Route

**PUT** `/api/routes/{routeId}`

Update route details. If profile or optimization settings change, the path will be automatically regenerated.

```json
{
  "title": "Updated Route Title",
  "description": "Updated description",
  "profile": "cycling-regular",
  "optimized": true
}
```

### Update Route Stop

**PUT** `/api/routes/{routeId}/stops/{stopId}`

Update a specific stop. If coordinates change, the route path will be regenerated.

```json
{
  "title": "Updated Stop Title",
  "description": "Updated description",
  "latitude": 52.3580,
  "longitude": 4.8687
}
```

### Delete Route

**DELETE** `/api/routes/{routeId}`

Deletes a route and all its stops.

### Delete Route Stop

**DELETE** `/api/routes/{routeId}/stops/{stopId}`

Deletes a specific stop. If there are still 2+ stops remaining, the route path will be regenerated.

### Regenerate Route Path

**POST** `/api/routes/{routeId}/regenerate`

Manually regenerate the route path using current stops and settings.

## Transportation Profiles

The following transportation profiles are supported:

- `driving-car` - Car routing
- `driving-hgv` - Heavy goods vehicle
- `cycling-regular` - Regular bicycle
- `cycling-road` - Road bike
- `cycling-mountain` - Mountain bike
- `cycling-electric` - E-bike
- `foot-walking` - Walking
- `foot-hiking` - Hiking
- `wheelchair` - Wheelchair accessible

## Route Optimization

When `optimized: true` is set, OpenRouteService will reorder the stops (except first and last) to find the most efficient route.

## Features

- **Automatic Path Generation**: Routes are automatically generated using OpenRouteService
- **Location Geocoding**: Stop locations are automatically enhanced with place names, cities, and countries
- **Flexible Profiles**: Support for different transportation modes
- **Route Optimization**: Optional automatic reordering of stops for efficiency
- **Real-time Updates**: Route paths are regenerated when stops or settings change
- **Distance & Duration**: Automatically calculated total distance and duration

## Response Format

A route response includes:

```json
{
  "id": "route-uuid",
  "trip_id": "trip-uuid",
  "title": "Route Title",
  "description": "Route description",
  "profile": "foot-walking",
  "total_distance": 2500,
  "total_duration": 1800,
  "geometry": {
    "type": "LineString",
    "coordinates": [[4.9041, 52.3676], [4.8840, 52.3752], ...]
  },
  "optimized": false,
  "created_at": "2025-01-01T12:00:00.000Z",
  "updated_at": "2025-01-01T12:00:00.000Z",
  "stops": [
    {
      "id": "stop-uuid",
      "route_id": "route-uuid",
      "title": "Hotel",
      "description": "Starting point",
      "latitude": 52.3676,
      "longitude": 4.9041,
      "order_index": 0,
      "location_name": "Amsterdam Center",
      "city": "Amsterdam",
      "country": "Netherlands",
      "country_code": "NL",
      "created_at": "2025-01-01T12:00:00.000Z",
      "updated_at": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

## Environment Setup

Make sure to set the `OPENROUTE_API_KEY` environment variable with your OpenRouteService API key. You can get a free API key at [openrouteservice.org](https://openrouteservice.org/).

Without this key, routes can still be created with stops, but no path generation will occur.
