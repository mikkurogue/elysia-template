import { t } from "elysia";

export namespace UserModel {
	export const userProfile = t.Object({
		id: t.String(),
		username: t.String(),
		email: t.String({ format: "email" }),
		avatar: t.Nullable(t.String()),
		bio: t.Nullable(t.String()),
	});

	export type UserProfile = typeof userProfile.static;
}
