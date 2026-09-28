# RTT_DRIFT_ENGINE — Drift Engine Teaching Workbook  
**Path:** `clarity/models/drift/teaching_workbook.md`  
**Version:** R5.1  
**Sessions:** 8  
**Level:** Advanced Practitioner

---

# Preface — Why Drift Matters

Drift is the earliest failure mode in any intelligent evaluation system. Before hallucination, before intent loss, before corrupted output — **the system drifts**. Drift is a *trajectory*, not an event, and the RTT_DRIFT_ENGINE exists to detect, measure, contextualize, and correct that trajectory before it becomes irreversible.

Drift literacy requires fluency in substrate dynamics, pipeline mechanics, dimensional analysis, and metacognitive calibration. This workbook provides a progressive, multi‑session curriculum that builds these competencies layer by layer.

---

# R5 Canon Pedagogy — The Five Pillars

| Pillar | Name       | Description |
|--------|------------|-------------|
| **R1** | Recognize  | Identify the phenomenon accurately in context. |
| **R2** | Reflect    | Analyze without premature judgment. |
| **R3** | Reframe    | Apply the correct dimensional/systemic lens. |
| **R4** | Realign    | Execute corrective action. |
| **R5** | Resolve    | Confirm resolution, document findings, update calibration. |

Session mapping:  
- **S1–S2:** R1/R2  
- **S3–S4:** R2/R3  
- **S5–S6:** R4  
- **S7:** R5  
- **S8:** R1–R5 (full integration)

---

# Session Architecture

Each session follows a consistent structure:

1. **Learning Objective**  
2. **Concept Exposition**  
3. **Worked Example**  
4. **Practice Tasks**  
5. **Clarity Pulse Checkpoint (CPC)**

---

# Module Overview — RTT_DRIFT_ENGINE Architecture

## Canonical Module Fields

| Field | Type | Default / Value | Description |
|-------|------|------------------|-------------|
| `module_id` | string | `RTT_DRIFT_ENGINE` | Unique module identifier. |
| `version` | semver | `R5.1.0` | Canon generation + feature release. |
| `substrate` | object | See Session 1 | Defines Signal, Noise, Flux, Anchor layers. |
| `pipeline_stages` | array | `[Intake, Parse, Evaluate, Resolve, Emit]` | Ordered RTT pipeline. |
| `drift_threshold` | float | `0.38` | Sensitivity threshold for drift candidates. |
| `dimensional_axes` | array | `[D1, D2, D3, D4, D5]` | Temporal, Semantic, Relational, Intentional, Integrative. |
| `triadic_loop` | object | See Session 5 | Perceive → Process → Project cycle. |
| `pulse_interval` | int | `8` | CPC cadence. |
| `evaluator_mode` | enum | `passive` | passive / active / corrective. |
| `calibration_curve` | object | `k=2.0, X0=0.38` | Sigmoid threshold modulation. |
| `emit_schema` | object | See Session 2 | Output schema for corrected substrate + drift log. |

---

# Session 1 — Substrate Primitives  
**R5 Pillars:** R1, R2  
**Objective:** Identify and distinguish Signal, Noise, Flux, Anchor.

## Signal  
Structured, intent‑bearing content.  
Entropy Index thresholds:  
- EI < 0.30 → Stable  
- EI ≥ 0.30 → Degraded  
- EI ≥ 0.60 → Severely degraded

## Noise  
Undifferentiated interference.  
Types: thermal vs structured.  
NDP differentiates noise via:  
- Frequency signature  
- Repetition interval  
- Semantic coherence

## Flux  
Rate of change across substrate.  
\[
FI = \frac{A_{signal}}{A_{time}}
\]  
FI > 0.60 → unstable  
FI > 0.80 → auto‑anchor assignment

## Anchor  
Stabilizing reference points:  
- Temporal  
- Semantic  
- Relational

---

# Session 2 — The RTT Pipeline  
**R5 Pillars:** R1, R2  
**Objective:** Trace drift through all five pipeline stages.

## Intake  
Initial substrate typing + Intake Manifest.

## Parse  
Parse units + parse tree (shallow, mid, deep).

## Evaluate  
Drift Score:  
\[
DS = \frac{semantic\_deviation \times flux\_weight}{anchor\_presence}
\]  
DS > 0.38 → Drift Candidate.

## Resolve  
Resolution strategies:  
- Recalibrate  
- Suppress  
- Escalate (Triadic Loop)

## Emit  
Outputs: corrected substrate, drift log, optional pulse signal.

---

# Session 3 — Drift Detection  
**R5 Pillars:** R2, R3  
**Standalone:** Yes

## Drift Patterns  
- **Gradual Drift** — monotonic, cumulative  
- **Sudden Drift** — DS spike ≥ 2× threshold  
- **Recurring Drift** — oscillatory, unresolved root cause

## Calibration Curve  
Sigmoid threshold modulation:  
\[
T(x) = \frac{1}{1 + e^{-k(x - X_0)}}
\]

---

# Session 4 — Dimensional Curriculum  
**R5 Pillar:** R3

## Dimensions  
- **D1 Temporal** — sequence anomalies  
- **D2 Semantic** — coherence < 0.45  
- **D3 Relational** — relational entropy > 0.55  
- **D4 Intentional** — intent vector collapse  
- **D5 Integrative** — cross‑dimensional interference

---

# Session 5 — Triadic Learning Loops  
**R5 Pillar:** R4

## Phases  
### Perceive  
Context only; no hypotheses.

### Process  
Generate strategies; compute RIS:  
\[
RIS = \frac{projected\_DS\_reduction \times anchor\_stability}{resource\_cost}
\]

### Project  
Apply strategy; monitor DS for 5 ticks.

---

# Session 6 — Clarity Pulse Checkpoints  
**R5 Pillar:** R4  
**Standalone:** Yes

## CPC Blocks  
1. Pulse Header  
2. State Verification  
3. Calibration Audit  
4. Practitioner Alignment  
5. Pulse Decision

## Pulse Decisions  
- Continue  
- Adjust  
- Interrupt

---

# Session 7 — Evaluator Exercises  
**R5 Pillar:** R5  
**Standalone:** Yes

Evaluator_mode: passive → active → corrective.  
Exercises include pipeline verification, drift scoring, triadic loop simulation, CPC error detection.

---

# Session 8 — Integration Synthesis  
**R5 Pillars:** R1–R5

Capstone scenario across 24 ticks including intake, CDS analysis, dimensional triage, triadic loop cycles, CPC, and final evaluator sign‑off.

Full‑stack hallmarks:  
- Anticipatory calibration  
- Cross‑dimensional pattern reading  
- Loop economy (<20% re‑entry)

---

# Appendices  
- **Appendix A:** Module.json Field Reference  
- **Appendix B:** Formula Reference  
- **Appendix C:** Glossary  
- **Appendix D:** Answer Key

---
