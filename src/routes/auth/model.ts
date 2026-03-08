import { t } from "elysia";

/**
 * Describe all models related to the Auth module.
 */
export namespace AuthModel {
	/**
	 * Validation object for user registration
	 */
	export const registerUser = t.Object({
		username: t.String({ minLength: 3, maxLength: 255 }),
		email: t.String({ format: "email", maxLength: 255 }),
		password: t.String({
			minLength: 8,
			maxLength: 255,
			pattern:
				"^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\[\\]{};:'\"\\\\|,.<>/?`~-]).+$",
			description:
				"Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
		}),
	});

	/**
	 * Type for user registration derived from the validation object
	 */
	export type RegisterUser = typeof registerUser.static;

	/**
	 * Validation object for user login
	 */
	export const loginUser = t.Object({
		email: t.String({ format: "email", maxLength: 255 }),
		password: t.String(),
	});

	/**
	 * Type for user login derived from the validation object
	 */
	export type LoginUser = typeof loginUser.static;
}
