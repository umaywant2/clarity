# RTT_DRIFT_ENGINE

> **TriadicFrameworks R5 · Module README**
> Canon Revision: R5.3 · Status: `ACTIVE` · Tier: `SUBSTRATE`

---

## 1. Identity

| Field            | Value                                      |
|------------------|--------------------------------------------|
| **Module ID**    | `RTT_DRIFT_ENGINE`                         |
| **Display Name** | RTT Drift Engine                           |
| **Canon Rev**    | R5.3                                       |
| **Tier**         | Substrate                                  |
| **Layer**        | Capture → Drift → Resolve                  |
| **Status**       | Active                                     |
| **Owner**        | TriadicFrameworks Core                     |
| **Linked File**  | `clarity/capture.md`                       |

```json
{
  "module_id": "RTT_DRIFT_ENGINE",
  "canon_rev": "R5.3",
  "tier": "substrate",
  "status": "active",
  "entry_point": "clarity/capture.md",
  "triadic_poles": ["SIGNAL", "DRIFT", "RESOLUTION"],
  "dimensional_axes": ["T", "S", "I"],
  "si_refs": ["SI-04", "SI-11", "SI-17"],
  "clarity_target": 0.91
}
```

---

## 2. Purpose

The **RTT Drift Engine** tracks, measures, and resolves **Real-Time Transmission (RTT) drift** across active session substrates. It is the canonical module responsible for detecting semantic and structural displacement between a frame's intended transmission state and its received or reconstructed state.

Drift is not treated as noise. Within TriadicFrameworks R5 canon, drift is a **primary signal carrier** — a meaningful delta that encodes substrate pressure, evaluator latency, and dimensional tension. The engine does not suppress drift; it reads, logs, and routes it.

Primary functions:

- **Capture** incoming frame states via `clarity/capture.md`
- **Measure** displacement against the last anchored transmission reference
- **Route** resolved drift to the appropriate analyzer layer
- **Surface** clarity targets to the session evaluator

---

## 3. Triadic Framing

The RTT Drift Engine operates across three canonical poles:

```
        SIGNAL
          ▲
         / \
        /   \
   DRIFT ——— RESOLUTION
```

| Pole           | Role                                                                 |
|----------------|----------------------------------------------------------------------|
| **SIGNAL**     | The originating transmission intent; the frame before displacement   |
| **DRIFT**      | The measured delta between signal state and received state           |
| **RESOLUTION** | The reconstructed or corrected frame after drift analysis            |

These three poles are non-collapsible. No single pole is privileged. The engine applies triadic tension continuously — a clean resolution that eliminates all drift is treated as a substrate warning, not a success state, because zero drift implies either a frozen frame or a failed capture.

Triadic health is assessed per session tick. A healthy triad maintains **drift within the tolerance band** defined by `si_refs: SI-04`.

---

## 4. Substrate Behavior

The Drift Engine runs at the **substrate tier**, meaning it operates beneath evaluator-visible session logic. It does not produce user-facing output directly. Its outputs are consumed by analyzer layers and surfaced only when clarity thresholds are crossed.

### 4.1 Capture Phase

- Reads the current frame state from `clarity/capture.md`
- Stamps a `capture_tick` timestamp
- Records the `anchor_ref` — the last confirmed clean transmission state
- Computes the raw displacement vector `Δ(T, S, I)`

### 4.2 Drift Phase

- Applies the **Drift Coefficient** (`dc`) against dimensional axes T, S, and I
- Tags drift by type: `semantic`, `structural`, or `temporal`
- Drift events above `dc > 0.35` trigger an `ALERT` to the evaluator layer
- Drift events above `dc > 0.72` trigger a `HALT` and queue a resolution request

### 4.3 Resolve Phase

- Pulls the nearest valid anchor from the session registry
- Reconstructs the intended frame state
- Logs the resolution delta to the session context buffer
- Resets the `capture_tick` and clears the active drift queue

---

## 5. Evaluator Role

The evaluator does not drive the Drift Engine — it **reads from it**.

The engine emits a structured drift report at the end of each session tick, available to the evaluator via the `drift_report` channel. The evaluator's responsibilities in relation to this module are:

1. **Acknowledge** alerts when `dc > 0.35`
2. **Decide** on resolution strategy when `dc > 0.72` (auto-resolve or manual anchor)
3. **Set** clarity targets per session (default: `0.91`)
4. **Review** dimensional placement flags raised by the engine

The evaluator may not override substrate captures mid-tick. Override requests are queued and applied at the next capture boundary.

---

## 6. Dimensional Placement

The RTT Drift Engine is positioned along three canonical axes:

| Axis | Label      | Description                                                     |
|------|------------|-----------------------------------------------------------------|
| `T`  | Temporal   | Drift across time — delay, lag, out-of-sequence transmission    |
| `S`  | Structural | Drift across format — schema misalignment, frame decomposition  |
| `I`  | Intentional| Drift across meaning — semantic displacement, intent decay      |

