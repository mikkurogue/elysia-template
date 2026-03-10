import { Result } from "better-result";
import type { users } from "../../database";

type User = typeof users.$inferSelect;

type UserError = {
	_tag: "UserNotFound" | "DatabaseError";
	message: string;
};

export abstract class UserService {
	static getUserProfile(userId: string): Promise<Result<User, UserError>> {
		// TODO: Implement actual database query to fetch user profile by userId

		const user = {
			id: userId,
			username: "",
			email: "",
			password: "",
			avatar: null,
			createdAt: new Date(),
			updatedAt: null,
		} satisfies User;

		return Result.tryPromise({
			try: () => Promise.resolve(user),
			catch: () => ({
				_tag: "UserNotFound" as const,
				message: "User not found",
			}),
		});
	}
}
