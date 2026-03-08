import { eq, or } from "drizzle-orm";
import { err, ok, ResultAsync } from "neverthrow";
import { db, users } from "../../database";
import type { AuthModel } from "./model";

type User = typeof users.$inferSelect;

type AuthError = {
	_tag: "InvalidCredentials" | "UserAlreadyExists" | "UserNotFound";
	status: number;
	message: string;
};

type PasswordHashError = {
	_tag: "HashingError" | "VerificationError";
	message: string;
};

export abstract class AuthService {
	static login({
		email,
		password,
	}: AuthModel.LoginUser): ResultAsync<User, AuthError> {
		return ResultAsync.fromPromise(
			db.query.users.findFirst({
				where: eq(users.email, email),
			}),
			() => ({
				_tag: "UserNotFound" as const,
				status: 404,
				message: "User not found",
			}),
		)
			.andThen((user) =>
				user
					? ok(user)
					: err({
							_tag: "UserNotFound" as const,
							status: 404,
							message: "User not found",
						}),
			)
			.andThen((user) =>
				AuthService.password
					.verifyPassword(password, user.password)
					.mapErr(() => ({
						_tag: "InvalidCredentials" as const,
						status: 401,
						message: "Invalid credentials",
					}))
					.andThen((valid) =>
						valid
							? ok(user)
							: err({
									_tag: "InvalidCredentials" as const,
									status: 401,
									message: "Invalid credentials",
								}),
					),
			);
	}

	static register(data: AuthModel.RegisterUser): ResultAsync<User, AuthError> {
		return ResultAsync.fromPromise(
			db.query.users.findFirst({
				where: or(
					eq(users.username, data.username),
					eq(users.email, data.email),
				),
			}),
			() => ({
				_tag: "UserNotFound" as const,
				status: 500,
				message: "Database error",
			}),
		)
			.andThen((existingUser) =>
				existingUser
					? err({
							_tag: "UserAlreadyExists" as const,
							status: 409,
							message: "Username or email already exists",
						})
					: ok(undefined),
			)
			.andThen(() =>
				AuthService.password.hashPassword(data.password).mapErr(() => ({
					_tag: "InvalidCredentials" as const,
					status: 500,
					message: "Failed to hash password",
				})),
			)
			.andThen((hashedPassword) =>
				ResultAsync.fromPromise(
					db
						.insert(users)
						.values({
							username: data.username,
							email: data.email,
							password: hashedPassword,
						})
						.returning()
						.then((rows) => rows[0]),
					() => ({
						_tag: "UserAlreadyExists" as const,
						status: 500,
						message: "Failed to create user",
					}),
				),
			);
	}

	static password = {
		/**
		 * Hash a password
		 */
		hashPassword(password: string): ResultAsync<string, PasswordHashError> {
			return ResultAsync.fromPromise(
				Bun.password.hash(password, {
					algorithm: "bcrypt",
					cost: 10,
				}),
				(error) => ({
					_tag: "HashingError" as const,
					message: `Error hashing password: ${error instanceof Error ? error.message : String(error)}`,
				}),
			);
		},

		/**
		 * Verify a password against a hash
		 */
		verifyPassword(
			password: string,
			hash: string,
		): ResultAsync<boolean, PasswordHashError> {
			return ResultAsync.fromPromise(
				Bun.password.verify(password, hash),
				(error) => ({
					_tag: "VerificationError" as const,
					message: `Error verifying password: ${error instanceof Error ? error.message : String(error)}`,
				}),
			);
		},
	};
}
