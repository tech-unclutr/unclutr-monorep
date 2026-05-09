// Pub/Sub push subscription OIDC verification.
// When you create the push subscription with --push-auth-service-account, Pub/Sub
// signs every push with an OIDC token. We verify it here so unauthenticated
// callers can't spoof transcript-uploaded events.

import { OAuth2Client } from "google-auth-library";

let _client: OAuth2Client | null = null;
function client(): OAuth2Client {
  if (!_client) _client = new OAuth2Client();
  return _client;
}

export type PubSubVerification =
  | { ok: true; email: string }
  | { ok: false; reason: string };

export async function verifyPubSubAuth(authHeader: string | null): Promise<PubSubVerification> {
  // In dev / playback contexts (no service account key configured), allow if a dev secret matches
  if (process.env.PUBSUB_DEV_SHARED_SECRET) {
    if (authHeader === `Bearer ${process.env.PUBSUB_DEV_SHARED_SECRET}`) {
      return { ok: true, email: "dev-shared-secret" };
    }
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, reason: "missing or malformed Authorization header" };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return { ok: false, reason: "empty bearer token" };

  // Optional: pin the audience to a known value if the push subscription was
  // configured with a specific audience. Set PUBSUB_OIDC_AUDIENCE to enforce.
  const expectedAudience = process.env.PUBSUB_OIDC_AUDIENCE;

  try {
    const ticket = await client().verifyIdToken({
      idToken: token,
      audience: expectedAudience,
    });
    const payload = ticket.getPayload();
    if (!payload) return { ok: false, reason: "no payload in OIDC token" };

    // Must be signed by Google, not expired (verifyIdToken handles signature + exp)
    // Pin the email to the service account we created if PUBSUB_PUSHER_EMAIL is set.
    const expectedEmail = process.env.PUBSUB_PUSHER_EMAIL;
    if (expectedEmail && payload.email !== expectedEmail) {
      return { ok: false, reason: `unexpected pusher email ${payload.email} (want ${expectedEmail})` };
    }

    return { ok: true, email: payload.email ?? "unknown" };
  } catch (e) {
    return { ok: false, reason: `OIDC verification failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export type GcsNotificationEvent = {
  bucket: string;
  name: string;
  size?: string;
  timeCreated?: string;
  updated?: string;
  contentType?: string;
  // ... and many more fields, but these are the ones we use
};

export type PubSubPushBody = {
  message: {
    data: string;            // base64-encoded JSON
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
};

/** Decode a Pub/Sub push body into the GCS notification payload. */
export function decodeGcsEvent(body: PubSubPushBody): { event: GcsNotificationEvent; eventType: string | null; messageId: string } {
  const messageId = body.message?.messageId ?? "unknown";
  const eventType = body.message?.attributes?.eventType ?? null;
  const dataB64 = body.message?.data;
  if (!dataB64) throw new Error("Pub/Sub message has no data");
  const json = Buffer.from(dataB64, "base64").toString("utf-8");
  const event = JSON.parse(json) as GcsNotificationEvent;
  return { event, eventType, messageId };
}
