import { Result } from "better-result";
import { drizzle } from "drizzle-orm/postgres-js";
import { log } from "evlog";
import postgres from "postgres";
import { safeReadEnv } from "../lib/safe-read-env";
import * as schema from "./schema";

const dbUrlResult = safeReadEnv<string>("DATABASE_URL");
if (Result.isError(dbUrlResult)) {
	log.error("Fatal", "DATABASE_URL environment variable is required");
	throw new Error("DATABASE_URL environment variable is required");
}
const connectionString = dbUrlResult.value;

export const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
	max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export * from "./schema";
