# Cross‑Module Integration Map  
**Clarity ↔ Drift ↔ Coherence ↔ Regime**

```text
                         ┌───────────────────────────────┐
                         │        CLARITY ENGINE          │
                         │  (intent, coherence, anchors)  │
                         └───────────────────────────────┘
                                      │
                                      │ clarity_signal
                                      ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                         DRIFT ENGINE                         │
        │   DS = (semantic_deviation × flux_weight) / anchor_presence  │
        │   - uses clarity_signal for:                                  │
        │       • anchor_presence                                       │
        │       • semantic_coherence baseline                           │
        │       • flux_weight modulation                                │
        │   - outputs drift_log + corrected substrate                   │
        └──────────────────────────────────────────────────────────────┘
                                      │
                                      │ drift_stability_signal
                                      ▼
                         ┌───────────────────────────────┐
                         │       COHERENCE ENGINE         │
                         │  (semantic + relational CE)    │
                         └───────────────────────────────┘
                                      │
                                      │ coherence_stability_signal
                                      ▼
                         ┌───────────────────────────────┐
                         │        REGIME ENGINE           │
                         │  (regime stability + shifts)   │
                         └───────────────────────────────┘
                                      │
                                      │ regime_feedback
                                      ▼
                         ┌───────────────────────────────┐
                         │        CLARITY ENGINE          │
                         │  (calibration_curve updates)   │
                         └───────────────────────────────┘
```

---

## Module‑to‑Module Data Flows

### **Clarity → Drift**
Clarity provides:
- **semantic_coherence baseline**  
- **anchor_presence values**  
- **flux_weight** (modulates DS)  
- **intent_vector alignment**  

Drift uses these to:
- compute DS  
- detect drift candidates  
- determine escalation vs suppression  

---

### **Drift → Coherence**
Drift outputs:
- **drift_log entries**  
- **corrected substrate**  
- **dimensional flags**  

Coherence uses these to:
- update relational entropy  
- refine semantic coherence  
- detect cross‑unit instability  

---

### **Coherence → Regime**
Coherence provides:
- **coherence_stability_signal**  
- **relational_map stability**  
- **semantic continuity metrics**  

Regime uses these to:
- determine regime stability  
- detect regime shifts  
- trigger regime‑level recalibration  

---

### **Regime → Clarity**
Regime provides:
- **regime_feedback**  
- **stability deltas**  
- **regime‑level calibration hints**  

Clarity uses these to:
- adjust calibration_curve (k, X₀)  
- update clarity_threshold  
- trigger CPC interrupts  

---

## Feedback Loop Summary

1. **Clarity stabilizes intent + coherence.**  
2. **Drift detects deviation using Clarity’s baseline.**  
3. **Coherence evaluates meaning + relational stability.**  
4. **Regime determines global stability + shifts.**  
5. **Regime feeds back into Clarity for recalibration.**

This forms a **closed‑loop stability system** across the RTT canon.
