import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { AuthHandler }    from "./authorize";
import { TokenHandler }   from "./token";
import { RegisterHandler } from "./register";
import { MyMCPServer }    from "./mcp";

export interface Env {
  OAUTH_KV:     KVNamespace;
  BASE_URL:     string;
  CSRF_SECRET:  string;
}

const oauthProvider = new OAuthProvider({
  apiRoute:                   "/mcp",
  apiHandler:                 MyMCPServer.serve("/mcp"),
  defaultHandler:             AuthHandler,   // /authorize (GET + POST)
  authorizeEndpoint:          "/authorize",
  tokenEndpoint:              "/token",
  clientRegistrationEndpoint: "/register",
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ── /register — bypass OAuthProvider, handle directly (RFC 7591/7592)
    if (url.pathname === "/register") {
      return RegisterHandler(request, env, ctx);
    }

    // ── /token — bypass OAuthProvider, handle directly
    if (url.pathname === "/token") {
      return TokenHandler(request, env, ctx as any);
    }

    // ── Inject agent_auth into AS metadata (Cloudflare Agent Readiness)
    if (url.pathname === "/.well-known/oauth-authorization-server") {
      const base     = await oauthProvider.fetch(request, env, ctx);
      const metadata = await base.json() as Record<string, unknown>;
      metadata.agent_auth = {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: `${env.BASE_URL}/authorize`,
            tokenUrl:         `${env.BASE_URL}/token`,
            scopes: {
              read:  "Read-only access to MCP tools and resources",
              write: "Read and write access; allows tools that modify state",
              admin: "Full administrative access including configuration tools",
            },
          },
        },
      };
      return Response.json(metadata, {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
      });
    }

    // ── Everything else → OAuthProvider (handles /authorize, /mcp, /.well-known/*)
    return oauthProvider.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
