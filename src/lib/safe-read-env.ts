import { Result } from "better-result";

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
	const value = process.env?.[key] as T | undefined;

	if (value === undefined) {
		return Result.err({
			_tag: "KeyNotFound" as const,
			message: `Environment variable ${key} not found`,
		});
	}

	return Result.ok(value);
}
