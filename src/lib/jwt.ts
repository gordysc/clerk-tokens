/**
 * Decoded (unverified) contents of a JSON Web Token.
 */
export interface DecodedJwt {
  /** The JOSE header segment (alg, typ, kid, …). */
  header: Record<string, unknown>;
  /** The claims payload segment (sub, exp, iat, …). */
  payload: Record<string, unknown>;
}

/**
 * Decodes a JWT's header and payload segments without verifying the signature.
 *
 * Intended purely for display in this dev tool — verification happens on the API
 * that consumes the token, not here.
 *
 * @param token - A compact-serialized JWT (`header.payload.signature`).
 * @returns The decoded header and payload, or `null` when the token is malformed.
 * @example
 * ```ts
 * const decoded = decodeJwt(minted.token);
 * const expiresAt = decoded?.payload.exp;
 * ```
 */
export function decodeJwt(token: string): DecodedJwt | null {
  const segments = token.split(".");

  if (segments.length !== 3) {
    return null;
  }

  try {
    return {
      header: JSON.parse(decodeBase64Url(segments[0])),
      payload: JSON.parse(decodeBase64Url(segments[1]))
    };
  } catch {
    return null;
  }
}

/**
 * Decodes a base64url-encoded string into UTF-8 text.
 *
 * @param segment - The base64url-encoded JWT segment.
 * @returns The decoded text.
 * @throws {DOMException} When the segment is not valid base64.
 */
function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
