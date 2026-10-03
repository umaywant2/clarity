/**
 * mcp.ts — Triadic Frameworks MCP Server
 *
 * Tool taxonomy (13 tools, 3 scope tiers):
 *   read  — triadic_map | evaluator_info | dimension_map
 *           module_lookup | operator_lookup | canon_status
 *   write — drift_evaluate | coherence_evaluate | regime_evaluate
 *           clarity_evaluate | session_create
 *   admin — module_register | operator_register
 *
 * Spec: MCP 2026-07-28, Streamable HTTP transport, JSON-RPC 2.0
 * Evaluation: fully deterministic — no AI inference
 */

import { McpServer }                    from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z }                            from "zod";

export interface Env {
  OAUTH_KV: KVNamespace;
  BASE_URL: string;
}

export interface OAuthContext extends ExecutionContext {
  props?: {
    scope?:    string;
    sub?:      string;
    clientId?: string;
    [key: string]: unknown;
  };
}

// ─── Canon Constants ──────────────────────────────────────────────────────────

const CANON_VERSION  = "R5";
const CANON_NAME     = "Clarity Canon";
const SERVER_VERSION = "1.0.0";

const AXES = {
  S: { name: "Structure",  symbol: "S",
       description: "Form, stability, identity. The substrate of coherent thought.",
       properties: ["form", "stability", "identity", "substrate", "containment"] },
  R: { name: "Resonance",  symbol: "R",
       description: "Relation, alignment, coherence. The field between structures.",
       properties: ["relation", "alignment", "coherence", "field", "coupling"] },
  A: { name: "Activation", symbol: "A",
       description: "Motion, impulse, transformation. The vector that moves structures.",
       properties: ["motion", "impulse", "transformation", "vector", "change"] },
} as const;

const DIMENSIONS: Record<number, { label: string; description: string; axis: string }> = {
  0: { label: "0D — Point",      description: "Pure identity. No relation, no motion. The seed of structure.",               axis: "S"   },
  1: { label: "1D — Line",       description: "Single axis of relation. Linear coherence. Begins resonance.",               axis: "R"   },
  2: { label: "2D — Plane",      description: "Surface of interaction. Structure meets resonance. Field emerges.",          axis: "SR"  },
  3: { label: "3D — Volume",     description: "Activation enters. Three-axis triad complete. Full triadic space.",          axis: "SRA" },
  4: { label: "4D — Temporal",   description: "Motion through time. Activation becomes trajectory. Drift visible.",         axis: "A"   },
  5: { label: "5D — Contextual", description: "Regime awareness. Structural patterns across contexts.",                    axis: "SR"  },
  6: { label: "6D — Coherence",  description: "Multi-regime alignment. Deep resonance field stability.",                   axis: "R"   },
  7: { label: "7D — Evaluative", description: "RTT evaluator literacy. Drift, Coherence, Regime, Clarity as lived tools.", axis: "SRA" },
  8: { label: "8D — Canonical",  description: "Canon alignment. All outputs triadic-coherent across domains.",             axis: "SA"  },
  9: { label: "9D — Clarity",    description: "Full clarity. Deterministic, triadic, canonical — no drift, no noise.",     axis: "SRA" },
};

const EVALUATORS = {
  drift: {
    name: "Drift Evaluator", axis: "A",
    description: "Detects semantic, structural, or activation drift from the triadic baseline.",
    inputs:  ["text", "context", "baseline"],
    outputs: ["drift_score", "drift_type", "axis_deviation", "recommendations"],
    thresholds: { low: 0.2, medium: 0.5, high: 0.75 },
  },
  coherence: {
    name: "Coherence Evaluator", axis: "R",
    description: "Measures resonance field stability and inter-concept alignment.",
    inputs:  ["text", "concepts", "target_dimension"],
    outputs: ["coherence_score", "field_strength", "coupling_map", "gaps"],
    thresholds: { low: 0.3, medium: 0.6, high: 0.85 },
  },
  regime: {
    name: "Regime Evaluator", axis: "S",
    description: "Identifies the structural regime and its alignment to canon.",
    inputs:  ["text", "domain", "expected_regime"],
    outputs: ["regime_id", "regime_confidence", "structural_signature", "canon_alignment"],
    thresholds: { low: 0.35, medium: 0.65, high: 0.90 },
  },
  clarity: {
    name: "Clarity Evaluator", axis: "SRA",
    description: "Full RTT pipeline: Drift → Coherence → Regime → Clarity synthesis.",
    inputs:  ["text", "domain", "target_dimension", "baseline"],
    outputs: ["clarity_score", "dimension_estimate", "rtt_vector", "recommendations"],
    thresholds: { low: 0.4, medium: 0.65, high: 0.85 },
  },
} as const;

