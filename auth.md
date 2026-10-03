# auth.md — Triadic Frameworks MCP Server Authentication

This document describes the complete OAuth 2.1 authentication and authorization configuration for the Triadic Frameworks MCP server, deployed on Cloudflare Workers using the [`@cloudflare/workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider) library.

---

## Overview

The MCP server at `https://triadicframeworks.com/mcp` acts as both:

- **Protected Resource** — serves MCP tools and data behind OAuth 2.1 bearer tokens.
- **Authorization Server** — issues and validates its own access tokens via the workers-oauth-provider.

Clients discover all OAuth endpoints automatically through standard metadata documents, requiring no out-of-band configuration.

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

## Complete Standalone Registration Flow

A self-contained walkthrough for registering a new client and obtaining an access token with no prior configuration. Follow each step in sequence.

### Step 1 — Discover the Protected Resource

Fetch the protected resource metadata to confirm the authorized AS:

```http
GET /.well-known/oauth-protected-resource HTTP/1.1
Host: triadicframeworks.com
Accept: application/json
```

Response (`200 OK`):

```json
{
  "resource": "https://triadicframeworks.com",
  "resource_name": "Triadic Frameworks MCP Server",
  "authorization_servers": ["https://triadicframeworks.com"],
  "scopes_supported": ["read", "write", "admin"],
  "bearer_methods_supported": ["header"],
  "dpop_signing_alg_values_supported": ["ES256", "RS256"]
}
```

Note the `authorization_servers` value — use it as the base URL for all subsequent steps.

### Step 2 — Discover the Authorization Server

```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: triadicframeworks.com
Accept: application/json
```

Response (`200 OK`):

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

### Step 3 — Register the Client (RFC 7591 Dynamic Client Registration)

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

Response (`201 Created`):

```json
{
  "client_id": "01HZXXXXXXXXXXXXXXXXXXXXXX",
  "redirect_uris": ["https://client.example.com/callback"],
  "client_name": "My MCP Client",
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

Save the `client_id` — required for all subsequent requests.

### Step 4 — Generate PKCE Parameters

```
code_verifier  = base64url( random_bytes(32) )           # store securely
code_challenge = base64url( SHA-256( code_verifier ) )   # send to /authorize
```

### Step 5 — Request Authorization

```http
GET /authorize
  ?response_type=code
  &client_id=01HZXXXXXXXXXXXXXXXXXXXXXX
  &redirect_uri=https%3A%2F%2Fclient.example.com%2Fcallback
  &scope=read%20write
  &state=RANDOM_CSRF_STATE
  &code_challenge=BASE64URL_SHA256_OF_VERIFIER
  &code_challenge_method=S256 HTTP/1.1
Host: triadicframeworks.com
```

After user consent, redirects to:

```
https://client.example.com/callback?code=AUTH_CODE&state=RANDOM_CSRF_STATE
```

**Validate** the returned `state` matches before continuing.

### Step 6 — Exchange Authorization Code for Access Token

```http
POST /token HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcallback
&client_id=01HZXXXXXXXXXXXXXXXXXXXXXX
&code_verifier=ORIGINAL_CODE_VERIFIER
```

Response (`200 OK`):

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200..."
}
```

### Step 7 — Call the MCP API

```http
POST /mcp HTTP/1.1
Host: triadicframeworks.com
Authorization: Bearer eyJhbGciOiJFUzI1NiJ9...
Content-Type: application/json

{"jsonrpc":"2.0","method":"tools/list","id":1}
```

Response (`200 OK`):

```json
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

### Step 8 — Refresh the Access Token

```http
POST /token HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=def50200...
&client_id=01HZXXXXXXXXXXXXXXXXXXXXXX
```

Response (`200 OK`):

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiJ9...NEW",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...NEW"
}
```

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
- `resource` — REQUIRED (RFC 9728 §2). Must byte-match the origin used to build the well-known URL. No trailing slash.
- `resource_name` — RECOMMENDED. Human-readable label for consent UIs.
- `authorization_servers` — JSON array of permitted AS issuer identifiers.
- `scopes_supported` — RECOMMENDED. Advertises available scopes.
- `bearer_methods_supported` — `header` only. Query string/body rejected.
- `dpop_signing_alg_values_supported` — Enables optional DPoP (RFC 9449).

---

## Scopes

| Scope | Description |
|---|---|
| `read` | Read-only access to MCP tools and resources |
| `write` | Read and write access; allows tools that modify state |
| `admin` | Full administrative access including configuration tools |

---

## WWW-Authenticate on 401

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://triadicframeworks.com/.well-known/oauth-protected-resource"
```

Per RFC 9728 §5, clients MUST re-fetch protected resource metadata and restart from Step 1.

---

## Security Requirements

| Requirement | Detail |
|---|---|
| PKCE | `S256` required on all `/authorize` requests; `plain` rejected |
| CSRF | `__Host-CSRF_TOKEN` cookie (HttpOnly, Secure, SameSite=Lax) echoed in form POST |
| State | Cryptographically random; validated on callback |
| Redirect URI | Exact match only; partial matches and open redirects rejected |
| Cookies | `__Host-` prefix on all server-set cookies |

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

---

## References

- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728) (April 2025)
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration](https://www.rfc-editor.org/rfc/rfc7591)
- [RFC 9449 — OAuth 2.0 DPoP](https://www.rfc-editor.org/rfc/rfc9449)
- [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700)
- [MCP Authorization Spec (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [Cloudflare workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)
- [Cloudflare Agents Authorization Docs](https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/)
