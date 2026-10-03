/**
 * authorize.ts — OAuth 2.1 Authorization Endpoint
 *
 * Handles GET /authorize (display consent UI) and
 * POST /authorize (process user approval).
 *
 * Spec compliance:
 *   - OAuth 2.1 §4.1 — Authorization Code Flow
 *   - RFC 7636  — PKCE (S256 only)
 *   - RFC 6819  — CSRF via state + __Host- cookie
 *   - RFC 9700  — Security Best Current Practice
 */

import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  OAUTH_KV: KVNamespace;
  BASE_URL: string;       // e.g. https://triadicframeworks.com
  CSRF_SECRET: string;    // random 32-byte hex secret in wrangler secret
}

const CSRF_COOKIE   = "__Host-CSRF_TOKEN";
const CSRF_TTL_SECS = 600;

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function AuthHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext & { oauthRequest: AuthRequest; oauth: OAuthHelpers }
): Promise<Response> {
  const url   = new URL(request.url);
  const oaReq = ctx.oauthRequest;

  switch (request.method) {
    case "GET":  return handleConsentPage(request, url, oaReq, env);
    case "POST": return handleConsentSubmit(request, url, oaReq, env, ctx);
    default:     return new Response("Method Not Allowed", { status: 405 });
  }
}

// ─── GET /authorize — Render Consent Page ─────────────────────────────────────

async function handleConsentPage(
  request: Request,
  url: URL,
  oaReq: AuthRequest,
  env: Env
): Promise<Response> {
  const csrfToken = await generateCsrfToken(env.CSRF_SECRET);

  const scopeDescriptions: Record<string, string> = {
    read:  "Read-only access to MCP tools and resources",
    write: "Read and write access — allows tools that modify state",
    admin: "Full administrative access including configuration tools",
  };

  const requestedScopes = (oaReq.scope ?? "read").split(" ").filter(Boolean);
  const scopeRows = requestedScopes.map((s) => `
    <li class="scope-item">
      <input type="hidden" name="granted_scopes" value="${escHtml(s)}" />
      <span class="scope-name">${escHtml(s)}</span>
      <span class="scope-desc">${escHtml(scopeDescriptions[s] ?? s)}</span>
    </li>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize — Triadic Frameworks</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f4f5f7;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 1.5rem;
    }
    .card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.1);
      max-width: 440px; width: 100%; padding: 2rem;
    }
    .logo { font-size: 1.4rem; font-weight: 700; color: #1a1a2e; margin-bottom: .25rem; }
    .subtitle { font-size: .875rem; color: #6b7280; margin-bottom: 1.75rem; }
    h1 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #111; }
    .client-name {
      display: inline-block; background: #eff6ff; color: #1d4ed8;
      padding: .25rem .6rem; border-radius: 6px;
      font-size: .875rem; font-weight: 600; margin-bottom: 1.25rem;
    }
    .section-label {
      font-size: .75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .05em; color: #6b7280; margin-bottom: .5rem;
    }
    ul.scope-list { list-style: none; margin-bottom: 1.75rem; }
    .scope-item {
      display: flex; flex-direction: column;
      padding: .65rem .75rem; border: 1px solid #e5e7eb;
      border-radius: 8px; margin-bottom: .5rem;
    }
    .scope-name { font-size: .875rem; font-weight: 600; color: #111; }
    .scope-desc { font-size: .8rem; color: #6b7280; margin-top: .2rem; }
    .actions { display: flex; gap: .75rem; }
    button {
      flex: 1; padding: .65rem 1rem; border: none; border-radius: 8px;
      font-size: .9rem; font-weight: 600; cursor: pointer; transition: opacity .15s;
    }
    button:hover { opacity: .88; }
    .btn-allow { background: #2563eb; color: #fff; }
    .btn-deny  { background: #f3f4f6; color: #374151; }
    .footer { font-size: .75rem; color: #9ca3af; margin-top: 1.25rem; text-align: center; }
    .footer a { color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Triadic Frameworks</div>
    <div class="subtitle">triadicframeworks.com</div>
    <h1>Authorization Request</h1>
    <div class="client-name">${escHtml(oaReq.clientId)}</div>
    <p style="font-size:.875rem;color:#374151;margin-bottom:1.25rem;">
      This client is requesting access to your account with the following permissions:
    </p>
    <p class="section-label">Requested Scopes</p>
    <ul class="scope-list">${scopeRows}</ul>
    <form method="POST" action="/authorize">
      <input type="hidden" name="csrf_token"            value="${escHtml(csrfToken)}" />
      <input type="hidden" name="client_id"             value="${escHtml(oaReq.clientId)}" />
      <input type="hidden" name="redirect_uri"          value="${escHtml(oaReq.redirectUri ?? "")}" />
      <input type="hidden" name="state"                 value="${escHtml(oaReq.state ?? "")}" />
      <input type="hidden" name="scope"                 value="${escHtml(oaReq.scope ?? "")}" />
      <input type="hidden" name="code_challenge"        value="${escHtml((oaReq as any).codeChallenge ?? "")}" />
      <input type="hidden" name="code_challenge_method" value="S256" />
      <div class="actions">
        <button type="submit" name="decision" value="deny"  class="btn-deny">Deny</button>
        <button type="submit" name="decision" value="allow" class="btn-allow">Allow Access</button>
      </div>
    </form>
    <p class="footer">
      By clicking Allow, you agree to the
      <a href="/policy">Privacy Policy</a> and <a href="/tos">Terms of Service</a>.
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": `${CSRF_COOKIE}=${csrfToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${CSRF_TTL_SECS}`,
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ─── POST /authorize — Process Consent ────────────────────────────────────────

async function handleConsentSubmit(
  request: Request,
  url: URL,
  oaReq: AuthRequest,
  env: Env,
  ctx: ExecutionContext & { oauth: OAuthHelpers }
): Promise<Response> {
  const body          = await request.formData();
  const decision      
