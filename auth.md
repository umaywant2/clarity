# auth.md

You are an agent. This service supports agentic registration via OAuth 2.1 + PKCE: discover → register → authorize → exchange → call API → refresh. Follow the steps in order; do not skip ahead.

Examples use `https://triadicframeworks.com` as both the resource server and authorization server.

## Step 1 — Discover

Discovery is two hops. The 401 response that pointed you here carries a `WWW-Authenticate` header with the PRM URL.

### 1a. Fetch the Protected Resource Metadata

```http
GET /.well-known/oauth-protected-resource HTTP/1.1
Host: triadicframeworks.com
Accept: application/json
```

Response shape:

```json
{
  "resource": "https://triadicframeworks.com",
  "resource_name": "Triadic Frameworks MCP Server",
  "authorization_servers": ["https://triadicframeworks.com"],
  "scopes_supported": ["read", "write", "admin"],
  "bearer_methods_supported": ["header"],
  "dpop_signing_alg_values_supported": ["ES256", "RS256"],
  "resource_documentation": "https://triadicframeworks.com/docs"
}
```

**What each field tells you:**

- `resource` — the canonical URL of this API. No trailing slash. Use as the `audience` parameter when requesting tokens.
- `authorization_servers` — base URL of the OAuth Authorization Server. Fetch `/.well-known/oauth-authorization-server` from this host (see 1b).
- `scopes_supported` — scopes the resource server accepts. Request only the subset you need.
- `bearer_methods_supported` — send the access token as `Authorization: Bearer <token>`.

### 1b. Fetch the Authorization Server Metadata

```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: triadicframeworks.com
Accept: application/json
```

Response shape:

```json
{
  "issuer": "https://triadicframeworks.com",
  "authorization_endpoint": "https://triadicframeworks.com/authorize",
  "token_endpoint": "https://triadicframeworks.com/token",
  "registration_endpoint": "https://triadicframeworks.com/register",
  "revocation_endpoint": "https://triadicframeworks.com/token/revoke",
  "scopes_supported": ["read", "write", "admin"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "agent_auth": {
    "register_uri": "https://triadicframeworks.com/register",
    "identity_types_supported": ["anonymous"],
    "skill": "https://triadicframeworks.com/auth.md"
  }
}
```

**What each field tells you:**

- `authorization_endpoint` — where you redirect for the consent step (Step 4).
- `token_endpoint` — where you exchange the authorization code for tokens (Step 5).
- `registration_endpoint` / `agent_auth.register_uri` — dynamic client registration endpoint (Step 2).
- `code_challenge_methods_supported` — `S256` only. Generate PKCE before Step 4.
- `agent_auth` — agent-specific extension block. `register_uri` is required for agent readiness.

## Step 2 — Register a dynamic client

Before you can request authorization you must register a client. This is a one-time step; cache `client_id` for reuse.

**Request:**

```http
POST /register HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/json
Accept: application/json

{
  "client_name": "My Agent Client",
  "redirect_uris": ["http://localhost:8400/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "read write"
}
```

**Response (201 Created):**

```json
{
  "client_id": "01JXXXXXXXXXXXXXXXXXXXXXXXXX",
  "client_name": "My Agent Client",
  "redirect_uris": ["http://localhost:8400/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "read write",
  "registration_access_token": "rat_XXXXXXXXXXXXXXXXXXXX",
  "registration_client_uri": "https://triadicframeworks.com/register?client_id=01JXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

Store `client_id` and `registration_access_token` securely. The `registration_access_token` authenticates future reads of this client record (RFC 7592).

**Read back your registration (RFC 7592):**

```http
GET /register?client_id=01JXXXXXXXXXXXXXXXXXXXXXXXXX HTTP/1.1
Host: triadicframeworks.com
Authorization: Bearer rat_XXXXXXXXXXXXXXXXXXXX
Accept: application/json
```

## Step 3 — Generate PKCE parameters

Generate a cryptographically random `code_verifier` (43–128 URL-safe characters), then derive `code_challenge`:

```bash
# Generate code_verifier
CODE_VERIFIER=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=')

# Derive code_challenge (S256)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')

echo "verifier: $CODE_VERIFIER"
echo "challenge: $CODE_CHALLENGE"
```

Hold `CODE_VERIFIER` in memory — you will send it at Step 5. Never log or persist it.

## Step 4 — Request authorization

Redirect the user (or open a local browser window) to the authorization endpoint with your PKCE challenge:

```http
GET /authorize?response_type=code
  &client_id=01JXXXXXXXXXXXXXXXXXXXXXXXXX
  &redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback
  &scope=read%20write
  &state=RANDOM_OPAQUE_STATE
  &code_challenge=CODE_CHALLENGE_HERE
  &code_challenge_method=S256 HTTP/1.1
