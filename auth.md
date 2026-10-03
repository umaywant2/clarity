# auth.md — Triadic Frameworks MCP Server Authentication

This document is a **standalone, self-contained** reference for authenticating AI agent clients against the Triadic Frameworks MCP server at `https://triadicframeworks.com/mcp`.

---

## Overview

The MCP server implements OAuth 2.1 with PKCE (S256), Dynamic Client Registration (RFC 7591), and Protected Resource Metadata (RFC 9728). It acts as both:

- **Protected Resource** — requires a valid Bearer token on `/mcp`
- **Authorization Server** — issues and validates its own access tokens

---

## Endpoints

| Role | Path | Spec |
|---|---|---|
| Protected Resource Metadata | `/.well-known/oauth-protected-resource` | RFC 9728 |
| Authorization Server Metadata | `/.well-known/oauth-authorization-server` | RFC 8414 |
| Authorization | `/authorize` | OAuth 2.1 |
| Token | `/token` | OAuth 2.1 |
| Registration | `/register` | RFC 7591 |
| MCP API | `/mcp` | MCP 2026-07-28 |

---

<!-- registration-flow -->
## Standalone Registration Flow

A complete, self-contained walkthrough. Run each step in order. No prior setup required.

---

## Step 1: Probe the Resource (Detect 401)

```bash
curl -sI https://triadicframeworks.com/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Expected:
```
HTTP/2 401
www-authenticate: Bearer resource_metadata="https://triadicframeworks.com/.well-known/oauth-protected-resource"
```

Parse `resource_metadata` from the `WWW-Authenticate` header.

---

## Step 2: Fetch Protected Resource Metadata

```bash
curl -s https://triadicframeworks.com/.well-known/oauth-protected-resource \
  -H "Accept: application/json"
```

Use `authorization_servers[0]` as the issuer base URL.

---

## Step 3: Fetch Authorization Server Metadata

```bash
curl -s https://triadicframeworks.com/.well-known/oauth-authorization-server \
  -H "Accept: application/json"
```

Verify `"none"` in `token_endpoint_auth_methods_supported`, `"S256"` in `code_challenge_methods_supported`, and `registration_endpoint` is present.

---

## Step 4: Dynamic Client Registration

```bash
curl -s -X POST https://triadicframeworks.com/register \
  -H "Content-Type: application/json" \
  -d '{
    "redirect_uris": ["http://localhost:8400/callback"],
    "client_name": "My MCP Agent",
    "token_endpoint_auth_method": "none",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "read write"
  }'
```

Save the returned `client_id`.

---

## Step 5: Generate PKCE Parameters

```bash
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=+/' | tr -d '\n' | head -c 43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -binary -sha256 | openssl base64 | tr -d '=' | tr '+/' '-_' | tr -d '\n')
```

`code_challenge` must begin with `[a-zA-Z0-9]`; regenerate if it starts with `-` or `_`.

---

## Step 6: Start Local Listener and Request Authorization

```bash
STATE=$(openssl rand -hex 16)
open "https://triadicframeworks.com/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback&scope=read%20write&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"
```

Start `nc -l 8400` in a separate terminal. Validate the returned `state` before continuing.

---

## Step 7: Exchange Authorization Code for Access Token

```bash
curl -s -X POST https://triadicframeworks.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=http%3A%2F%2Flocalhost%3A8400%2Fcallback" \
  -d "client_id=${CLIENT_ID}" \
  -d "code_verifier=${CODE_VERIFIER}"
```

---

## Step 8: Call the MCP API

```bash
curl -s -X POST https://triadicframeworks.com/mcp \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## Step 9: Refresh the Access Token

```bash
curl -s -X POST https://triadicframeworks.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=${REFRESH_TOKEN}" \
  -d "client_id=${CLIENT_ID}"
```

---

## Quick Reference: Full Flow Summary

```
1. curl -sI https://triadicframeworks.com/mcp                                     # Detect 401 + WWW-Authenticate
2. curl -s https://triadicframeworks.com/.well-known/oauth-protected-resource     # Get authorization server
3. curl -s https://triadicframeworks.com/.well-known/oauth-authorization-server   # Get endpoints + agent_auth
4. POST https://triadicframeworks.com/register                                    # Register public client → client_id
5. Generate PKCE code_verifier + challenge                                        # S256, alphanumeric start
6. Start localhost:8400 listener; open authorization URL in browser               # Catch callback with auth code
7. POST https://triadicframeworks.com/token (code + code_verifier)                # Exchange for access_token
8. POST https://triadicframeworks.com/mcp (Authorization: Bearer)                 # Call MCP API
9. POST https://triadicframeworks.com/token (grant_type=refresh_token)            # Renew access_token
```
