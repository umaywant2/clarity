
- [`module.json`](https://raw.githubusercontent.com/umaywant2/clarity/refs/heads/main/models/clarity/module.json) — Agentic module schema role assignments

**Path:** `clarity/models/clarity/README.md`  
**Version:** R5.1  
**Module Class:** Canon Core  
**Role:** Real‑Time Calibration & Intent Coherence Engine

---

## Overview

The **RTT_CLARITY_ENGINE** is the central calibration mechanism of the TriadicFrameworks canon.  
Where the Drift Engine detects deviation, the Clarity Engine maintains *alignment* — ensuring that intent, meaning, and structural coherence remain stable across evaluation cycles.

Clarity is not a static property; it is a *dynamic equilibrium* maintained through continuous measurement, pulse‑based verification, and corrective feedback loops.

The Clarity Engine provides:

- Real‑time coherence scoring  
- Intent vector stabilization  
- Calibration curve management  
- Pulse‑based alignment checkpoints  
- Cross‑module clarity signals for Drift, Coherence, Regime, and Session engines  

---

## Canonical Responsibilities

### **1. Intent Vector Stabilization**  
The engine maintains a baseline intent vector derived from substrate meaning, evaluator context, and module metadata.  
It detects divergence and applies corrective weighting.

### **2. Semantic Coherence Measurement**  
Clarity computes coherence across parse units, dimensional axes, and relational chains.  
This coherence score is used by Drift, Coherence, and Regime modules.

### **3. Calibration Curve Management**  
The Clarity Engine owns the global sigmoid calibration curve used across RTT modules.  
It adjusts steepness (**k**) and inflection point (**X₀**) based on variance history.

### **4. Pulse‑Based Alignment (CPC Integration)**  
Every **pulse_interval** ticks, Clarity emits a CPC signal to verify:

- State alignment  
- Calibration accuracy  
- Practitioner alignment  
- Dimensional stability  

### **5. Cross‑Module Clarity Signals**  
Clarity outputs structured clarity signals consumed by:

- Drift Engine (DS modulation)  
- Coherence Engine (CE scoring)  
- Regime Engine (regime stability)  
- Session Engine (learning loop gating)  

---

## Core Data Structures

### **Clarity Substrate Object**
Contains:

- `intent_vector`  
- `semantic_coherence`  
- `relational_map`  
- `anchor_density`  
- `flux_weight`  
- `calibration_state`  

### **Clarity Pulse Object**
Emitted at CPC intervals:

- `pulse_id`  
- `tick_index`  
- `state_verification`  
- `calibration_audit`  
- `alignment_score`  
- `pulse_decision`  

---

## Clarity Score (CS)

The Clarity Score is the engine’s primary metric:

$$
CS = \frac{semantic\_coherence \times intent\_alignment}{flux\_weight}
$$

- High CS → stable, aligned substrate  
- Low CS → drift risk, misalignment, or anchor collapse  

CS is used by Drift Engine to modulate DS and by Regime Engine to determine stability.

---

## Module Interactions

### **With Drift Engine**  
- Provides anchor presence values  
- Supplies coherence baseline  
- Modulates DS via flux weighting  

### **With Coherence Engine**  
- Shares semantic coherence metrics  
- Receives relational entropy updates  

### **With Regime Engine**  
- Provides clarity stability signals  
- Receives regime‑level calibration feedback  

### **With Session Engine**  
- Gates learning loops  
- Determines readiness for progression  

---

## File Map (Clarity Module)

```
models/clarity/
│
├── clarity_engine.py        # Core engine implementation
├── clarity_schema.json      # Canonical schema definition
├── clarity_test.md          # Test suite and evaluator exercises
├── README.md                # (This file)
└── diagrams.md              # Architecture diagrams
```

---

## Practitioner Notes

- Clarity is the *first* engine to destabilize when intent coherence drops.  
- CPC signals should never be ignored; they are alignment gates.  
- Calibration curve adjustments should be logged for recurrence analysis.  
- Clarity signals are consumed by multiple modules — treat them as canonical truth.

---

## Versioning

- **R5.1.0** — Current canonical release  
- Minor versions track calibration improvements  
- Patch versions track hotfixes to coherence scoring or pulse logic  
