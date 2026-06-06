import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import envConfig from './envConfig.js';

const shouldUseSsl = /sslmode=require/i.test(envConfig.DATABASE_URL);

const pool = new Pool({
    connectionString: envConfig.DATABASE_URL,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    // Connection pool health settings
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// Prevent unhandled pool errors from crashing the server
pool.on('error', (err) => {
    console.error('[PG Pool] Unexpected error on idle client:', err.message);
});

pool.on('connect', () => {
    // console.log('[PG Pool] New client connected');
});

pool.on('remove', () => {
    // console.log('[PG Pool] Client removed from pool');
});

const db = drizzle(pool);

async function connectToDatabase() {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected');
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    }
}

export { db, pool, connectToDatabase };