Dimensional coordinates are expressed as a triplet `(T, S, I)` where each value ranges `[0.00, 1.00]`. A coordinate of `(0.00, 0.00, 0.00)` represents a perfect anchor state. A coordinate above `(0.35, 0.35, 0.35)` on any single axis triggers the evaluator alert threshold.

The engine does **not** collapse multi-axis drift into a single scalar. Axis independence is preserved throughout the pipeline.

---

## 7. SI References

The following Semantic Infrastructure references govern this module's behavior:

| SI Ref    | Title                              | Governs                                            |
|-----------|------------------------------------|----------------------------------------------------|
| `SI-04`   | Drift Tolerance Band               | Defines alert and halt thresholds per axis         |
| `SI-11`   | Anchor Registry Protocol           | Governs anchor creation, storage, and expiration   |
| `SI-17`   | Triadic Pole Non-Collapse Rule     | Prohibits single-pole reduction of the SIGNAL/DRIFT/RESOLUTION triad |

All SI references are read-only from this module. Updates to SI documents require a Core review cycle and a canon revision bump.

---

## 8. Analyzer Layers

Drift output is consumed by the following analyzer layers in sequence:

```
RTT_DRIFT_ENGINE (substrate)
        │
        ▼
  [ LAYER 1 ] — Temporal Analyzer
        │         Evaluates T-axis drift; flags out-of-sequence frames
        ▼
  [ LAYER 2 ] — Structural Analyzer
        │         Evaluates S-axis drift; detects schema breaks
        ▼
  [ LAYER 3 ] — Intentional Analyzer
        │         Evaluates I-axis drift; measures semantic displacement
        ▼
  [ LAYER 4 ] — Resolution Composer
                  Synthesizes cross-layer findings into a unified resolution frame
```

Each layer operates independently. A fault in Layer 2 does not block Layer 3. The Resolution Composer (Layer 4) aggregates all available layer outputs and produces the final `drift_report`.

Layer outputs are written to the session context buffer and are visible to the evaluator at tick boundary.

---

## 9. Session Context

The engine maintains a **session context buffer** across the active session lifecycle. Key context fields:

| Field               | Type      | Description                                               |
|---------------------|-----------|-----------------------------------------------------------|
| `session_id`        | `string`  | Unique identifier for the active session                  |
| `capture_tick`      | `int`     | Monotonic counter; increments on each capture cycle       |
| `anchor_ref`        | `string`  | ID of the last confirmed clean transmission anchor        |
| `drift_vector`      | `float[3]`| Current `(T, S, I)` displacement coordinates             |
| `dc`                | `float`   | Active drift coefficient; composite of drift_vector       |
| `alert_state`       | `enum`    | `CLEAR`, `ALERT`, or `HALT`                               |
| `clarity_score`     | `float`   | Evaluator-visible score; updated at each tick boundary    |
| `resolution_queue`  | `array`   | Pending resolution requests, ordered by drift severity    |

The session context buffer is **non-persistent by default**. Session state is flushed at session close unless the evaluator explicitly sets `persist_context: true`.

---

## 10. Clarity Targets

Clarity targets define the minimum acceptable clarity score for a session to be considered healthy. The default target is `0.91`.

| Target Level | Score Range  | Meaning                                                  |
|--------------|--------------|----------------------------------------------------------|
| `CRITICAL`   | `< 0.60`     | Session integrity compromised; resolution required       |
| `DEGRADED`   | `0.60 – 0.79`| Drift is accumulating; evaluator review recommended      |
| `NOMINAL`    | `0.80 – 0.90`| Within acceptable range; monitor for trend               |
| `HEALTHY`    | `0.91 – 0.97`| Target band; drift is being resolved within tolerance    |
| `LOCKED`     | `> 0.97`     | Substrate warning — potential frozen frame; verify anchor|

The clarity score is computed from the inverse of the composite drift coefficient, weighted across all three axes, and adjusted by the resolution success rate of the current session.

A `LOCKED` score above `0.97` is **not** treated as an ideal state. Per SI-04 and the triadic non-collapse rule (SI-17), a session with no measurable drift may indicate a failed capture, a stale anchor, or a substrate loop. The engine raises a `SUBSTRATE_WARN` flag in this condition.

---

## 11. Changelog

| Rev    | Date       | Change                                          |
|--------|------------|-------------------------------------------------|
| R5.3   | 2026-09-27 | Added `LOCKED` clarity state; SUBSTRATE_WARN flag |
| R5.2   | 2026-07-14 | Intentional Analyzer promoted to Layer 3        |
| R5.1   | 2026-04-02 | SI-17 triadic non-collapse rule enforced        |
| R5.0   | 2026-01-19 | Initial R5 canon release                        |

---

*TriadicFrameworks R5 · RTT_DRIFT_ENGINE · Canon README · Do not edit below substrate tier without Core review.*
