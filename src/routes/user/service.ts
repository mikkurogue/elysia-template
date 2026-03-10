import { Result } from "better-result";
import { eq } from "drizzle-orm";
import { db, users } from "../../database";

type User = typeof users.$inferSelect;

type UserError = {
	_tag: "UserNotFound" | "DatabaseError";
	message: string;
};

export abstract class UserService {
	static async getUserProfile(
		userId: string,
	): Promise<Result<User, UserError>> {
		const result = await Result.tryPromise({
			try: () =>
				db.query.users.findFirst({
					where: eq(users.id, userId),
				}),
			catch: () => ({
				_tag: "DatabaseError" as const,
				message: "Failed to fetch user",
			}),
		});

		if (result.isErr()) return result;

		if (!result.value) {
			return Result.err({
				_tag: "UserNotFound",
				message: "User not found",
			});
		}

		return Result.ok(result.value);
	}
}
