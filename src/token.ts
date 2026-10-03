/**
 * token.ts — OAuth 2.1 Token Endpoint
 *
 * Handles POST /token for:
 *   - authorization_code  (RFC 7636 PKCE exchange)
 *   - refresh_token       (silent renewal)
 *
 * Spec compliance:
 *   - OAuth 2.1 §4.1.3, §4.1.4, §4.3
 *   - RFC 7636 — PKCE S256 verification
 *   - RFC 6749 §5.2 — Error responses
 *   - RFC 9700 §2 — Security Best Current Practice
 */

import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  OAUTH_KV: KVNamespace;
  BASE_URL: string;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function TokenHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext & { oauth: OAuthHelpers }
): Promise<Response> {
  if (request.method === "OPTIONS") return corsPreflightResponse();
  if (request.method !== "POST") return tokenError("invalid_request", "Method Not Allowed", 405);

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return tokenError("invalid_request", "Content-Type must be application/x-www-form-urlencoded", 400);
  }

  let body: URLSearchParams;
  try { body = new URLSearchParams(await request.text()); }
  catch { return tokenError("invalid_request", "Malformed request body", 400); }

  switch (body.get("grant_type")) {
    case "authorization_code": return handleAuthorizationCode(body, env, ctx);
    case "refresh_token":      return handleRefreshToken(body, env, ctx);
    default:
      return tokenError(
        "unsupported_grant_type",
        `Supported grant types: authorization_code, refresh_token`,
        400
      );
  }
}

// ─── authorization_code ───────────────────────────────────────────────────────

async function handleAuthorizationCode(
  body: URLSearchParams,
  env: Env,
  ctx: ExecutionContext & { oauth: OAuthHelpers }
): Promise<Response> {
  const code         = body.get("code");
  const clientId     = body.get("client_id");
  const redirectUri  = body.get("redirect_uri");
  const codeVerifier = body.get("code_verifier");

  if (!code || !clientId || !redirectUri || !codeVerifier) {
    return tokenError("invalid_request", "Missing: code, client_id, redirect_uri, code_verifier", 400);
  }

  // RFC 7636 §4.1 — code_verifier: 43–128 unreserved ASCII chars
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(codeVerifier)) {
    return tokenError("invalid_request", "code_verifier must be 43–128 unreserved ASCII characters", 400);
  }

  try {
    const tokenResponse = await ctx.oauth.redeemAuthCode({ code, clientId, redirectUri, codeVerifier });
    return tokenSuccess(tokenResponse);
  } catch (err) {
    return handleOAuthError(err);
  }
}

// ─── refresh_token ────────────────────────────────────────────────────────────

async function handleRefreshToken(
  body: URLSearchParams,
  env: Env,
  ctx: ExecutionContext & { oauth: OAuthHelpers }
): Promise<Response> {
  const refreshToken = body.get("refresh_token");
  const clientId     = body.get("client_id");
  const scope        = body.get("scope") ?? undefined;

  if (!refreshToken || !clientId) {
    return tokenError("invalid_request", "Missing: refresh_token, client_id", 400);
  }

  try {
    const tokenResponse = await ctx.oauth.redeemRefreshToken({ refreshToken, clientId, scope });
    return tokenSuccess(tokenResponse);
  } catch (err) {
    return handleOAuthError(err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenSuccess(payload: Record<string, unknown>): Response {
  return Response.json(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function tokenError(error: string, description: string, status: 400|401|405|500 = 400): Response {
  return Response.json({ error, error_description: description }, {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

function handleOAuthError(err: unknown): Response {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("expired"))                                   return tokenError("invalid_grant",  "Authorization code has expired", 400);
    if (m.includes("pkce") || m.includes("verifier") || m.includes("challenge")) return tokenError("invalid_grant", "PKCE verification failed", 400);
    if (m.includes("redirect"))                                  return tokenError("invalid_grant",  "redirect_uri mismatch", 400);
    if (m.includes("client"))                                    return tokenError("invalid_client", "Unknown or invalid client_id", 401);
    if (m.includes("refresh"))                                   return tokenError("invalid_grant",  "Refresh token is invalid, expired, or revoked", 400);
  }
  console.error("[token] Unhandled error:", err);
  return tokenError("server_error", "An unexpected error occurred", 500);
}

function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
