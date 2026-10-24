import { command, query } from "$app/server";
import { error, isHttpError } from "@sveltejs/kit";
import {
  clerkErrorMessage,
  getClerkClient,
  getJwtTemplate
} from "#lib/server/clerk.js";
import { mintTokenViaFrontendApi } from "#lib/server/clerk-fapi.js";
import type { MintedToken, UserSummary } from "#lib/types.js";

/**
 * Loads up to 500 users from the Clerk instance, newest first.
 *
 * @returns User summaries shaped for the picker dropdown.
 */
export const getUsers = query(async (): Promise<UserSummary[]> => {
  const clerk = getClerkClient();

  try {
    const { data } = await clerk.users.getUserList({
      limit: 500,
      orderBy: "-created_at"
    });

    return data.map(user => {
      const email =
        user.emailAddresses.find(
          address => address.id === user.primaryEmailAddressId
        )?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null;
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        email?.split("@")[0] ||
        "Unnamed user";
      const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? "")
        .join("");

      return { id: user.id, name, email, imageUrl: user.imageUrl, initials };
    });
  } catch (err) {
    if (isHttpError(err)) throw err;
    error(502, `Failed to load users from Clerk: ${clerkErrorMessage(err)}`);
  }
});

/**
 * Mints a bearer token for the given user by creating a real Clerk session and
 * signing a token from the configured JWT template.
 *
 * @param userId - The Clerk user id (`user_…`) to mint a token for.
 * @returns The signed JWT plus the session and template it came from.
 */
export const mintToken = command(
  "unchecked",
  async (userId: string): Promise<MintedToken> => {
    if (!userId) error(400, "Select a user before generating a token.");

    const template = getJwtTemplate();

    try {
      const { jwt, sessionId, azp } = await mintTokenViaFrontendApi(
        userId,
        template
      );

      return { token: jwt, sessionId, template, userId, azp };
    } catch (err) {
      if (isHttpError(err)) throw err;
      error(
        502,
        `Failed to mint token (template "${template}"): ${clerkErrorMessage(err)}`
      );
    }
  }
);
