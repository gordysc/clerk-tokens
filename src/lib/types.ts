/**
 * Minimal projection of a Clerk user, shaped for the user picker.
 */
export interface UserSummary {
  /** Clerk user id (`user_…`). */
  id: string;
  /** Display name resolved from first/last name, username, or email local part. */
  name: string;
  /** Primary email address, if the user has one. */
  email: string | null;
  /** URL of the user's profile image. */
  imageUrl: string;
  /** One- or two-letter initials used as the avatar fallback. */
  initials: string;
}

/**
 * Result of minting a bearer token for a user.
 */
export interface MintedToken {
  /** The signed JWT to use as an `Authorization: Bearer` credential. */
  token: string;
  /** Id of the Clerk session (`sess_…`) the token was minted from. */
  sessionId: string;
  /** Name of the JWT template that signed the token. */
  template: string;
  /** Origin baked into the `azp` claim, or `null` when minted without one. */
  azp: string | null;
  /** Id of the user the token belongs to. */
  userId: string;
}
