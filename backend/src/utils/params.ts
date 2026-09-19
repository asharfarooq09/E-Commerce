import { AppError } from "../middleware/error-handler";

/** Express 5 types route params as `string | string[]`. Normalize to a single string. */
export function pathParam(
  value: string | string[] | undefined,
  name = "param",
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    throw new AppError(`Missing route parameter: ${name}`, 400);
  }
  return raw;
}
