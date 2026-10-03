/**
 * register.ts — OAuth 2.1 Dynamic Client Registration Endpoint
 *
 * POST /register — register a new client (RFC 7591)
 * GET  /register?client_id=... — read back a registration (RFC 7592)
 *
 * KV storage layout:
 *   client:{client_id} → JSON ClientRecord  (no TTL — permanent)
 */

export interface Env {
  OAUTH_KV: KVNamespace;
  BASE_URL: string;
}

interface ClientRecord {
  client_id:                   string;
  client_id_issued_at:         number;
  redirect_uris:               string[];
  client_name:                 string;
  client_uri?:                 string;
  logo_uri?:                   string;
  tos_uri?:                    string;
  policy_uri?:                 string;
  contacts?:                   string[];
  grant_types:                 string[];
  response_types:              string[];
  scope:                       string;
  token_endpoint_auth_method:  string;
  application_type:            string;
  registration_client_uri:     string;
  registration_access_token:   string;
}

const SUPPORTED_GRANT_TYPES    = new Set(["authorization_code", "refresh_token"]);
const SUPPORTED_RESPONSE_TYPES = new Set(["code"]);
const SUPPORTED_AUTH_METHODS   = new Set(["none", "client_secret_basic", "client_secret_post"]);
const ALLOWED_SCOPES           = new Set(["read", "write", "admin"]);
const MAX_REDIRECT_URIS        = 10;
const MAX_STRING_LEN           = 2048;

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function RegisterHandler(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  if (request.method === "OPTIONS") return corsPreflight();
  if (request.method === "GET")     return handleGetClient(request, env);
  if (request.method !== "POST")    return regError("invalid_request", "Method Not Allowed", 405);

  if (!(request.headers.get("Content-Type") ?? "").includes("application/json")) {
    return regError("invalid_request", "Content-Type must be application/json", 400);
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return regError("invalid_request", "Request body must be valid JSON", 400); }

  return handleRegister(body, env);
}

// ─── POST /register ───────────────────────────────────────────────────────────

