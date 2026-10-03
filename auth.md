## `auth.md`

```markdown
# Authentication — Triadic Frameworks MCP Server

This document describes the complete OAuth 2.1 authentication and authorization
configuration for the Triadic Frameworks MCP server, deployed on Cloudflare Workers
using the `@cloudflare/workers-oauth-provider` library.

---

## Overview

The MCP server at `https://triadicframeworks.com/mcp` acts as both:

- **Protected Resource** — serves MCP tools and data behind OAuth 2.1 bearer tokens.
- **Authorization Server** — issues and validates its own access tokens via
  workers-oauth-provider.

Clients discover all OAuth endpoints automatically through standard metadata
documents, requiring no out-of-band configuration.

---

## Discovery Endpoints

| Endpoint | URL | Spec |
|---|---|---|
| Protected Resource Metadata | `https://triadicframeworks.com/.well-known/oauth-protected-resource` | RFC 9728 |
| Authorization Server Metadata | `https://triadicframeworks.com/.well-known/oauth-authorization-server` | RFC 8414 |

Both documents are served over HTTPS with `Content-Type: application/json` and `200 OK`.

---

## OAuth 2.1 Endpoints

| Role | Path | Description |
|---|---|---|
| Authorization | `/authorize` | Displays consent UI; issues authorization code |
| Token | `/token` | Exchanges code or refresh token for access token |
| Registration | `/register` | Dynamic Client Registration (RFC 7591) |
| MCP API | `/mcp` | Protected MCP endpoint (requires valid bearer token) |

---

## Protected Resource Metadata (RFC 9728)

Published at `/.well-known/oauth-protected-resource`.

```json
{
  "resource": "https://triadicframeworks.com",
  "resource_name": "Triadic Frameworks MCP Server",
  "authorization_servers": ["https://triadicframeworks.com"],
  "scopes_supported": ["read", "write", "admin"],
  "bearer_methods_supported": ["header"],
  "dpop_signing_alg_values_supported": ["ES256", "RS256"],
  "resource_documentation": "https://triadicframeworks.com/docs",
  "resource_policy_uri": "https://triadicframeworks.com/policy",
  "resource_tos_uri": "https://triadicframeworks.com/tos"
}
```

**Field notes:**
- `resource` — REQUIRED per RFC 9728 §2. Must exactly match the resource
  identifier used to construct the well-known URL. Clients MUST reject the
  document if this value does not match.
- `resource_name` — RECOMMENDED per RFC 9728 §2. Human-readable label for
  consent UIs.
- `authorization_servers` — Lists permitted AS issuer identifiers. Matches the
  base origin because the MCP server is its own AS.
- `scopes_supported` — RECOMMENDED. Advertises available scopes; see Scopes.
- `bearer_methods_supported` — Only `header` accepted. Token in query string
  or body is rejected.
- `dpop_signing_alg_values_supported` — Algorithms accepted for DPoP proof
  JWTs (RFC 9449). DPoP optional but recommended for public clients.

---

## Authorization Server Metadata (RFC 8414)

Published at `/.well-known/oauth-authorization-server` by workers-oauth-provider.

Key fields emitted:

```json
{
  "issuer": "https://triadicframeworks.com",
  "authorization_endpoint": "https://triadicframeworks.com/authorize",
  "token_endpoint": "https://triadicframeworks.com/token",
  "registration_endpoint": "https://triadicframeworks.com/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "scopes_supported": ["read", "write", "admin"]
}
```

> **Note:** PKCE with `S256` is REQUIRED for all clients per OAuth 2.1. Plain
> PKCE (`plain`) is not accepted.

---

## Dynamic Client Registration (RFC 7591)

Clients with no prior registration self-register at `/register`:

```http
POST /register HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/json

{
  "redirect_uris": ["https://client.example.com/callback"],
  "client_name": "My MCP Client",
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

A successful `201 Created` returns `client_id`. Public clients set
`token_endpoint_auth_method` to `"none"`.

---

## Scopes

| Scope | Description |
|---|---|
| `read` | Read-only access to MCP tools and resources |
| `write` | Read + write; allows tools that modify state |
| `admin` | Full administrative access including configuration tools |

Clients SHOULD request the minimum set of scopes needed (RFC 9700 §2.3).

---

## Authorization Flow

```
MCP Client                    MCP Server (AS + RS)
    │                                │
    │── GET /.well-known/... ────────▶│  Discover endpoints
    │◀─ 200 metadata JSON ───────────│
    │                                │
    │── POST /register ──────────────▶│  Dynamic client registration
    │◀─ 201 { client_id } ───────────│
    │                                │
    │── GET /authorize?              │
    │     client_id=...              │
    │     code_challenge=...         │
    │     scope=read write ─────────▶│  User consent page
    │◀─ 302 → /callback?code=... ───│
    │                                │
    │── POST /token                  │
    │     code=...                   │
    │     code_verifier=... ─────────▶│  PKCE verification + token issuance
    │◀─ 200 { access_token } ───────│
    │                                │
    │── POST /mcp                    │
    │     Authorization: Bearer ... ▶│  MCP tool call
    │◀─ 200 MCP response ───────────│
```

---

## Token Usage

Access tokens submitted as Bearer in the `Authorization` header only:

```http
POST /mcp HTTP/1.1
Host: triadicframeworks.com
Authorization: Bearer <access_token>
Content-Type: application/json

{"jsonrpc":"2.0","method":"tools/list","id":1}
```

Tokens via query string or request body are rejected with `400 Bad Request`.

---

## WWW-Authenticate on 401

When an unauthenticated request reaches `/mcp`:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://triadicframeworks.com/.well-known/oauth-protected-resource"
```

Per RFC 9728 §5, clients receiving this header MUST re-fetch protected resource
metadata before retrying the authorization flow.

---

## Security Requirements

### PKCE
All authorization requests MUST include `code_challenge` (`S256` method).
Requests without PKCE are rejected.

### CSRF Protection
The `/authorize` endpoint sets an `__Host-CSRF_TOKEN` cookie (HttpOnly, Secure,
SameSite=Lax) when rendering the consent form. The token must be echoed back
in the form POST.

### State Parameter
Clients MUST include a cryptographically random `state` parameter and validate
it on callback.

### Redirect URI Matching
Redirect URIs must exactly match a URI registered during client registration.
Partial matches and open redirects are rejected.

### Cookie Prefixes
All server-set cookies use the `__Host-` prefix, preventing subdomain attacks.

---

## Cloudflare Worker Configuration

```typescript
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { MyMCPServer } from "./mcp";
import { AuthHandler } from "./auth-handler";

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: MyMCPServer.serve("/mcp"),
  defaultHandler: AuthHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
```

`OAuthProvider` automatically serves `/.well-known/oauth-authorization-server`,
handles token issuance and validation, enforces PKCE, and protects `/mcp` before
passing requests to `MyMCPServer`.

---

## References

- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728) (April 2025)
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration](https://www.rfc-editor.org/rfc/rfc7591)
- [RFC 9449 — OAuth 2.0 DPoP](https://www.rfc-editor.org/rfc/rfc9449)
- [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700)
- [RFC 8707 — Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707)
- [MCP Authorization Spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [cloudflare/workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)
- [Cloudflare Agents Authorization Docs](https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/)
```
