# auth.md

You are an agent. This service supports **OAuth 2.1 + PKCE + Dynamic Client Registration**: discover → register → authorize → exchange → call API → refresh. Follow the steps in order; do not skip ahead.

- **Resource:** `https://triadicframeworks.com`
- **MCP endpoint:** `https://triadicframeworks.com/mcp`
- **Protocol:** OAuth 2.1 + PKCE (S256) + Dynamic Client Registration (RFC 7591)
- **Discovery:** RFC 9728 Protected Resource Metadata · RFC 8414 AS Metadata

## Step 1 — Discover

Discovery is two hops. Call the MCP endpoint without a token — the 401 response carries a `WWW-Authenticate` header with the Protected Resource Metadata URL.

### 1a. Probe the resource

```http
POST /mcp HTTP/2
Host: triadicframeworks.com
Content-Type: application/json

{"jsonrpc":"2.0","method":"tools/list","id":1}
```

Expected response: `HTTP/2 401` with header:

```
www-authenticate: Bearer resource_metadata="https://triadicframeworks.com/.well-known/oauth-protected-resource"
```

### 1b. Fetch Protected Resource Metadata (RFC 9728)

```http
GET /.well-known/oauth-protected-resource HTTP/2
Host: triadicframeworks.com
Accept: application/json
```

Response:

```json
{
  "resource": "https://triadicframeworks.com",
  "authorization_servers": ["https://triadicframeworks.com"],
  "scopes_supported": ["read", "write", "admin"],
  "bearer_methods_supported": ["header"]
}
```

Use `authorization_servers[0]` as the AS base URL.

### 1c. Fetch Authorization Server Metadata (RFC 8414)

```http
GET /.well-known/oauth-authorization-server HTTP/2
Host: triadicframeworks.com
Accept: application/json
```

Confirm `registration_endpoint`, `authorization_endpoint`, `token_endpoint`, and the `agent_auth` block are all present before continuing.

## Step 2 — Register a dynamic client

POST to `registration_endpoint` (`/register`). Open registration — no client secret is issued.

```http
POST /register HTTP/2
Host: triadicframeworks.com
Content-Type: application/json

{
  "redirect_uris": ["http://localhost:8400/callback"],
  "client_name": "My MCP Agent",
  "token_endpoint_auth_method": "none",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "read write"
}
```

Response (`201 Created`):

```json
{
  "client_id": "01HZXXXXXXXXXXXXXXXXXXXXXX",
  "redirect_uris": ["http://localhost:8400/callback"],
  "token_endpoint_auth_method": "none",
  "scope": "read write"
}
```

Save `client_id`. No `client_secret` is issued.

## Step 3 — Generate PKCE parameters

OAuth 2.1 requires PKCE S256. `plain` is rejected.

```bash
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=+/' | tr -d '\n' | head -c 43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -binary -sha256 \
  | openssl base64 | tr -d '=' | tr '+/' '-_' | tr -d '\n')
STATE=$(openssl rand -hex 16)
```

## Step 4 — Request authorization

Start a local listener, then open the URL in a browser:

```bash
nc -l 8400
```

```
https://triadicframeworks.com/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback&scope=read%20write&state=STATE&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
```

After consent, the server redirects to `http://localhost:8400/callback?code=AUTH_CODE&state=STATE_VALUE`. Validate `state` before continuing.

## Step 5 — Exchange the authorization code

```http
POST /token HTTP/2
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=AUTH_CODE&redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback&client_id=CLIENT_ID&code_verifier=CODE_VERIFIER
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

Save both tokens. If `/token` returns `invalid_grant`, redo Steps 3 and 4.

## Step 6 — Call the MCP API

```http
POST /mcp HTTP/2
Host: triadicframeworks.com
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{"jsonrpc":"2.0","method":"tools/list","id":1}
```

Response (`200 OK`): `{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}`

If `/mcp` returns 401 on a previously-working token, go to Step 7.

## Step 7 — Refresh the access token

```http
POST /token HTTP/2
Host: triadicframeworks.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=REFRESH_TOKEN&client_id=CLIENT_ID
```

Response (`200 OK`): new `access_token` + `refresh_token`. Replace both stored values. If `/token` returns `invalid_grant`, restart at Step 2.

## Errors

| Code | Endpoint | What to do |
|---|---|---|
| `invalid_client` | `/token` | `client_id` not recognized. Re-register at Step 2. |
| `invalid_grant` | `/token` | Code expired or verifier mismatch. Redo Steps 3–4. |
| `access_denied` | `/authorize` | User denied consent. Do not retry silently. |

## Scopes

| Scope | Description |
|---|---|
| `read` | Read-only access to MCP tools and resources |
| `write` | Read and write access; allows tools that modify state |
| `admin` | Full administrative access including configuration tools |

## agent_auth

The `agent_auth` block in `/.well-known/oauth-authorization-server`:

```json
{
  "agent_auth": {
    "type": "oauth2",
    "register_uri": "https://triadicframeworks.com/register",
    "flows": {
      "authorizationCode": {
        "authorizationUrl": "https://triadicframeworks.com/authorize",
        "tokenUrl": "https://triadicframeworks.com/token",
        "scopes": {
          "read": "Read-only access to MCP tools and resources",
          "write": "Read and write access; allows tools that modify state",
          "admin": "Full administrative access including configuration tools"
        }
      }
    }
  }
}
```

## References

- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration](https://www.rfc-editor.org/rfc/rfc7591)
- [MCP Authorization Spec 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
