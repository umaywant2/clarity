# **TriadicFrameworks — Cloudflare AI Marketplace Pricing Model**  
### Canon Version: 1.0  
### File: `/platform/cloudflare/pricing_model.md`

---

## **1. Purpose**

This document defines the pricing model for RTT Suite engines published to the Cloudflare AI Marketplace.  
It aligns marketplace token economics with TriadicFrameworks canon principles:

- **Clarity** — predictable, transparent pricing  
- **Stability** — consistent cost envelopes across evaluators  
- **Resonance** — pricing that reflects real computational value  
- **Structure** — clear tiers for Drift, Coherence, Regime, Clarity, and Session engines  

---

## **2. Marketplace Baseline**

Cloudflare Marketplace reference pricing (example from Jev):  
- **$0.042 per 1M input tokens**  
- Output tokens priced separately  
- Marketplace handles billing, metering, and usage reporting

RTT Suite pricing builds on this baseline.

---

## **3. RTT Evaluator Pricing Philosophy**

Each RTT engine has different computational characteristics:

| Engine | Complexity | Notes |
|--------|------------|-------|
| Drift | Low | ΔS / ΔR / ΔA extraction; lightweight spectral ops |
| Coherence | Medium | variance analysis + harmonic envelope |
| Regime | Medium | dominance detection + stability mapping |
| Clarity | Medium‑High | pulse detection + spectral primitives |
| Session | High | full pipeline orchestration |

Pricing reflects this computational gradient.

---

## **4. Pricing Tiers**

### **Tier 1 — Drift Engine**  
- **Cost:** baseline × 1.0  
- **Rationale:** minimal spectral operations; low variance; fast execution  
- **Use cases:** monitoring, lightweight triadic checks

---

### **Tier 2 — Coherence Engine**  
- **Cost:** baseline × 1.25  
- **Rationale:** harmonic envelope + variance mapping  
- **Use cases:** alignment scoring, stability checks

---

### **Tier 3 — Regime Engine**  
- **Cost:** baseline × 1.25  
- **Rationale:** dominance detection + regime classification  
- **Use cases:** structural/resonance/activation mode analysis

---

### **Tier 4 — Clarity Engine**  
- **Cost:** baseline × 1.5  
- **Rationale:** pulse detection + spectral primitives  
- **Use cases:** clarity scoring, triadic pulse analysis

---

### **Tier 5 — Session Interpreter**  
- **Cost:** baseline × 2.0  
- **Rationale:** full pipeline orchestration (Drift → Coherence → Regime → Clarity)  
- **Use cases:** full RTT evaluation, triadic session analysis

---

## **5. Example Pricing (Using Cloudflare Baseline)**

Assuming Cloudflare baseline: **$0.042 per 1M input tokens**

| Engine | Multiplier | Price per 1M tokens |
|--------|------------|---------------------|
| Drift | 1.0 | $0.042 |
| Coherence | 1.25 | $0.0525 |
| Regime | 1.25 | $0.0525 |
| Clarity | 1.5 | $0.063 |
| Session | 2.0 | $0.084 |

---

## **6. Output Token Pricing**

Output tokens follow Cloudflare Marketplace rules:

- RTT Suite engines produce **small, structured JSON outputs**  
- Output token usage is typically **low**  
- Session Interpreter produces the largest output (TRO)

---

## **7. Billing Transparency**

All RTT Suite models:

- expose usage metrics  
- include per‑engine cost breakdown  
- provide session‑level cost summaries  
- follow Cloudflare’s marketplace billing API

---

## **8. Canon Notes**

- Pricing reflects **triadic computational load**, not arbitrary tiers  
- Drift is intentionally inexpensive to encourage frequent monitoring  
- Session Interpreter is priced highest due to pipeline orchestration  
- All pricing remains **stable**, **predictable**, and **canon‑aligned**
