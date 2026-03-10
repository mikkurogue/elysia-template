import jwt from "@elysiajs/jwt";
import { Result } from "better-result";
import Elysia, { status } from "elysia";
import { log } from "evlog";
import { evlog } from "evlog/elysia";
import { safeReadEnv } from "../../lib/safe-read-env";
import { authMiddleware } from "../../middleware/auth";
import { AuthModel } from "./model";
import { AuthService } from "./service";

const jwtSecret = safeReadEnv<string>("JWT_SECRET").match({
	ok: (value) => value,
	err: (error) => {
		log.error("Fatal", error.message);
		throw new Error("JWT_SECRET missing");
	},
});

const AuthRoute = new Elysia({ prefix: "/auth" })
	.use(evlog())
	.use(
		jwt({
			name: "jwt",
			secret: jwtSecret,
		}),
	)
	// Public routes
	.post(
		"/login",
		async ({ body, jwt, cookie: { auth }, log }) => {
			const result = await AuthService.login(body);

			if (result.isErr()) {
				const error = result.error;
				log.error(error.message, { _tag: error._tag });
				throw status(error.status, error.message);
			}

			const user = result.value;
			const token = await jwt.sign({
				id: user.id,
				email: user.email,
				username: user.username,
			});

			auth.set({
				value: token,
				httpOnly: true,
				maxAge: 7 * 86400,
				path: "/",
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
			});

			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
				},
			};
		},
		{
			body: AuthModel.loginUser,
			detail: {
				summary: "Allow a user to login and authenticate them",
				tags: ["Auth"],
				description:
					"This endpoint allows a user to login and authenticate them. It accepts an email and password and returns a JWT token in a cookie if the credentials are valid.",
			},
		},
	)
	.post(
		"/register",
		async ({ body, log }) => {
			const result = await AuthService.register(body);

			if (Result.isError(result)) {
				const error = result.error;
				log.error(error.message, { _tag: error._tag });
				throw status(error.status, error.message);
			}

			const user = result.value;
			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
				},
			};
		},
		{
			body: AuthModel.registerUser,
			detail: {
				summary: "Allow a user to register a new account",
				tags: ["Auth"],
				description:
					"This endpoint allows a user to register a new account. It accepts a username, email, and password and creates a new user account if the provided information is valid.",
			},
		},
	)
	// Protected routes (after middleware)
	.use(authMiddleware)
	.post(
		"/logout",
		({ cookie: { auth } }) => {
			auth.remove();
			return { success: true };
		},
		{
			detail: {
				summary: "Logout the current user",
				tags: ["Auth"],
				description:
					"This endpoint logs out the current user by removing the auth cookie.",
			},
		},
	)
	.get(
		"/me",
		({ user }) => {
			return { user };
		},
		{
			detail: {
				summary: "Get current user information",
				tags: ["Auth"],
				description:
					"This endpoint returns the current authenticated user's information.",
			},
		},
	);

export { AuthRoute };
