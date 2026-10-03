/**
 * index.ts — Triadic Frameworks MCP Worker — Root Router
 *
 * Route table (all handled before OAuthProvider fallback):
 *
 *   GET  /.well-known/oauth-protected-resource   → RFC 9728 (self-contained)
 *   GET  /.well-known/oauth-authorization-server  → RFC 8414 + agent_auth (self-contained)
 *   POST /register                               → RFC 7591/7592 DCR
 *   POST /token                                  → OAuth 2.1 token endpoint
 *   *    /authorize                              → OAuthProvider consent UI
 *   *    /mcp                                    → OAuthProvider → mcpHandler
 *   OPTIONS *                                    → CORS preflight
 */

import { OAuthProvider }   from "@cloudflare/workers-oauth-provider";
import { AuthHandler }     from "./authorize";
import { TokenHandler }    from "./token";
import { RegisterHandler } from "./register";
import { mcpHandler }      from "./mcp";

export interface Env {
  OAUTH_KV:    KVNamespace;
  BASE_URL:    string;   // https://triadicframeworks.com  (no trailing slash)
  CSRF_SECRET: string;   // wrangler secret put CSRF_SECRET
}

// ─── Shared response headers for well-known endpoints ─────────────────────────

const WELL_KNOWN_HEADERS = {
  "Content-Type":                "application/json",
  "Cache-Control":               "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":"GET, OPTIONS",
  "Access-Control-Allow-Headers":"Accept",
};

// ─── RFC 9728 §5 — Link discovery header ──────────────────────────────────────
// Emitted on every /mcp response (200, 401, 403) so clients can discover the
// authorization server without relying solely on the WWW-Authenticate header.
// rel= values mirror their well-known path suffix per the IANA Link Relations
// registry: https://www.iana.org/assignments/link-relations/
function buildDiscoveryLink(base: string): string {
  return [
    `<${base}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
    `<${base}/.well-known/oauth-authorization-server>; rel="oauth-authorization-server"`,
    `<${base}/.well-known/api-catalog>; rel="api-catalog"`,
    `<${base}/openapi>; rel="service-desc"`,
    `<${base}/docs/api>; rel="service-doc"`,
    `<${base}/docs/si_knowledge_base.html>; rel="describedby"`,
  ].join(", ");
}

// ─── OAuth Provider (handles /authorize and /mcp after auth) ──────────────────

const oauthProvider = new OAuthProvider({
  apiRoute:                   "/mcp",
  apiHandler:                 mcpHandler,
  defaultHandler:             AuthHandler,
  authorizeEndpoint:          "/authorize",
  tokenEndpoint:              "/token",
  clientRegistrationEndpoint: "/register",
});

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const base   = env.BASE_URL ?? "https://triadicframeworks.com";
    const method = request.method;

    // ── Global CORS preflight ──────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
          "Access-Control-Max-Age":       "86400",
        },
      });
    }

    // ── RFC 9728 — Protected Resource Metadata ─────────────────────────────
    if (path === "/.well-known/oauth-protected-resource") {
      return Response.json(
        {
          resource:                          base,
          resource_name:                     "Triadic Frameworks MCP Server",
          authorization_servers:             [base],
          scopes_supported:                  ["read", "write", "admin"],
          bearer_methods_supported:          ["header"],
          dpop_signing_alg_values_supported: ["ES256", "RS256"],
          resource_documentation:            `${base}/docs`,
          resource_policy_uri:               `${base}/policy`,
          resource_tos_uri:                  `${base}/tos`,
        },
        { headers: WELL_KNOWN_HEADERS }
      );
    }

    // ── RFC 8414 — Authorization Server Metadata + agent_auth ─────────────
    if (path === "/.well-known/oauth-authorization-server") {
      return Response.json(
        {
          issuer:                                base,
          authorization_endpoint:               `${base}/authorize`,
          token_endpoint:                       `${base}/token`,
          registration_endpoint:                `${base}/register`,
          response_types_supported:             ["code"],
          grant_types_supported:                ["authorization_code", "refresh_token"],
          code_challenge_methods_supported:     ["S256"],
          token_endpoint_auth_methods_supported: ["none"],
          scopes_supported:                     ["read", "write", "admin"],
          agent_auth: {
            type:         "oauth2",
            register_uri: `${base}/register`,
            flows: {
              authorizationCode: {
                authorizationUrl: `${base}/authorize`,
                tokenUrl:         `${base}/token`,
                scopes: {
                  read:  "Read-only access to MCP tools and resources",
                  write: "Read and write access; allows tools that modify state",
                  admin: "Full administrative access including configuration tools",
                },
              },
            },
          },
        },
        { headers: WELL_KNOWN_HEADERS }
      );
    }

    // ── RFC 7591/7592 — Dynamic Client Registration ────────────────────────
    if (path === "/register") return RegisterHandler(request, env, ctx);

    // ── OAuth 2.1 Token Endpoint ───────────────────────────────────────────
    if (path === "/token") return TokenHandler(request, env, ctx as any);

    // ── Everything else → OAuthProvider ───────────────────────────────────
    const response = await oauthProvider.fetch(request, env, ctx);

    // Inject Link discovery header on all /mcp responses (any status code).
    // RFC 9728 §5: the protected resource SHOULD advertise its metadata URL
    // via a Link response header so clients can discover the AS without
    // needing a prior 401 WWW-Authenticate challenge.
    if (path.startsWith("/mcp")) {
      const headers = new Headers(response.headers);
      headers.set("Link", buildDiscoveryLink(base));
      return new Response(response.body, {
        status:     response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
