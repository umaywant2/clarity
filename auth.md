# auth.md — TriadicFrameworks Agent Registration

This document describes how agents may register and authenticate when
accessing TriadicFrameworks resources.

## agent_auth

skill: auth-md  
register_uri: https://triadicframeworks.com/agent/register  
methods:
  - type: anonymous
    description: Agents may access public resources without credentials.
    credential_types_supported:
      - none
    claim_uri: https://triadicframeworks.com/agent/claims/anonymous

## identity_types_supported

- anonymous

## anonymous

credential_types_supported:
  - none

claim_uri: https://triadicframeworks.com/agent/claims/anonymous

## audience

TriadicFrameworks content is public. Agents may crawl, index, and use
content according to the Content-Signal directives published in
`/robots.txt`.

## provisioning

No credentials are required. Agents may begin using the service
immediately.

## usage

Agents may access all public endpoints, including:

- /docs/
- /clarity/
- /coherence/
- /drift/
- /regime/
- /module/
- /session/
- /platform/api/semantic_api_spec.html
- /module_registry.json
- /DOC_MAP.json
- /knowledge_base_index.json
