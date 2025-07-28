#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:1798/api';

async function testAPI() {
  console.log('🧪 Testing Vacation Gallery API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // Test 2: Create a trip
    console.log('\n2. Creating a test trip...');
    const tripData = {
      name: 'Test Trip API',
      description: 'A test trip created via API',
      start_date: '2024-07-01',
      end_date: '2024-07-07'
    };

    const createTripResponse = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData)
    });

    if (!createTripResponse.ok) {
      throw new Error(`Failed to create trip: ${createTripResponse.statusText}`);
    }

    const createdTrip = await createTripResponse.json();
    console.log('✅ Trip created:', createdTrip.name, `(ID: ${createdTrip.id})`);

    // Test 3: Get all trips
    console.log('\n3. Fetching all trips...');
    const tripsResponse = await fetch(`${BASE_URL}/trips`);
    const trips = await tripsResponse.json();
    console.log(`✅ Found ${trips.length} trip(s)`);

    // Test 4: Get trip by ID
    console.log('\n4. Fetching trip by ID...');
    const tripResponse = await fetch(`${BASE_URL}/trips/${createdTrip.id}`);
    const trip = await tripResponse.json();
    console.log('✅ Trip details:', trip.name);

    // Test 5: Get all photos (should be empty)
    console.log('\n5. Fetching all photos...');
    const photosResponse = await fetch(`${BASE_URL}/photos`);
    const photos = await photosResponse.json();
    console.log(`✅ Found ${photos.length} photo(s)`);

    // Test 6: Get photos with coordinates (should be empty)
    console.log('\n6. Fetching photos with coordinates...');
    const coordPhotosResponse = await fetch(`${BASE_URL}/photos/with-coordinates`);
    const coordPhotos = await coordPhotosResponse.json();
    console.log(`✅ Found ${coordPhotos.length} photo(s) with coordinates`);

    console.log('\n🎉 All API tests passed!');
    console.log(`\n📋 Trip ID for testing: ${createdTrip.id}`);
    console.log('📝 To upload photos, use:');
    console.log(`curl -X POST ${BASE_URL}/trips/${createdTrip.id}/photos \\`);
    console.log(`  -F "photos=@your-photo.jpg"`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      await testAPI();
    } else {
      throw new Error('Server responded with error');
    }
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure the API is running on port 1798');
    console.log('💡 Start the server with: yarn dev');
    process.exit(1);
  }
}

checkServer();
