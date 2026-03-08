import { drizzle } from "drizzle-orm/postgres-js";
import { log } from "evlog";
import postgres from "postgres";
import { safeReadEnv } from "../lib/safe-read-env";
import * as schema from "./schema";

const envResult = safeReadEnv<string>("DATABASE_URL");
const connectionString = envResult.match(
	(value) => value,
	(error) => {
		log.error(
			"Fatal",
			"DATABASE_URL environment variable is required but not found",
		);
		throw error;
	},
);

export const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
	max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export * from "./schema";
