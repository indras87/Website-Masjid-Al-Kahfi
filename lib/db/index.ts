import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/alkahfi_db';

// For Next.js hot-reloading in development
const globalForDb = global as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(connectionString);
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
