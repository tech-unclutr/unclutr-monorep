// Verifies a Google-signed OIDC JWT in the Authorization header.
//
// Used by /api/process to authenticate Cloud Tasks invocations. Cloud Tasks
// signs each outbound request with an OIDC token whose `aud` claim equals the
// target service URL. We verify:
//   1. issuer = https://accounts.google.com
//   2. audience matches the expected service URL (process.env.SERVICE_AUDIENCE)
//   3. signature is valid against Google's public keys
//
// In development (NODE_ENV !== 'production') verification is bypassed so local
// dev doesn't need an OIDC token. Production is always enforced.

import { OAuth2Client } from "google-auth-library";

let _client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!_client) _client = new OAuth2Client();
  return _client;
}

export type OidcVerifyResult =
  | { ok: true; bypassed: boolean; email?: string }
  | { ok: false; status: number; error: string };

/**
 * Verify an incoming request's OIDC token. Returns a result discriminated by
 * `ok` so the caller can branch on success/failure cleanly.
 */
export async function verifyOidc(req: Request): Promise<OidcVerifyResult> {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, bypassed: true };
  }

  const audience = process.env.SERVICE_AUDIENCE;
  if (!audience) {
    return { ok: false, status: 500, error: "SERVICE_AUDIENCE env var not set" };
  }

  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "missing or malformed Authorization header" };
  }
  const idToken = match[1];

  try {
    const ticket = await getClient().verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload) {
      return { ok: false, status: 401, error: "empty OIDC payload" };
    }
    if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
      return { ok: false, status: 401, error: `unexpected issuer: ${payload.iss}` };
    }
    return { ok: true, bypassed: false, email: payload.email };
  } catch (e) {
    return {
      ok: false,
      status: 401,
      error: `OIDC verification failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
