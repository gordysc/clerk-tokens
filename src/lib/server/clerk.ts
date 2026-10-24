import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { error } from "@sveltejs/kit";
import { CLERK_SECRET_KEY, CLERK_JWT_TEMPLATE } from "$app/env/private";

/**
 * Lazily-created singleton Clerk backend client, keyed off `CLERK_SECRET_KEY`.
 */
let client: ClerkClient | null = null;

/**
 * Returns the Clerk backend client, creating it on first use.
 *
 * @returns A configured {@link ClerkClient} authenticated with the instance secret key.
 * @throws A 500 {@link error} when `CLERK_SECRET_KEY` is not configured in `.env`.
 */
export function getClerkClient(): ClerkClient {
  const secretKey = CLERK_SECRET_KEY;

  if (!secretKey) {
    error(
      500,
      "CLERK_SECRET_KEY is not set. Copy .env.example to .env and paste the secret key from the Clerk dashboard (Configure → API keys)."
    );
  }

  client ??= createClerkClient({ secretKey });

  return client;
}

/**
 * Resolves the JWT template name used to mint bearer tokens.
 *
 * @returns The value of `CLERK_JWT_TEMPLATE`, falling back to `"default"`.
 */
export function getJwtTemplate(): string {
  return CLERK_JWT_TEMPLATE || "default";
}

/**
 * Extracts a human-readable message from an unknown Clerk API failure.
 *
 * Clerk API errors carry an `errors` array with `longMessage`/`message` entries;
 * anything else falls back to the standard `Error` message.
 *
 * @param err - The caught value from a failed Clerk API call.
 * @returns The most descriptive message available for display to the user.
 */
export function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (
      err as { errors?: Array<{ longMessage?: string; message?: string }> }
    ).errors;
    const first = errors?.[0];

    if (first?.longMessage || first?.message) {
      return first.longMessage ?? first.message ?? "";
    }
  }

  return err instanceof Error
    ? err.message
    : "Unknown error talking to the Clerk API.";
}
