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
