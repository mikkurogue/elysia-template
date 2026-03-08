import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { initLogger, log } from "evlog";
import { evlog } from "evlog/elysia";
import { safeReadEnv } from "./lib/safe-read-env";
import { AuthRoute } from "./routes/auth";

initLogger({
	env: {
		service: "api-template-service",
		version: "0.0.1",
		environment: safeReadEnv("NODE_ENV").unwrapOr("development"),
	},
});

export const app = new Elysia()
	.use(openapi())
	.use(evlog())
	.get("/", () => "Hello Elysia")
	.use(AuthRoute)
	.listen(3000);

if (import.meta.main) {
	app.listen(3000);

	log.info({
		message: "API is starting...",
	});

	log.info({
		message: `API has started and is running at ${app.server?.hostname}:${app.server?.port}`,
	});
}
