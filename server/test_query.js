import 'dotenv/config';
import { listActivityLogs } from './src/db/query/activity-log.query.js';
import { connectToDatabase } from './src/config/database.js';

async function run() {
  try {
    await connectToDatabase();
    console.log("Querying activity logs...");
    const res = await listActivityLogs({ filters: {}, page: 1, limit: 25 });
    console.log("Success! Total items:", res.total);
    console.log("Items:", res.items);
  } catch (err) {
    console.error("Query failed with error:", err);
  }
  process.exit(0);
}

run();
