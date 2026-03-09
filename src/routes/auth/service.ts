import { Result } from "better-result";
import { eq, or } from "drizzle-orm";
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
	private static async findUserByEmail(
		email: string,
	): Promise<Result<User | undefined, AuthError>> {
		return Result.tryPromise({
			try: () =>
				db.query.users.findFirst({
					where: eq(users.email, email),
				}),
			catch: () => ({
				_tag: "UserNotFound" as const,
				status: 404,
				message: "User not found",
			}),
		});
	}

	private static validateUserExist(
		user: User | undefined,
	): Result<User, AuthError> {
		if (!user) {
			return Result.err({
				_tag: "UserNotFound" as const,
				status: 404,
				message: "User not found",
			});
		}

		return Result.ok(user);
	}

	static async login({
		email,
		password,
	}: AuthModel.LoginUser): Promise<Result<User, AuthError>> {
		return Result.gen(async function* () {
			const maybeUser = yield* Result.await(AuthService.findUserByEmail(email));
			const user = yield* AuthService.validateUserExist(maybeUser);

			const isValid = yield* Result.await(
				AuthService.password
					.verifyPassword(password, user.password)
					.then((result) =>
						result.mapError(() => ({
							_tag: "InvalidCredentials" as const,
							status: 401,
							message: "Invalid credentials",
						})),
					),
			);

			if (!isValid) {
				return Result.err({
					_tag: "InvalidCredentials" as const,
					status: 401,
					message: "Invalid credentials",
				});
			}

			return Result.ok(user);
		});
	}

	static async register(
		data: AuthModel.RegisterUser,
	): Promise<Result<User, AuthError>> {
		return Result.gen(async function* () {
			// Check if user already exists
			const existingUser = yield* Result.await(
				Result.tryPromise({
					try: () =>
						db.query.users.findFirst({
							where: or(
								eq(users.username, data.username),
								eq(users.email, data.email),
							),
						}),
					catch: () => ({
						_tag: "UserNotFound" as const,
						status: 500,
						message: "Database error",
					}),
				}),
			);

			if (existingUser) {
				return Result.err({
					_tag: "UserAlreadyExists" as const,
					status: 409,
					message: "Username or email already exists",
				});
			}

			// Hash password
			const hashedPassword = yield* Result.await(
				AuthService.password.hashPassword(data.password).then((result) =>
					result.mapError(() => ({
						_tag: "InvalidCredentials" as const,
						status: 500,
						message: "Failed to hash password",
					})),
				),
			);

			// Create user
			const newUser = yield* Result.await(
				Result.tryPromise({
					try: () =>
						db
							.insert(users)
							.values({
								username: data.username,
								email: data.email,
								password: hashedPassword,
							})
							.returning()
							.then((rows) => rows[0]),
					catch: () => ({
						_tag: "UserAlreadyExists" as const,
						status: 500,
						message: "Failed to create user",
					}),
				}),
			);

			return Result.ok(newUser);
		});
	}

	static password = {
		/**
		 * Hash a password
		 */
		async hashPassword(
			password: string,
		): Promise<Result<string, PasswordHashError>> {
			return Result.tryPromise({
				try: () =>
					Bun.password.hash(password, {
						algorithm: "bcrypt",
						cost: 10,
					}),
				catch: (error) => ({
					_tag: "HashingError" as const,
					message: `Error hashing password: ${error instanceof Error ? error.message : String(error)}`,
				}),
			});
		},

		/**
		 * Verify a password against a hash
		 */
		async verifyPassword(
			password: string,
			hash: string,
		): Promise<Result<boolean, PasswordHashError>> {
			return Result.tryPromise({
				try: () => Bun.password.verify(password, hash),
				catch: (error) => ({
					_tag: "VerificationError" as const,
					message: `Error verifying password: ${error instanceof Error ? error.message : String(error)}`,
				}),
			});
		},
	};
}
