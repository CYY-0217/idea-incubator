import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 未设置：检查 .env（参考 .env.example）");
}

// dev 热重载下复用同一连接池，避免反复建连
const globalForDb = globalThis as unknown as {
  __ideaDbClient?: postgres.Sql;
};

const client =
  globalForDb.__ideaDbClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__ideaDbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
