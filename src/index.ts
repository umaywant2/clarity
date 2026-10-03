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

const WELL_KNOWN_HEADERS = {
  "Content-Type":                 "application/json",
  "Cache-Control":                "no-store",
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept",
};

const oauthProvider = new OAuthProvider({
  apiRoute:                   "/mcp",
  apiHandler:                 mcpHandler,
  defaultHandler:             AuthHandler,
  authorizeEndpoint:          "/authorize",
  tokenEndpoint:              "/token",
  clientRegistrationEndpoint: "/register",
});

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
    // Self-contained: OAuthProvider does NOT serve RFC 9728.
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
    // Self-contained: do NOT proxy through oauthProvider.fetch() — fragile
    // before first deploy and loses agent_auth injection on any error.
    if (path === "/.well-known/oauth-authorization-server") {
      return Response.json(
        {
          // RFC 8414 standard fields
          issuer:                                base,
          authorization_endpoint:               `${base}/authorize`,
          token_endpoint:                       `${base}/token`,
          registration_endpoint:                `${base}/register`,
          response_types_supported:             ["code"],
          grant_types_supported:                ["authorization_code", "refresh_token"],
          code_challenge_methods_supported:     ["S256"],
          token_endpoint_auth_methods_supported: ["none"],
          scopes_supported:                     ["read", "write", "admin"],
          // Cloudflare Agent Readiness extension
          agent_auth: {
            type:         "oauth2",
            register_uri: `${base}/register`,   // ← required by Agent Readiness validator
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
    // Handles: GET/POST /authorize, POST /mcp (after bearer token check)
    return oauthProvider.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
