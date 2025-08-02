#!/usr/bin/env ts-node

import { database } from './src/database';

async function runLocationBackfill() {
  try {
    console.log('Starting location data backfill for existing photos...');
    
    const stats = await database.backfillLocationData();
    
    console.log('\n=== Backfill Summary ===');
    console.log(`Photos processed: ${stats.processed}`);
    console.log(`Photos updated: ${stats.updated}`);
    console.log(`Errors: ${stats.errors}`);
    
    if (stats.updated > 0) {
      console.log('\nLocation data has been successfully added to existing photos!');
    } else {
      console.log('\nNo photos needed location updates.');
    }
    
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run the backfill if this script is executed directly
if (require.main === module) {
  runLocationBackfill()
    .then(() => {
      console.log('Backfill completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backfill failed:', error);
      process.exit(1);
    });
}

export { runLocationBackfill };
