import jwt from "@elysiajs/jwt";
import { Result } from "better-result";
import Elysia, { status } from "elysia";
import { log } from "evlog";
import { evlog } from "evlog/elysia";
import { safeReadEnv } from "../../lib/safe-read-env";
import { authMiddleware } from "../../middleware/auth";
import { UserService } from "./service";

const jwtSecret = safeReadEnv<string>("JWT_SECRET").match({
	ok: (value) => value,
	err: (error) => {
		log.error("Fatal", error.message);
		throw new Error("JWT_SECRET missing");
	},
});

const UserRoute = new Elysia({ prefix: "/user" })
	.use(evlog())
	.use(authMiddleware)
	.use(
		jwt({
			name: "jwt",
			secret: jwtSecret,
		}),
	)
	.get("/profile", async ({ user, body, log }) => {
		log.set({
			route: "/user/profile",
		});

		const result = await UserService.getUserProfile(user.id);
		if (result.isErr()) {
			const e = result.error;
			log.error(e.message, { _tag: e._tag });
			throw status(404, "No profile found for user");
		}

		return result.value;
	});

export { UserRoute };