Host: triadicframeworks.com
```

The user sees a consent page listing the requested scopes. On approval the server redirects to your `redirect_uri`:

```
http://localhost:8400/callback?code=AUTH_CODE_HERE&state=RANDOM_OPAQUE_STATE
```

Verify `state` matches what you sent before proceeding. Extract `code`.

## Step 5 — Exchange the authorization code

POST the code to the token endpoint along with your `code_verifier`:

```http
POST /token HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded
Accept: application/json

grant_type=authorization_code
&code=AUTH_CODE_HERE
&redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback
&client_id=01JXXXXXXXXXXXXXXXXXXXXXXXXX
&code_verifier=CODE_VERIFIER_HERE
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_XXXXXXXXXXXXXXXXXXXX",
  "scope": "read write"
}
```

Store `access_token` for immediate use and `refresh_token` for renewal (Step 7). The code is single-use; discard it after this call.

## Step 6 — Call the MCP API

Send the access token as a Bearer token on every request to `/mcp`:

```http
POST /mcp HTTP/1.1
Host: triadicframeworks.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "triadic_map",
    "arguments": {}
  }
}
```

**Response (200 OK):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Triadic Frameworks dimensional map: 0D–9D..."
      }
    ]
  }
}
```

If you receive `401 Unauthorized` with `WWW-Authenticate: Bearer error="invalid_token"`, your access token has expired — proceed to Step 7.

## Step 7 — Refresh the access token

When `expires_in` has elapsed or the server returns `invalid_token`, exchange your `refresh_token` for a fresh pair:

```http
POST /token HTTP/1.1
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded
Accept: application/json

grant_type=refresh_token
&refresh_token=rt_XXXXXXXXXXXXXXXXXXXX
&client_id=01JXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...NEW",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_YYYYYYYYYYYYYYYYYYYY",
  "scope": "read write"
}
```

Replace both tokens. If the refresh token itself is rejected (`invalid_grant`), restart the full flow from Step 2.

## Errors

Errors at `/token` use RFC 6749 standard vocabulary. Errors at `/register` follow RFC 7591.

| Code | Endpoint | Action |
|---|---|---|
| `invalid_client` | `/token` | `client_id` not recognized. Re-register at Step 2. |
| `invalid_grant` | `/token` | Code expired, replayed, or PKCE mismatch. Restart at Step 4. |
| `invalid_token` | `/mcp` | Access token expired or revoked. Refresh at Step 7. |
| `unsupported_grant_type` | `/token` | Only `authorization_code` and `refresh_token` are accepted. |
| `invalid_request` | any | Missing or malformed parameter. Check the request shape above. |
| `invalid_redirect_uri` | `/register` | Redirect URI must be HTTP/HTTPS; localhost is permitted. |
| `invalid_scope` | any | Only `read`, `write`, `admin` are valid. |

Retry policy: `5xx` → exponential backoff; `4xx` → fix the request, do not retry the same payload.

## Scopes

| Scope | Access |
|---|---|
| `read` | `triadic_map`, `evaluator_info`, `dimension_map`, `module_lookup`, `operator_lookup`, `canon_status` |
| `write` | All `read` tools plus `drift_evaluate`, `coherence_evaluate`, `regime_evaluate`, `clarity_evaluate`, `session_create`, `session_evaluate` |
| `admin` | All `write` tools plus `module_register`, `operator_register` |

Request the minimum scope required for your task.

## agent_auth

Machine-readable summary of the agent registration surface:

```json
{
  "agent_auth": {
    "register_uri": "https://triadicframeworks.com/register",
    "identity_types_supported": ["anonymous"],
    "skill": "https://triadicframeworks.com/auth.md",
    "anonymous": {
      "credential_types_supported": ["oauth2_access_token"],
      "registration_endpoint": "https://triadicframeworks.com/register",
      "token_endpoint": "https://triadicframeworks.com/token",
      "authorization_endpoint": "https://triadicframeworks.com/authorize",
      "pkce_required": true,
      "code_challenge_methods_supported": ["S256"]
    }
  }
}
```

## References

- [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) — OAuth 2.0 Protected Resource Metadata
- [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) — OAuth 2.0 Authorization Server Metadata
- [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591) — OAuth 2.0 Dynamic Client Registration
- [RFC 7592](https://www.rfc-editor.org/rfc/rfc7592) — OAuth 2.0 Dynamic Client Registration Management
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) — Proof Key for Code Exchange (PKCE)
- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) — The OAuth 2.0 Authorization Framework
- [MCP Specification](https://spec.modelcontextprotocol.io/) — Model Context Protocol
- [Triadic Frameworks Docs](https://triadicframeworks.com/docs) — Full API reference
```
