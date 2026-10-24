import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const rawConnectionString = (process.env.DATABASE_URL || "").trim().replace(/\s+/g, "");
const connectionString = rawConnectionString || "postgresql://dummy:dummy@localhost/dummy";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not defined in the environment. Please supply a Neon PostgreSQL connection string. Database operations will fail.");
}

// Initialize Neon Client safely
let sql: any;
try {
  sql = neon(connectionString);
} catch (err: any) {
  console.error("⚠️ Failed to initialize Neon client:", err?.message || err);
  // Fallback dummy sql function to avoid breaking module load
  sql = () => {
    throw new Error(`Database connection not configured properly: ${err?.message || err}`);
  };
}

// Export Drizzle Database Instance
export const db = drizzle(sql, { schema });
