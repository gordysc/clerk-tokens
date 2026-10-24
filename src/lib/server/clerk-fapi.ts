import { error } from "@sveltejs/kit";
import { CLERK_AZP_ORIGIN } from "$app/env/private";
import { getClerkClient } from "./clerk";

/**
 * Result of minting a token through the Clerk Frontend API.
 */
export interface FapiMintResult {
  /** The signed JWT, including the `azp` claim. */
  jwt: string;
  /** Id of the Clerk session (`sess_…`) the token was minted from. */
  sessionId: string;
  /** The origin the token's `azp` claim was set to. */
  azp: string;
}

/** Cached Frontend API URL, discovered from the instance's primary domain. */
let frontendApiUrl: string | null = null;

/** Cached dev-browser token; FAPI accepts it in place of real browser cookies. */
let devBrowserToken: string | null = null;

/**
 * Resolves the origin used for the token's `azp` claim.
 *
 * @returns The value of `CLERK_AZP_ORIGIN`, falling back to `http://localhost:5173`.
 */
export function getAzpOrigin(): string {
  return CLERK_AZP_ORIGIN || "http://localhost:5173";
}

/**
 * Mints a bearer token through the Clerk Frontend API so the JWT carries an
 * `azp` claim.
 *
 * `azp` is a reserved claim Clerk derives from the request's `Origin` header;
 * tokens minted via the backend API have no origin and therefore no `azp`.
 * This flow emulates a browser instead (dev instances only):
 *
 * 1. Create a one-shot sign-in token for the user (backend API).
 * 2. Obtain a dev-browser token (`POST /v1/dev_browser`).
 * 3. Complete a ticket sign-in via the Frontend API with a controlled `Origin`.
 * 4. Request a token from the JWT template on the created session — the
 *    `Origin` header becomes the `azp` claim.
 *
 * @param userId - The Clerk user id (`user_…`) to mint a token for.
 * @param template - The JWT template name to sign the token with.
 * @returns The signed JWT, its session id, and the `azp` origin used.
 * @throws A 502 {@link error} when any Clerk API step fails.
 */
export async function mintTokenViaFrontendApi(
  userId: string,
  template: string
): Promise<FapiMintResult> {
  const fapi = await getFrontendApiUrl();
  const azp = getAzpOrigin();
  const clerk = getClerkClient();
  const { token: ticket } = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 60
  });

  const signIn = await withFreshDevBrowserRetry(fapi, db =>
    fapiFetch(`${fapi}/v1/client/sign_ins?__clerk_db_jwt=${db}`, azp, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ strategy: "ticket", ticket })
    })
  );

  const sessionId = (signIn as { response?: { created_session_id?: string } })
    .response?.created_session_id;

  if (!sessionId) {
    error(
      502,
      "Ticket sign-in did not produce a session — cannot mint a token."
    );
  }

  const token = (await fapiFetch(
    `${fapi}/v1/client/sessions/${sessionId}/tokens/${template}?__clerk_db_jwt=${devBrowserToken}`,
    azp,
    { method: "POST" }
  )) as { jwt: string };

  return { jwt: token.jwt, sessionId, azp };
}

/**
 * Discovers (and caches) the instance's Frontend API URL from its primary domain.
 *
 * @returns The Frontend API base URL, e.g. `https://foo-bar-1.clerk.accounts.dev`.
 * @throws A 502 {@link error} when the instance has no domains.
 */
async function getFrontendApiUrl(): Promise<string> {
  if (frontendApiUrl) return frontendApiUrl;

  const { data } = await getClerkClient().domains.list();
  const primary = data.find(domain => !domain.isSatellite) ?? data[0];

  if (!primary) {
    error(
      502,
      "Clerk instance has no domains — cannot resolve the Frontend API URL."
    );
  }

  frontendApiUrl = primary.frontendApiUrl;

  return frontendApiUrl;
}

/**
 * Runs a FAPI call with the cached dev-browser token, refreshing the token and
 * retrying once if the cached one has gone stale.
 *
 * @param fapi - The Frontend API base URL.
 * @param call - The FAPI call to run, given a dev-browser token.
 * @returns The call's parsed response.
 */
async function withFreshDevBrowserRetry(
  fapi: string,
  call: (devBrowser: string) => Promise<unknown>
): Promise<unknown> {
  const cached = devBrowserToken;

  if (cached) {
    try {
      return await call(cached);
    } catch {
      devBrowserToken = null;
    }
  }

  return call(await getDevBrowserToken(fapi));
}

/**
 * Obtains (and caches) a dev-browser token from the Frontend API.
 *
 * Only available on development instances — production instances return an
 * error, in which case `azp` minting is not possible.
 *
 * @param fapi - The Frontend API base URL.
 * @returns The dev-browser JWT.
 */
async function getDevBrowserToken(fapi: string): Promise<string> {
  if (devBrowserToken) return devBrowserToken;

  const result = (await fapiFetch(`${fapi}/v1/dev_browser`, getAzpOrigin(), {
    method: "POST"
  })) as { token: string };

  devBrowserToken = result.token;

  return devBrowserToken;
}

/**
 * Performs a Frontend API request with the given `Origin` header and parses
 * the JSON response, converting FAPI error payloads into HTTP errors.
 *
 * @param url - The full Frontend API URL to call.
 * @param origin - The value for the `Origin` header (becomes the `azp` claim).
 * @param init - Standard fetch options.
 * @returns The parsed JSON response body.
 * @throws A 502 {@link error} when the response is not OK.
 */
async function fapiFetch(
  url: string,
  origin: string,
  init: RequestInit
): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("origin", origin);

  const response = await fetch(url, { ...init, headers });
  const body = (await response.json()) as {
    errors?: Array<{ long_message?: string; message?: string }>;
  };

  if (!response.ok) {
    const first = body.errors?.[0];

    error(
      502,
      first?.long_message ??
        first?.message ??
        `Clerk Frontend API request failed (${response.status}).`
    );
  }

  return body;
}
