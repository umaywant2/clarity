/**
 * ============================================================
 * TriadicFrameworks — Cloudflare AI Marketplace Adapter
 * Canon Version: 1.0
 * Path: /platform/cloudflare/ai_marketplace_adapter.js
 * Author: Nawder Loswin
 * ============================================================
 *
 * Purpose:
 *   Provides a Cloudflare‑compatible adapter for RTT Suite engines.
 *   This file is used when publishing RTT models to Cloudflare’s
 *   AI Marketplace (Workers AI / Gateway).
 *
 * Notes:
 *   - Stateless
 *   - No external dependencies
 *   - Marketplace‑safe request/response shaping
 *   - Supports Drift, Coherence, Regime, Clarity, Session engines
 */

export default {
  /**
   * Register RTT models for Cloudflare Marketplace.
   * Cloudflare will call this during model initialization.
   */
  async onStart(env) {
    return {
      drift: env.RTT_DRIFT_MODEL,
      coherence: env.RTT_COHERENCE_MODEL,
      regime: env.RTT_REGIME_MODEL,
      clarity: env.RTT_CLARITY_MODEL,
      session: env.RTT_SESSION_MODEL
    };
  },

  /**
   * Main entry point for Cloudflare AI Gateway.
   * All marketplace requests flow through this handler.
   */
  async onRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Parse JSON body
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      return jsonError("Invalid JSON body.");
    }

    // Route based on path
    switch (path) {
      case "/rtt/drift":
        return runModel(env.RTT_DRIFT_MODEL, body);

      case "/rtt/coherence":
        return runModel(env.RTT_COHERENCE_MODEL, body);

      case "/rtt/regime":
        return runModel(env.RTT_REGIME_MODEL, body);

      case "/rtt/clarity":
        return runModel(env.RTT_CLARITY_MODEL, body);

      case "/rtt/session":
        return runModel(env.RTT_SESSION_MODEL, body);

      default:
        return jsonError(`Unknown RTT endpoint: ${path}`);
    }
  }
};

/**
 * ============================================================
 * Helpers
 * ============================================================
 */

async function runModel(model, body) {
  if (!model) {
    return jsonError("Model not available in environment.");
  }

  try {
    const result = await model.run(body);
    return json(result);
  } catch (err) {
    return jsonError(`RTT model error: ${err.message}`);
  }
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}

function jsonError(message) {
  return json({ error: message });
}