// ─── Deterministic RTT Engine ─────────────────────────────────────────────────

const TRIADIC_VOCAB = new Set([
  "structure","structural","resonance","activation","coherence","drift","regime","clarity",
  "triadic","triad","axis","substrate","identity","form","stability","relation","alignment",
  "field","motion","impulse","transformation","vector","coupling","dimension","evaluator",
  "canon","deterministic","module","operator","session","lineage","ontology","semantics",
  "literacy","cognition","cognitive","intelligence","learning","development","progression",
]);

const ABSTRACT_NOUNS = new Set([
  "truth","meaning","purpose","value","concept","idea","theory","principle","system",
  "framework","model","pattern","process","method","approach","perspective","understanding",
  "knowledge","insight","awareness","consciousness","experience","perception","judgment",
]);

interface EvalSignals {
  wordCount: number; sentenceCount: number; avgWordLength: number;
  uniqueRatio: number; triadicTerms: number; canonTerms: number;
  questionRatio: number; abstractRatio: number;
}

function extractSignals(text: string): EvalSignals {
  const words     = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 2);
  const questions = text.split("?").length - 1;
  const unique    = new Set(words);
  return {
    wordCount:     words.length,
    sentenceCount: Math.max(sentences.length, 1),
    avgWordLength: words.length ? words.reduce((a, w) => a + w.length, 0) / words.length : 0,
    uniqueRatio:   words.length ? unique.size / words.length : 0,
    triadicTerms:  words.filter(w => TRIADIC_VOCAB.has(w)).length,
    canonTerms:    words.filter(w => ["canon","rtt","triadic","evaluator","substrate"].includes(w)).length,
    questionRatio: sentences.length ? questions / sentences.length : 0,
    abstractRatio: words.length ? words.filter(w => ABSTRACT_NOUNS.has(w)).length / words.length : 0,
  };
}

function scoreNorm(v: number, min = 0, max = 1) { return Math.max(0, Math.min(1, (v - min) / (max - min))); }

function driftScore(sig: EvalSignals): number {
  const lengthPenalty = scoreNorm(sig.wordCount, 5, 200);
  const vocabularyGap = 1 - scoreNorm(sig.triadicTerms, 0, 10);
  const instability   = sig.questionRatio * 0.4;
  const noise         = 1 - sig.uniqueRatio;
  return Math.min(1, vocabularyGap * 0.35 + instability * 0.3 + noise * 0.2 + (1 - lengthPenalty) * 0.15);
}

function coherenceScore(sig: EvalSignals): number {
  return scoreNorm(sig.avgWordLength, 3, 8) * 0.3
    + scoreNorm(sig.triadicTerms, 0, 12) * 0.4
    + sig.uniqueRatio * 0.3;
}

function regimeScore(sig: EvalSignals): number {
  return Math.max(0, Math.min(1,
    scoreNorm(sig.canonTerms, 0, 5) * 0.4
    + scoreNorm(sig.triadicTerms, 0, 15) * 0.4
    + (1 - sig.abstractRatio * 2) * 0.2
  ));
}

function estimateDimension(drift: number, coh: number, reg: number): number {
  return Math.round(((1 - drift) * 0.30 + coh * 0.35 + reg * 0.35) * 9);
}

