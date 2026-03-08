import { err, ok, Result } from "neverthrow";

type EnvError = {
	_tag: "KeyNotFound";
	message: string;
};

/**
 * Safely read an environment variable.
 * Returns a Result type that is Ok if the variable is found, or Err if it is not
 */
export function safeReadEnv<T extends string>(
	key: string,
): Result<T, EnvError> {
	const result = Result.fromThrowable(
		() => process.env?.[key] as T,
		() => ({
			_tag: "KeyNotFound" as const,
			message: `Environment variable ${key} not found`,
		}),
	)();

	if (result.isErr()) {
		return err(result.error);
	}

	return ok(result.value);
}
