# **RTT Suite — Regime Engine Test**  
### File: `/models/regime/regime_test.md`  
### Canon Version: 1.0  
### Engine: **rtt.regime**  
### Purpose: Validate regime dominance classification (Rg.S, Rg.R, Rg.A), regime envelopes, and TRO structure.

---

## **1. Test Identity**

**Evaluator:** Regime  
**Triadic Inputs:** Structure, Resonance, Activation  
**Output:** RegimeTRO  
**Goal:** Ensure deterministic regime classification across multiple triadic configurations.

---

## **2. Test Cases**

### **Test Case 1 — Structural Dominance**
**Input:**
```
structure: 0.70
resonance: 0.40
activation: 0.20
```

**Expected Regime:** `Rg.S`  
**Expected Summary:**  
“Regime classified as Rg.S.”

---

### **Test Case 2 — Resonance Dominance**
**Input:**
```
structure: 0.30
resonance: 0.85
activation: 0.40
```

**Expected Regime:** `Rg.R`  
**Expected Summary:**  
“Regime classified as Rg.R.”

---

### **Test Case 3 — Activation Dominance**
**Input:**
```
structure: 0.10
resonance: 0.20
activation: 0.90
```

**Expected Regime:** `Rg.A`

---

### **Test Case 4 — Structural–Resonance Pairing**
**Input:**
```
structure: 0.60
resonance: 0.58
activation: 0.10
```

**Expected Regime:** `Rg.S`  
(Structure slightly higher than Resonance)

---

### **Test Case 5 — Near‑Equal Triad**
**Input:**
```
structure: 0.50
resonance: 0.49
activation: 0.48
```

**Expected Regime:** `Rg.S`  
(Highest value wins even if differences are small)

---

## **3. TRO Validation Checklist**

### **3.1 TRO Structure**
- `engine` = `"rtt.regime"`  
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
- `envelopes.regime` populated  

### **3.4 Metadata**
- `version` = `"1.0"`  
- `timestamp` present  
- `request_id` present  

---

## **4. Test Execution Notes**

- Regime classification uses **dominance logic**:  
  Highest of S/R/A determines regime.  
- No thresholds — pure max‑value selection.  
- TRO must remain structurally complete even with placeholder substrate values.

---

## **5. Canon Notes**

- Regime tests validate the **mode‑dominance** portion of the Evaluator Layer.  
- Regime envelopes feed directly into Clarity tests.  
- Drift → Coherence → Regime → Clarity pipeline must remain stable and deterministic.

---

## **6. Status**

**Scaffold complete.**  
Ready for implementation tests once full regime logic is added.
