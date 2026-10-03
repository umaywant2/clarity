/**
 * mcp.ts — Triadic Frameworks MCP Server
 *
 * Tool taxonomy (14 tools across 3 scope tiers):
 *
 *   read  — triadic_map | evaluator_info | dimension_map
 *           module_lookup | operator_lookup | canon_status
 *
 *   write — drift_evaluate | coherence_evaluate | regime_evaluate
 *           clarity_evaluate | session_create | session_evaluate
 *
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

/** A single stored evaluation result inside a session record */
interface EvaluationEntry {
  eval_id:            string;
  eval_index:         number;       // 0-based, immutable — position in session.evaluations[]
  label:              string;       // human-readable label, e.g. "Week 3 submission"
  evaluator:          string;       // "clarity" | "drift" | "coherence" | "regime"
  text_preview:       string;       // first 200 chars of input text
  evaluated_at:       string;       // ISO 8601
  evaluated_by:       string;       // subject from token (client_id or sub)
  domain:             string | null;
  target_dimension:   number | null;
  // Top-level scores — always populated regardless of evaluator, for progression math
  clarity_score:      number;
  drift_score:        number;
  coherence_score:    number;
  regime_score:       number;
  dimension_estimate: number;       // 0–9
  // Full evaluator output block
  result:             Record<string, unknown>;
  signals: {
    word_count:     number;
    triadic_terms:  number;
    canon_terms:    number;
    unique_ratio:   number;
    question_ratio: number;
  };
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
          write: ["drift_evaluate", "coherence_evaluate", "regime_evaluate", "clarity_evaluate", "session_create", "session_evaluate"],
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
      baseline: z.string().max(2000).optional().describe("Optional baseline text for comparative drift."),
      context:  z.string().max(500).optional().describe("Domain context hint."),
    },
    async ({ text, baseline, context }) => {
      requireScope(grantedScopes, "write");
      const sig  = extractSignals(text);
      const base = baseline ? extractSignals(baseline) : null;
      const raw  = driftScore(sig);
      const adj  = base ? Math.abs(raw - driftScore(base)) * 0.5 + raw * 0.5 : raw;
      const score = Math.round(adj * 100) / 100;
      const recs: string[] = [];
      if (adj > 0.5)              recs.push("Re-anchor text to S/R/A axis vocabulary.");
      if (sig.triadicTerms < 2)   recs.push("Introduce triadic terminology to restore canon alignment.");
      if (sig.questionRatio > 0.4) recs.push("Replace interrogative framing with declarative structural statements.");
      if (sig.abstractRatio > 0.1) recs.push("Ground abstract concepts in substrate-level examples.");
      if (!recs.length)            recs.push("No corrective action required. Text is within triadic baseline.");
      return { content: [{ type: "text", text: JSON.stringify({
        evaluator: "drift", canon_version: CANON_VERSION,
        drift_score: score, drift_label: scoreLabel(1 - adj, EVALUATORS.drift.thresholds),
        drift_type: driftType(adj, sig),
        axis_deviation: {
          S: Math.round((sig.triadicTerms < 3 ? 0.6 : 0.2) * 100) / 100,
          R: Math.round((sig.uniqueRatio < 0.5 ? 0.5 : 0.15) * 100) / 100,
          A: Math.round((sig.questionRatio > 0.3 ? 0.7 : 0.2) * 100) / 100,
        },
        signals: { word_count: sig.wordCount, triadic_terms: sig.triadicTerms,
                   unique_ratio: Math.round(sig.uniqueRatio*100)/100,
                   question_ratio: Math.round(sig.questionRatio*100)/100 },
        context: context ?? null, recommendations: recs,
        note: "Drift score 0.0 = no drift, 1.0 = maximum drift.",
      }, null, 2) }] };
    }
  );

  // ── WRITE: coherence_evaluate ──────────────────────────────────────────────
  server.tool("coherence_evaluate",
    "RTT Coherence Evaluator. Measures resonance field stability and inter-concept alignment.",
    {
      text:             z.string().min(10).max(8000),
      concepts:         z.array(z.string().max(100)).max(10).optional().describe("Key concepts to check for coupling."),
      target_dimension: z.number().int().min(0).max(9).optional(),
    },
    async ({ text, concepts, target_dimension }) => {
      requireScope(grantedScopes, "write");
      const sig   = extractSignals(text);
      const score = Math.round(coherenceScore(sig) * 100) / 100;
      const couplingMap: Record<string, number> = {};
      if (concepts) {
        const lo = text.toLowerCase();
        for (const c of concepts) {
          couplingMap[c] = Math.min(1, (lo.match(new RegExp(c.toLowerCase(),"g"))??[]).length / 5);
        }
      }
      const gaps: string[] = [];
      if (sig.triadicTerms < 3) gaps.push("Insufficient triadic vocabulary — resonance field weak.");
      if (sig.uniqueRatio < 0.4) gaps.push("High repetition — field is static, not dynamic.");
      if (sig.sentenceCount < 3) gaps.push("Too few sentences — inter-concept coupling cannot be established.");
      if (target_dimension !== undefined && score < target_dimension / 9)
        gaps.push(`Coherence (${score}) below expected for ${target_dimension}D.`);
      return { content: [{ type: "text", text: JSON.stringify({
        evaluator: "coherence", canon_version: CANON_VERSION,
        coherence_score: score, coherence_label: scoreLabel(score, EVALUATORS.coherence.thresholds),
        field_strength: Math.min(1, Math.round(sig.triadicTerms / Math.max(sig.wordCount/20,1)*100)/100),
        coupling_map: Object.keys(couplingMap).length ? couplingMap : null,
        target_dimension: target_dimension ?? null,
        gaps: gaps.length ? gaps : ["No coherence gaps detected."],
        signals: { sentence_count: sig.sentenceCount, avg_word_length: Math.round(sig.avgWordLength*10)/10,
                   triadic_terms: sig.triadicTerms, unique_ratio: Math.round(sig.uniqueRatio*100)/100 },
      }, null, 2) }] };
    }
  );

  // ── WRITE: regime_evaluate ─────────────────────────────────────────────────
  server.tool("regime_evaluate",
    "RTT Regime Evaluator. Identifies the structural regime of input text and measures canon alignment.",
    {
      text:            z.string().min(10).max(8000),
      domain:          z.string().max(100).optional(),
      expected_regime: z.enum(["structural","resonant","activated","triadic","pre-triadic","unknown"]).optional(),
    },
    async ({ text, domain, expected_regime }) => {
      requireScope(grantedScopes, "write");
      const sig   = extractSignals(text);
      const score = Math.round(regimeScore(sig) * 100) / 100;
      let detected: string;
      if      (sig.canonTerms >= 3 && sig.triadicTerms >= 5) detected = "triadic";
      else if (sig.triadicTerms >= 4 && sig.uniqueRatio > 0.6) detected = "structural";
      else if (sig.triadicTerms >= 2 && sig.questionRatio < 0.2) detected = "resonant";
      else if (sig.questionRatio > 0.3 || sig.triadicTerms < 2) detected = "pre-triadic";
      else detected = "activated";
      return { content: [{ type: "text", text: JSON.stringify({
        evaluator: "regime", canon_version: CANON_VERSION,
        regime_score: score, regime_label: scoreLabel(score, EVALUATORS.regime.thresholds),
        detected_regime: detected, expected_regime: expected_regime ?? null,
        canon_alignment: Math.round((expected_regime && detected !== expected_regime ? score * 0.6 : score)*100)/100,
        structural_signature: {
          axis_dominant: sig.canonTerms > sig.triadicTerms ? "S" : sig.uniqueRatio > 0.65 ? "R" : "A",
          depth:    sig.wordCount > 150 ? "deep" : sig.wordCount > 50 ? "medium" : "shallow",
          formality: sig.avgWordLength > 6 ? "high" : sig.avgWordLength > 4 ? "medium" : "low",
          density:  sig.triadicTerms > 8 ? "dense" : sig.triadicTerms > 3 ? "moderate" : "sparse",
        },
        domain: domain ?? null,
        signals: { canon_terms: sig.canonTerms, triadic_terms: sig.triadicTerms,
                   word_count: sig.wordCount, avg_word_len: Math.round(sig.avgWordLength*10)/10 },
      }, null, 2) }] };
    }
  );

  // ── WRITE: clarity_evaluate ────────────────────────────────────────────────
  server.tool("clarity_evaluate",
    "Full RTT pipeline: Drift → Coherence → Regime → Clarity synthesis. Returns dimension estimate, RTT vector, and recommendations.",
    {
      text:             z.string().min(10).max(8000),
      domain:           z.string().max(100).optional(),
      target_dimension: z.number().int().min(0).max(9).optional(),
      baseline:         z.string().max(2000).optional(),
    },
    async ({ text, domain, target_dimension, baseline }) => {
      requireScope(grantedScopes, "write");
      const sig  = extractSignals(text);
      const base = baseline ? extractSignals(baseline) : null;
      const raw  = driftScore(sig);
      const adj  = base ? Math.abs(raw - driftScore(base)) * 0.5 + raw * 0.5 : raw;
      const coh  = coherenceScore(sig);
      const reg  = regimeScore(sig);
      const clarityScore = Math.round(((1-adj)*0.30 + coh*0.35 + reg*0.35)*100)/100;
      const dimEstimate  = estimateDimension(adj, coh, reg);
      const targetGap    = target_dimension !== undefined ? target_dimension - dimEstimate : null;
      const recs: string[] = [];
      if (adj > 0.5)   recs.push(`[Drift] Reduce drift (${Math.round(adj*100)}%) by anchoring to S/R/A vocabulary.`);
      if (coh < 0.5)   recs.push("[Coherence] Strengthen resonance field by increasing inter-concept coupling.");
      if (reg < 0.5)   recs.push("[Regime] Improve canon alignment with evaluator-level structural language.");
      if (targetGap !== null && targetGap > 0)
        recs.push(`[Dimension] ${targetGap} levels needed to reach ${target_dimension}D. Focus on ${targetGap > 3 ? "foundational triadic literacy" : "evaluator fluency"}.`);
      if (clarityScore > 0.8) recs.push("Excellent clarity. Strong triadic alignment across all axes.");
      else if (clarityScore > 0.6) recs.push("Good clarity. Minor refinements will elevate to canon level.");
      if (!recs.length) recs.push("Text is fully canon-aligned. No action required.");
      return { content: [{ type: "text", text: JSON.stringify({
        evaluator: "clarity (RTT pipeline)", canon_version: CANON_VERSION,
        clarity_score: clarityScore, clarity_label: scoreLabel(clarityScore, EVALUATORS.clarity.thresholds),
        dimension_estimate: dimEstimate, dimension_label: DIMENSIONS[dimEstimate].label,
        target_dimension: target_dimension ?? null, target_gap: targetGap,
        rtt_vector: { description: "D=Drift(A-axis), C=Coherence(R-axis), R=Regime(S-axis)", values: {
          D: Math.round(adj*100)/100, C: Math.round(coh*100)/100, R: Math.round(reg*100)/100,
        }},
        pipeline: {
          drift:     { score: Math.round(adj*100)/100, type: driftType(adj, sig) },
          coherence: { score: Math.round(coh*100)/100 },
          regime:    { score: Math.round(reg*100)/100 },
        },
        domain: domain ?? null,
        signals: { word_count: sig.wordCount, triadic_terms: sig.triadicTerms,
                   canon_terms: sig.canonTerms, unique_ratio: Math.round(sig.uniqueRatio*100)/100 },
        recommendations: recs,
        note: "Clarity score 0.0–1.0. Dimension estimate 0D–9D.",
      }, null, 2) }] };
    }
  );

  // ── WRITE: session_create ──────────────────────────────────────────────────
  server.tool("session_create",
    "Creates a new evaluation session in the Triadic Frameworks session registry (KV, 90-day TTL).",
    {
      session_name:     z.string().min(1).max(200),
      domain:           z.string().max(100).optional(),
      target_dimension: z.number().int().min(0).max(9).optional(),
      metadata:         z.record(z.string(), z.unknown()).optional(),
    },
    async ({ session_name, domain, target_dimension, metadata }) => {
      requireScope(grantedScopes, "write");
      const sessionId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0,8)}`;
      const session = {
        session_id: sessionId, session_name,
        created_at: new Date().toISOString(), created_by: subject,
        domain: domain ?? null, target_dimension: target_dimension ?? null,
        evaluations: [], canon_version: CANON_VERSION, metadata: metadata ?? {},
      };
      await env.OAUTH_KV.put(`session:${sessionId}`, JSON.stringify(session), { expirationTtl: 60*60*24*90 });
      return { content: [{ type: "text", text: JSON.stringify({
        status: "created", session_id: sessionId, session_name,
        created_at: session.created_at,
        note: `Session '${sessionId}' active for 90 days.`,
      }, null, 2) }] };
    }
  );

  // ── ADMIN: module_register ─────────────────────────────────────────────────
  server.tool("module_register",
    "Registers or updates a module in the Triadic Frameworks module registry. Requires admin scope.",
    {
      module_id:   z.string().min(1).max(128).regex(/^[a-z0-9-_]+$/),
      name:        z.string().min(1).max(200),
      axis:        z.enum(["S","R","A","SR","RA","SA","SRA"]),
      dimension:   z.number().int().min(0).max(9),
      evaluator:   z.enum(["drift","coherence","regime","clarity","none"]),
      description: z.string().max(1000),
      tags:        z.array(z.string().max(50)).max(20).optional(),
      metadata:    z.record(z.string(), z.unknown()).optional(),
    },
    async ({ module_id, name, axis, dimension, evaluator, description, tags, metadata }) => {
      requireScope(grantedScopes, "admin");
      const existing = await env.OAUTH_KV.get(`module:${module_id}`);
      const record = {
        module_id, name, axis, dimension,
        dimension_label: DIMENSIONS[dimension].label, evaluator, description,
        tags: tags ?? [],
        registered_at: existing ? JSON.parse(existing).registered_at : new Date().toISOString(),
        updated_at: new Date().toISOString(), registered_by: subject,
        canon_version: CANON_VERSION, metadata: metadata ?? {},
      };
      await env.OAUTH_KV.put(`module:${module_id}`, JSON.stringify(record));
      return { content: [{ type: "text", text: JSON.stringify({
        status: existing ? "updated" : "registered", module_id, name, axis,
        dimension: DIMENSIONS[dimension].label,
        note: `Module '${module_id}' available via module_lookup.`,
      }, null, 2) }] };
    }
  );

  // ── ADMIN: operator_register ───────────────────────────────────────────────
  server.tool("operator_register",
    "Registers or updates an AI operator in the Triadic Frameworks operator registry. Requires admin scope.",
    {
      operator_id:     z.string().min(1).max(128).regex(/^[a-z0-9-_]+$/),
      name:            z.string().min(1).max(200),
      operator_family: z.enum(["alignment","drift","coherence","regime","clarity","session","registry","meta"]),
      axis:            z.enum(["S","R","A","SR","RA","SA","SRA"]),
      capabilities:    z.array(z.string().max(100)).min(1).max(20),
      description:     z.string().max(1000),
      alignment_scores: z.object({
        S: z.number().min(0).max(1),
        R: z.number().min(0).max(1),
        A: z.number().min(0).max(1),
      }).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    },
    async ({ operator_id, name, operator_family, axis, capabilities, description, alignment_scores, metadata }) => {
      requireScope(grantedScopes, "admin");
      const existing = await env.OAUTH_KV.get(`operator:${operator_id}`);
      const record = {
        operator_id, name, operator_family, axis, capabilities, description,
        alignment_scores: alignment_scores ?? null,
        registered_at: existing ? JSON.parse(existing).registered_at : new Date().toISOString(),
        updated_at: new Date().toISOString(), registered_by: subject,
        canon_version: CANON_VERSION, metadata: metadata ?? {},
      };
      await env.OAUTH_KV.put(`operator:${operator_id}`, JSON.stringify(record));
      return { content: [{ type: "text", text: JSON.stringify({
        status: existing ? "updated" : "registered",
        operator_id, name, operator_family, axis, capabilities,
        note: `Operator '${operator_id}' available via operator_lookup.`,
      }, null, 2) }] };
    }
  );

  // ── WRITE: session_evaluate ───────────────────────────────────────────────
  server.tool(
    "session_evaluate",
    "Runs the full RTT pipeline on the provided text and stores the result as a new evaluation entry in an existing session. Returns the evaluation record, updated session summary, and dimensional progression (when ≥2 evaluations exist).",
    {
      session_id: z.string().min(1).max(128)
        .describe("ID of an existing session created by session_create."),
      text: z.string().min(10).max(8000)
        .describe("Text to run through the RTT pipeline and store."),
      label: z.string().max(200).optional()
        .describe("Human-readable label for this entry (e.g. 'Week 3 submission')."),
      domain: z.string().max(100).optional()
        .describe("Domain context override. Falls back to the session's domain if omitted."),
      target_dimension: z.number().int().min(0).max(9).optional()
        .describe("Target dimension override. Falls back to the session's target_dimension if omitted."),
      baseline: z.string().max(2000).optional()
        .describe("Optional baseline text for comparative drift scoring."),
      evaluator: z.enum(["clarity", "drift", "coherence", "regime"]).default("clarity")
        .describe("Which evaluator to run. 'clarity' runs the full RTT pipeline (recommended)."),
    },
    async ({ session_id, text, label, domain, target_dimension, baseline, evaluator }) => {
      requireScope(grantedScopes, "write");

      // ── 1. Load session ─────────────────────────────────────────────────
      const raw = await env.OAUTH_KV.get(`session:${session_id}`);
      if (!raw) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: JSON.stringify({
            error: "session_not_found",
            session_id,
            message: `No session found for id '${session_id}'. Create one first with session_create.`,
          }) }],
        };
      }

      const session = JSON.parse(raw) as {
        session_id:       string;
        session_name:     string;
        created_at:       string;
        created_by:       string;
        domain:           string | null;
        target_dimension: number | null;
        evaluations:      EvaluationEntry[];
        canon_version:    string;
        metadata:         Record<string, unknown>;
      };

      // ── 2. Resolve domain / target_dimension (param > session > null) ──
      const effectiveDomain    = domain           ?? session.domain           ?? undefined;
      const effectiveDimension = target_dimension ?? session.target_dimension ?? undefined;

      // ── 3. Run the RTT engine ────────────────────────────────────────────
      const sig      = extractSignals(text);
      const base     = baseline ? extractSignals(baseline) : null;
      const rawDrift = driftScore(sig);
      const adjDrift = base
        ? Math.abs(rawDrift - driftScore(base)) * 0.5 + rawDrift * 0.5
        : rawDrift;
      const coh = coherenceScore(sig);
      const reg = regimeScore(sig);

      // Full scores always computed — needed for progression math
      const clarityScore = Math.round(((1 - adjDrift) * 0.30 + coh * 0.35 + reg * 0.35) * 100) / 100;
      const dimEstimate  = estimateDimension(adjDrift, coh, reg);

      // ── 4. Per-evaluator result block ────────────────────────────────────
      let result: Record<string, unknown>;
      switch (evaluator) {
        case "drift":
          result = {
            evaluator:     "drift",
            drift_score:   Math.round(adjDrift * 100) / 100,
            drift_label:   scoreLabel(1 - adjDrift, EVALUATORS.drift.thresholds),
            drift_type:    driftType(adjDrift, sig),
            axis_deviation: {
              S: Math.round((sig.triadicTerms  < 3   ? 0.60 : 0.20) * 100) / 100,
              R: Math.round((sig.uniqueRatio   < 0.5 ? 0.50 : 0.15) * 100) / 100,
              A: Math.round((sig.questionRatio > 0.3 ? 0.70 : 0.20) * 100) / 100,
            },
          };
          break;
        case "coherence":
          result = {
            evaluator:       "coherence",
            coherence_score: Math.round(coh * 100) / 100,
            coherence_label: scoreLabel(coh, EVALUATORS.coherence.thresholds),
            field_strength:  Math.min(1, Math.round(
              sig.triadicTerms / Math.max(sig.wordCount / 20, 1) * 100) / 100),
          };
          break;
        case "regime":
          result = {
            evaluator:    "regime",
            regime_score: Math.round(reg * 100) / 100,
            regime_label: scoreLabel(reg, EVALUATORS.regime.thresholds),
          };
          break;
        case "clarity":
        default:
          result = {
            evaluator:          "clarity (RTT pipeline)",
            clarity_score:      clarityScore,
            clarity_label:      scoreLabel(clarityScore, EVALUATORS.clarity.thresholds),
            dimension_estimate: dimEstimate,
            dimension_label:    DIMENSIONS[dimEstimate].label,
            rtt_vector: {
              D: Math.round(adjDrift * 100) / 100,  // Drift   (A-axis)
              C: Math.round(coh      * 100) / 100,  // Coherence (R-axis)
              R: Math.round(reg      * 100) / 100,  // Regime  (S-axis)
            },
            pipeline: {
              drift:     { score: Math.round(adjDrift * 100) / 100, type: driftType(adjDrift, sig) },
              coherence: { score: Math.round(coh * 100) / 100 },
              regime:    { score: Math.round(reg * 100) / 100 },
            },
          };
      }

      // ── 5. Build evaluation entry ────────────────────────────────────────
      const evalIndex = session.evaluations.length;  // 0-based, immutable
      const evalId    = `eval-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;

      const entry: EvaluationEntry = {
        eval_id:            evalId,
        eval_index:         evalIndex,
        label:              label ?? `Evaluation ${evalIndex + 1}`,
        evaluator,
        text_preview:       text.slice(0, 200) + (text.length > 200 ? "…" : ""),
        evaluated_at:       new Date().toISOString(),
        evaluated_by:       subject,
        domain:             effectiveDomain    ?? null,
        target_dimension:   effectiveDimension ?? null,
        clarity_score:      clarityScore,
        drift_score:        Math.round(adjDrift * 100) / 100,
        coherence_score:    Math.round(coh * 100) / 100,
        regime_score:       Math.round(reg * 100) / 100,
        dimension_estimate: dimEstimate,
        result,
        signals: {
          word_count:     sig.wordCount,
          triadic_terms:  sig.triadicTerms,
          canon_terms:    sig.canonTerms,
          unique_ratio:   Math.round(sig.uniqueRatio    * 100) / 100,
          question_ratio: Math.round(sig.questionRatio  * 100) / 100,
        },
      };

      // ── 6. Append + persist (TTL reset = last-activity 90 days) ─────────
      session.evaluations.push(entry);
      await env.OAUTH_KV.put(
        `session:${session_id}`,
        JSON.stringify(session),
        { expirationTtl: 60 * 60 * 24 * 90 },
      );

      // ── 7. Dimensional progression (emitted when ≥2 evaluations) ────────
      let progression: Record<string, unknown> | null = null;
      const evals = session.evaluations;

      if (evals.length >= 2) {
        const first  = evals[0];
        const latest = evals[evals.length - 1];
        const recent = evals.slice(-3);

        const avgClarity = Math.round(
          (evals.reduce((sum, e) => sum + e.clarity_score, 0) / evals.length) * 100
        ) / 100;

        // Trend: compare clarity of earliest recent entry to most recent
        const recentDelta = recent[recent.length - 1].clarity_score - recent[0].clarity_score;
        const trend: "improving" | "stable" | "declining" =
          recentDelta >  0.05 ? "improving" :
          recentDelta < -0.05 ? "declining" : "stable";

        const dimDelta = latest.dimension_estimate - first.dimension_estimate;

        progression = {
          total_evaluations: evals.length,
          first_evaluation: {
            eval_id: first.eval_id, label: first.label,
            clarity_score: first.clarity_score,
            dimension: DIMENSIONS[first.dimension_estimate].label,
            evaluated_at: first.evaluated_at,
          },
          latest_evaluation: {
            eval_id: latest.eval_id, label: latest.label,
            clarity_score: latest.clarity_score,
            dimension: DIMENSIONS[latest.dimension_estimate].label,
            evaluated_at: latest.evaluated_at,
          },
          dimension_delta:      dimDelta,
          dimension_trajectory: dimDelta > 0
            ? `+${dimDelta} level${dimDelta > 1 ? "s" : ""}`
            : dimDelta < 0
            ? `${dimDelta} level${dimDelta < -1 ? "s" : ""}`
            : "no change",
          avg_clarity_score: avgClarity,
          trend,
          trend_basis: `last ${recent.length} evaluation${recent.length > 1 ? "s" : ""} `
            + `(Δ clarity ${recentDelta >= 0 ? "+" : ""}${Math.round(recentDelta * 100) / 100})`,
          clarity_history: evals.map(e => ({
            eval_id:            e.eval_id,
            label:              e.label,
            clarity_score:      e.clarity_score,
            dimension_estimate: e.dimension_estimate,
            evaluated_at:       e.evaluated_at,
          })),
        };
      }

      // ── 8. Return ────────────────────────────────────────────────────────
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          status:       "stored",
          session_id,
          session_name: session.session_name,
          eval_id:      evalId,
          eval_index:   evalIndex,
          label:        entry.label,
          evaluated_at: entry.evaluated_at,
          evaluator,
          result,
          progression,
          session_summary: {
            total_evaluations: evals.length,
            domain:            session.domain,
            target_dimension:  session.target_dimension !== null
              ? DIMENSIONS[session.target_dimension]?.label
              : null,
            canon_version:     session.canon_version,
            ttl_reset:         "90 days from now (last-activity)",
          },
          note: progression
            ? `Progression available. Trend: ${progression.trend}. Trajectory: ${progression.dimension_trajectory}.`
            : "First evaluation stored. Run session_evaluate again to generate dimensional progression.",
        }, null, 2) }],
      };
    }
  );

  return server;
}
  
  return server;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function mcpHandler(
  request: Request,
  env: Env,
  ctx: OAuthContext
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id",
      "Access-Control-Max-Age":       "86400",
    }});
  }

  const scopeString   = ctx.props?.scope ?? "";
  const grantedScopes = new Set(scopeString.split(" ").filter(Boolean));
  const subject       = ctx.props?.sub ?? ctx.props?.clientId ?? "anonymous";

  if (grantedScopes.size === 0) {
    return Response.json(
      { error: "insufficient_scope", error_description: "Token has no granted scopes." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const server    = buildMcpServer(env, grantedScopes, subject);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  try {
    await server.connect(transport);
    const mcpResponse = await transport.handleRequest(request);
    const headers = new Headers(mcpResponse.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-store");
    return new Response(mcpResponse.body, { status: mcpResponse.status, headers });
  } catch (err: unknown) {
    console.error("[mcp] Transport error:", err);
    return Response.json({
      jsonrpc: "2.0", id: null,
      error: { code: -32603, message: "Internal server error",
               data: err instanceof Error ? err.message : String(err) },
    }, { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } finally {
    ctx.waitUntil(server.close().catch(() => {}));
  }
}
