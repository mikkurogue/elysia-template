import type { Result } from "better-result";
import { status } from "elysia";

type HttpError = {
	status: number;
	message: string;
};

/**
 * Unwraps a Result, throwing an Elysia status error if it's an Err.
 * This avoids the Panic wrapper from better-result's .match()
 *
 * @example
 * const user = unwrapOrStatus(await UserService.getUserById(id));
 * // If error, throws status(error.status, error.message)
 * // If ok, returns the value
 */
export function unwrapOrStatus<T, E extends HttpError>(
	result: Result<T, E>,
): T {
	if (result.status === "error") {
		throw status(result.error.status, result.error.message);
	}
	return result.value;
}

/**
 * Unwraps a Result with a custom error handler.
 * Useful when you need to log or transform the error before throwing.
 *
 * @example
 * const user = unwrapOrThrow({
 *   ok: await AuthService.login(body),
 *   err: (e) => {
 *     log.error(e.message, { _tag: e._tag });
 *     throw status(e.status, e.message);
 *   },
 * });
 */
export function unwrapOrThrow<T, E>(options: {
	ok: Result<T, E>;
	err: (error: E) => never;
}): T {
	if (options.ok.status === "error") {
		options.err(options.ok.error);
	}
	return options.ok.value;
}
