import { Result } from "better-result";
import { eq } from "drizzle-orm";
import { db, users } from "../../database";
import type { User } from "../../types/user";
import type { UserModel } from "./model";

type UserError = {
	_tag: "UserNotFound" | "DatabaseError";
	status: number;
	message: string;
};

export abstract class UserService {
	private static async findUserById(
		userId: string,
	): Promise<Result<User | undefined, UserError>> {
		return Result.tryPromise({
			try: () =>
				db.query.users.findFirst({
					where: eq(users.id, userId),
				}),
			catch: () => ({
				_tag: "DatabaseError" as const,
				status: 500,
				message: "Failed to fetch user",
			}),
		});
	}

	private static validateUserExists(
		user: User | undefined,
	): Result<User, UserError> {
		if (!user) {
			return Result.err({
				_tag: "UserNotFound" as const,
				status: 404,
				message: "User not found",
			});
		}

		return Result.ok(user);
	}

	private static toUserProfile(user: User): UserModel.UserProfile {
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			avatar: user.avatar,
			bio: user.bio,
		};
	}

	/**
	 * Fetches a user profile by their ID.
	 * Returns a Result containing either the user profile data or an error
	 */
	static async getUserProfileById(
		userId: string,
	): Promise<Result<UserModel.UserProfile, UserError>> {
		return Result.gen(async function* () {
			const maybeUser = yield* Result.await(UserService.findUserById(userId));
			const user = yield* UserService.validateUserExists(maybeUser);

			return Result.ok(UserService.toUserProfile(user));
		});
	}
}
