import jwt from "@elysiajs/jwt";
import { type Elysia, status } from "elysia";
import { safeReadEnv } from "../lib/safe-read-env";

export interface JWTPayload {
	id: string;
	email: string;
	username: string;
}

const jwtSecret = safeReadEnv<string>("JWT_SECRET").match(
	(value) => value,
	(error) => {
		throw new Error(error.message);
	},
);

export const authMiddleware = (app: Elysia) =>
	app
		.use(
			jwt({
				name: "jwt",
				secret: jwtSecret,
			}),
		)
		.derive(async ({ jwt, cookie: { auth } }) => {
			const token = auth.value;

			if (!token) {
				throw status(401, "Unauthorized");
			}

			const payload = await jwt.verify(token as string);

			if (!payload) {
				throw status(401, "Unauthorized");
			}

			const user: JWTPayload = {
				id: (payload as Record<string, unknown>).id as string,
				email: (payload as Record<string, unknown>).email as string,
				username: (payload as Record<string, unknown>).username as string,
			};

			return { user };
		});