function driftType(score: number, sig: EvalSignals): string {
  if (score < 0.2)              return "none — within triadic baseline";
  if (sig.questionRatio > 0.4)  return "interrogative drift — activation without structure";
  if (sig.abstractRatio > 0.15) return "abstraction drift — resonance without grounding";
  if (sig.triadicTerms === 0)   return "domain drift — non-triadic vocabulary";
  if (score > 0.7)              return "severe structural drift — significant axis deviation";
  return "moderate activation drift — partial misalignment";
}

function scoreLabel(score: number, t: { low: number; medium: number; high: number }): string {
  if (score >= t.high)   return "high";
  if (score >= t.medium) return "medium";
  if (score >= t.low)    return "low";
  return "critical";
}

// ─── Scope Guard ──────────────────────────────────────────────────────────────

function requireScope(granted: Set<string>, needed: "read" | "write" | "admin"): void {
  const ok = { read: ["read","write","admin"], write: ["write","admin"], admin: ["admin"] };
  if (!ok[needed].some(s => granted.has(s))) {
    throw new Error(`Insufficient scope. '${needed}' required. Granted: ${[...granted].join(", ") || "none"}`);
  }
}

// ─── MCP Server Builder ───────────────────────────────────────────────────────

function buildMcpServer(env: Env, grantedScopes: Set<string>, subject: string): McpServer {
  const server = new McpServer({ name: "triadicframeworks-mcp", version: SERVER_VERSION });

  // ── READ: triadic_map ──────────────────────────────────────────────────────
  server.tool("triadic_map",
    "Returns the complete Triadic Frameworks axis map: Structure (S), Resonance (R), Activation (A) with properties and inter-axis relations.",
    {
      axis: z.enum(["S","R","A","all"]).default("all").describe("Which axis to return."),
      include_relations: z.boolean().default(true).describe("Include inter-axis relational mappings."),
    },
    async ({ axis, include_relations }) => {
      requireScope(grantedScopes, "read");
      const axes = axis === "all" ? AXES : { [axis]: AXES[axis as keyof typeof AXES] };
      return { content: [{ type: "text", text: JSON.stringify({
        canon: CANON_NAME, version: CANON_VERSION, axes,
        ...(include_relations && { relations: {
          "S→R": "Structure grounds Resonance — form enables relation",
          "R→A": "Resonance catalyses Activation — alignment generates motion",
          "A→S": "Activation reshapes Structure — transformation redefines form",
          "S+R+A": "The Triad — deterministic cognitive architecture",
        }}),
      }, null, 2) }] };
    }
  );

  // ── READ: evaluator_info ───────────────────────────────────────────────────
  server.tool("evaluator_info",
    "Returns the specification, thresholds, and usage guide for any RTT evaluator: drift, coherence, regime, or clarity.",
    { evaluator: z.enum(["drift","coherence","regime","clarity","all"]).default("all") },
    async ({ evaluator }) => {
      requireScope(grantedScopes, "read");
      const evals = evaluator === "all" ? EVALUATORS : { [evaluator]: EVALUATORS[evaluator as keyof typeof EVALUATORS] };
      return { content: [{ type: "text", text: JSON.stringify({
        canon: CANON_NAME, version: CANON_VERSION, evaluators: evals,
        pipeline: "Drift → Coherence → Regime → Clarity (RTT Suite)",
      }, null, 2) }] };
    }
  );

  // ── READ: dimension_map ────────────────────────────────────────────────────
  server.tool("dimension_map",
    "Returns the 0D→9D dimensional progression with axis anchors and development notes.",
    {
      dimension: z.number().int().min(0).max(9).optional().describe("Specific dimension (0–9). Omit for all."),
      include_development_notes: z.boolean().default(false),
    },
    async ({ dimension, include_development_notes }) => {
      requireScope(grantedScopes, "read");
      const devNotes: Record<number, string> = {
        0: "Entry point. Pure reaction. No structural awareness.",
        1: "Linear cause-effect. Begins to see relations but cannot hold complexity.",
        2: "Surface mapping. Can identify patterns but not their substrate.",
        3: "Triad awakens. Full three-axis awareness. RTT becomes accessible.",
        4: "Temporal cognition. Can trace change. Drift becomes observable.",
        5: "Context switching. Regime awareness. Can operate across domains.",
        6: "Deep coherence. Maintains resonance across multiple regimes.",
        7: "Evaluator fluency. RTT tools become natural reasoning.",
        8: "Canon alignment. All outputs triadic-coherent without effort.",
        9: "Full clarity. Deterministic, triadic, canonical — no drift, no noise.",
      };
      const dims = dimension !== undefined
        ? { [dimension]: { ...DIMENSIONS[dimension], ...(include_development_notes && { development: devNotes[dimension] }) } }
        : Object.fromEntries(Object.entries(DIMENSIONS).map(([k, v]) => [k, {
            ...v, ...(include_development_notes && { development: devNotes[+k] })
          }]));
      return { content: [{ type: "text", text: JSON.stringify({
        canon: CANON_NAME, version: CANON_VERSION, dimensions: dims,
      }, null, 2) }] };
    }
  );

  // ── READ: module_lookup ────────────────────────────────────────────────────
  server.tool("module_lookup",
    "Looks up a module in the Triadic Frameworks module registry by its canonical ID.",
    { module_id: z.string().min(1).max(128).describe("Canonical module ID (e.g. 'drift-001').") },
    async ({ module_id }) => {
      requireScope(grantedScopes, "read");
      const raw = await env.OAUTH_KV.get(`module:${module_id}`);
      if (!raw) return { isError: true, content: [{ type: "text", text: JSON.stringify({
        error: "module_not_found", module_id,
        message: `No module registered as '${module_id}'. Use module_register (admin) to add it.`,
      }) }] };
      return { content: [{ type: "text", text: raw }] };
    }
  );

  // ── READ: operator_lookup ──────────────────────────────────────────────────
  server.tool("operator_lookup",
    "Looks up an AI operator in the Triadic Frameworks operator registry by its canonical ID.",
    { operator_id: z.string().min(1).max(128) },
    async ({ operator_id }) => {
      requireScope(grantedScopes, "read");
      const raw = await env.OAUTH_KV.get(`operator:${operator_id}`);
      if (!raw) return { isError: true, content: [{ type: "text", text: JSON.stringify({
        error: "operator_not_found", operator_id,
        message: `No operator registered as '${operator_id}'. Use operator_register (admin) to add it.`,
      }) }] };
      return { content: [{ type: "text", text: raw }] };
    }
  );

  // ── READ: canon_status ─────────────────────────────────────────────────────
  server.tool("canon_status",
    "Returns live status of the Triadic Frameworks MCP server: version, tools, scope grants, registry counts.",
    {},
    async () => {
      requireScope(grantedScopes, "read");
      const [mods, ops] = await Promise.all([
        env.OAUTH_KV.list({ prefix: "module:" }).then(r => r.keys.length),
        env.OAUTH_KV.list({ prefix: "operator:" }).then(r => r.keys.length),
      ]);
      return { content: [{ type: "text", text: JSON.stringify({
        status: "operational", canon: CANON_NAME, version: CANON_VERSION,
        server_version: SERVER_VERSION, timestamp: new Date().toISOString(),
        subject, granted_scopes: [...grantedScopes],
        registry: { modules: mods, operators: ops },
        evaluators: Object.keys(EVALUATORS),
        dimensions: "0D → 9D", axes: ["Structure (S)", "Resonance (R)", "Activation (A)"],
        tools: {
          read:  ["triadic_map","evaluator_info","dimension_map","module_lookup","operator_lookup","canon_status"],
          write: ["drift_evaluate","coherence_evaluate","regime_evaluate","clarity_evaluate","session_create"],
          admin: ["module_register","operator_register"],
        },
      }, null, 2) }] };
    }
  );

  // ── WRITE: drift_evaluate ──────────────────────────────────────────────────
  server.tool("drift_evaluate",
    "RTT Drift Evaluator. Detects semantic, structural, or activation drift from the triadic baseline. Deterministic — no AI inference.",
    {
      text:     z.string().min(10).max(8000).describe("Text to evaluate for drift."),
      baseline: z.string().max
