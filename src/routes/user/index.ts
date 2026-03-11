import jwt from "@elysiajs/jwt";
import Elysia, { status } from "elysia";
import { log } from "evlog";
import { evlog } from "evlog/elysia";
import { unwrapOrThrow } from "../../lib/result-http";
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
	.get("/profile", async ({ user, log }) => {
		log.set({ route: "/user/profile" });

		return unwrapOrThrow({
			ok: await UserService.getUserProfileById(user.id),
			err: (e) => {
				log.error(e.message, { _tag: e._tag });
				throw status(e.status, e.message);
			},
		});
	});

export { UserRoute };
