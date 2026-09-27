# **RTT Suite — Clarity Engine Test**  
### File: `/models/clarity/clarity_test.md`  
### Canon Version: 1.0  
### Engine: **rtt.clarity**  
### Purpose: Validate clarity scoring, pulse signature classification (C1, C2, C3), and TRO structure.

---

## **1. Test Identity**

**Evaluator:** Clarity  
**Triadic Inputs:** Structure, Resonance, Activation  
**Output:** ClarityTRO  
**Goal:** Ensure deterministic clarity evaluation across multiple triadic configurations.

---

## **2. Test Cases**

### **Test Case 1 — High Clarity (C1 Pulse)**
**Input:**
```
structure: 0.55
resonance: 0.52
activation: 0.40
```

**Expected Clarity Score:** > 0.75  
**Expected Pulse:** `C1`  
**Expected Summary:**  
“Clarity score ~0.82 with pulse signature C1.”

---

### **Test Case 2 — Moderate Clarity (C2 Pulse)**
**Input:**
```
structure: 0.40
resonance: 0.38
activation: 0.55
```

**Expected Clarity Score:** > 0.40 and ≤ 0.75  
**Expected Pulse:** `C2`

---

### **Test Case 3 — Low Clarity (C3 Pulse)**
**Input:**
```
structure: 0.10
resonance: 0.80
activation: 0.90
```

**Expected Clarity Score:** < 0.40  
**Expected Pulse:** `C3`

---

### **Test Case 4 — Activation‑Dominant Noise**
**Input:**
```
structure: 0.30
resonance: 0.32
activation: 0.95
```

**Expected Pulse:** `C3`  
(Activation far from moderation center)

---

### **Test Case 5 — Structural–Resonance Alignment**
**Input:**
```
structure: 0.70
resonance: 0.72
activation: 0.50
```

**Expected Pulse:** `C1`  
(High alignment + perfect activation moderation)

---

## **3. TRO Validation Checklist**

### **3.1 TRO Structure**
- `engine` = `"rtt.clarity"`  
- `triadic.structure` populated  
- `triadic.resonance` populated  
- `triadic.activation` populated  

### **3.2 Substrate Fields**
Even if placeholder values, the following must exist:

- `substrate.delta.*`  
- `substrate.operators.*`  
- `substrate.regimes.*`  
- `substrate.polarity`  
- `substrate.stability`  
- `substrate.coupling`  
- `substrate.resonance`  

### **3.3 Commentary**
- `summary` populated  
- `notes` list present  
- `envelopes.clarity` populated  
- `envelopes.pulse` populated  

### **3.4 Metadata**
- `version` = `"1.0"`  
- `timestamp` present  
- `request_id` present  

---

## **4. Test Execution Notes**

- Clarity score uses alignment + moderation heuristic:  
  - **alignment = 1 − |S − R|**  
  - **moderation = 1 − |A − 0.5|**  
  - **clarity = 0.6·alignment + 0.4·moderation**  
- Pulse thresholds:  
  - `> 0.75` → C1  
  - `> 0.40` → C2  
  - else → C3  
- TRO must remain structurally complete even with placeholder substrate values.

---

## **5. Canon Notes**

- Clarity tests validate the **transparency** portion of the Evaluator Layer.  
- Clarity envelopes complete the RTT evaluator pipeline.  
- Drift → Coherence → Regime → **Clarity** must remain stable and deterministic.

---

## **6. Status**

**Scaffold complete.**  
Ready for implementation tests once full clarity logic is added.
