import { Pool } from "pg";
import { requireEnv } from "./env.mjs";

let poolInstance;

export function getDbPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 4,
    });
  }

  return poolInstance;
}

export async function query(text, params = []) {
  const pool = getDbPool();
  return pool.query(text, params);
}