async function handleRegister(body: Record<string, unknown>, env: Env): Promise<Response> {
  // redirect_uris — REQUIRED
  const redirectUris = body.redirect_uris as string[] | undefined;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
    return regError("invalid_redirect_uri", "redirect_uris is required and must be a non-empty array", 400);
  }
  if (redirectUris.length > MAX_REDIRECT_URIS) {
    return regError("invalid_redirect_uri", `Maximum ${MAX_REDIRECT_URIS} redirect_uris allowed`, 400);
  }
  for (const uri of redirectUris) {
    const err = validateRedirectUri(uri);
    if (err) return regError("invalid_redirect_uri", err, 400);
  }

  // grant_types
  const grantTypes = (body.grant_types as string[] | undefined) ?? ["authorization_code"];
  for (const g of grantTypes) {
    if (!SUPPORTED_GRANT_TYPES.has(g)) {
      return regError("invalid_client_metadata", `Unsupported grant_type: ${g}`, 400);
    }
  }

  // response_types
  const responseTypes = (body.response_types as string[] | undefined) ?? ["code"];
  for (const r of responseTypes) {
    if (!SUPPORTED_RESPONSE_TYPES.has(r)) {
      return regError("invalid_client_metadata", `Unsupported response_type: ${r}`, 400);
    }
  }

  // token_endpoint_auth_method
  const authMethod = (body.token_endpoint_auth_method as string | undefined) ?? "none";
  if (!SUPPORTED_AUTH_METHODS.has(authMethod)) {
    return regError("invalid_client_metadata", `Unsupported token_endpoint_auth_method: ${authMethod}`, 400);
  }

  // scope — filter to allowed values only
  const requestedScopes = ((body.scope as string | undefined) ?? "read").split(" ").filter(Boolean);
  const grantedScopes   = requestedScopes.filter(s => ALLOWED_SCOPES.has(s));
  if (grantedScopes.length === 0) {
    return regError("invalid_client_metadata", `No valid scopes. Supported: ${[...ALLOWED_SCOPES].join(", ")}`, 400);
  }

  // Optional HTTPS URI fields
  for (const field of ["client_uri", "logo_uri", "tos_uri", "policy_uri"] as const) {
    const val = body[field] as string | undefined;
    if (val) {
      if (val.length > MAX_STRING_LEN) return regError("invalid_client_metadata", `${field} too long`, 400);
      if (!isHttpsUri(val))            return regError("invalid_client_metadata", `${field} must be HTTPS`, 400);
    }
  }

  const clientId              = await generateId(24);
  const registrationToken     = await generateId(32);
  const issuedAt              = Math.floor(Date.now() / 1000);

  const record: ClientRecord = {
    client_id:                  clientId,
    client_id_issued_at:        issuedAt,
    redirect_uris:              redirectUris,
    client_name:                (body.client_name as string | undefined) ?? "Unnamed Client",
    grant_types:                grantTypes,
    response_types:             responseTypes,
    scope:                      grantedScopes.join(" "),
    token_endpoint_auth_method: authMethod,
    application_type:           (body.application_type as string | undefined) ?? "web",
    registration_client_uri:    `${env.BASE_URL}/register?client_id=${clientId}`,
    registration_access_token:  registrationToken,
  };

  if (body.client_uri)  record.client_uri  = body.client_uri as string;
  if (body.logo_uri)    record.logo_uri    = body.logo_uri as string;
  if (body.tos_uri)     record.tos_uri     = body.tos_uri as string;
  if (body.policy_uri)  record.policy_uri  = body.policy_uri as string;
  if (Array.isArray(body.contacts)) record.contacts = (body.contacts as string[]).slice(0, 5);

  await env.OAUTH_KV.put(`client:${clientId}`, JSON.stringify(record));

  return Response.json(record, {
    status: 201,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

// ─── GET /register?client_id=... (RFC 7592) ───────────────────────────────────

async function handleGetClient(request: Request, env: Env): Promise<Response> {
  const clientId = new URL(request.url).searchParams.get("client_id");
  if (!clientId) return regError("invalid_request", "client_id required", 400);

  const bearerToken = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/, "");
  if (!bearerToken) {
    return new Response(
      JSON.stringify({ error: "invalid_token", error_description: "Registration access token required" }),
      { status: 401, headers: { "Content-Type": "application/json", "WWW-Authenticate": "Bearer", "Cache-Control": "no-store" } }
    );
  }

  const raw = await env.OAUTH_KV.get(`client:${clientId}`);
  if (!raw) return regError("invalid_client_id", "Client not found", 404);

  const record = JSON.parse(raw) as ClientRecord;
  if (!(await constantTimeEqual(bearerToken, record.registration_access_token))) {
    return regError("invalid_token", "Invalid registration access token", 401);
  }

  const { registration_access_token: _rat, ...safeRecord } = record;
  return Response.json(safeRecord, {
    status: 200,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRedirectUri(uri: string): string | null {
  let parsed: URL;
  try { parsed = new URL(uri); } catch { return `Invalid redirect_uri: '${uri}'`; }
  if (parsed.hash) return `redirect_uri must not contain a fragment: '${uri}'`;
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocalhost) return `redirect_uri must use HTTPS: '${uri}'`;
  if (uri.length > MAX_STRING_LEN) return `redirect_uri exceeds max length`;
  return null;
}

function isHttpsUri(uri: string): boolean {
  try { return new URL(uri).protocol === "https:"; } catch { return false; }
}

// ─── Crypto ───────────────────────────────────────────────────────────────────

async function generateId(bytes: number): Promise<string> {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode("ct"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const [sa, sb] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(a)),
    crypto.subtle.sign("HMAC", key, enc.encode(b)),
  ]);
  const [va, vb] = [new Uint8Array(sa), new Uint8Array(sb)];
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function regError(error: string, description: string, status: number): Response {
  return Response.json({ error, error_description: description }, {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
