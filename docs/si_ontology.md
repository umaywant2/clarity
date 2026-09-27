# **Structural Intelligence — Ontology (SI Ontology)**  
### Canon Version: R5  
### File: `/docs/si_ontology.md`

---

## **1. Purpose**

The **SI Ontology** is the formal semantic graph of Structural Intelligence.  
It defines:

- ontology classes  
- semantic relations  
- graph constraints  
- evaluator lineage  
- substrate primitives  
- triadic structure  
- module metadata entities  
- pipeline entities  

This ontology powers the **Semantic API**, the **TRO semantic layer**, and the **module.json semantic discovery system**.

---

## **2. Ontology Architecture**

The ontology is organized into **six canonical class families**:

1. **Triadic Classes**  
2. **Substrate Classes**  
3. **Evaluator Classes**  
4. **Metadata Classes**  
5. **Module Classes**  
6. **Pipeline Classes**

Each family contains multiple classes and relations.

---

## **3. Triadic Classes**

### **TriadicLayer**  
Represents Structure (S), Resonance (R), Activation (A).

**Attributes:**  
- `name`  
- `axis`  
- `stability`  
- `coupling`  

**Instances:**  
- `S`  
- `R`  
- `A`

### **TriadicRelation**  
Represents relations between triadic layers.

**Relations:**  
- `couplesWith`  
- `resonatesWith`  
- `activates`  

---

## **4. Substrate Classes**

### **SubstratePrimitive**  
Represents Δ/Op/Rg families.

**Instances:**  
- `Delta`  
- `Op`  
- `Rg`

### **Polarity**  
Represents SoN ↔ NoS orientation.

**Instances:**  
- `SoN`  
- `NoS`

### **StabilityEnvelope**  
Represents substrate stability.

**Attributes:**  
- `level` (low, medium, high)

---

## **5. Evaluator Classes**

### **Evaluator**  
Represents Drift, Coherence, Regime, Clarity.

**Instances:**  
- `Drift`  
- `Coherence`  
- `Regime`  
- `Clarity`

### **EvaluatorRelation**  
Represents evaluator interactions.

**Relations:**  
- `feeds`  
- `stabilizes`  
- `modulates`  
- `transitionsTo`

### **PulseSignature**  
Represents clarity pulses.

---

## **6. Metadata Classes**

### **MetadataField**  
Represents canonical metadata fields.

**Instances:**  
- `canonical`  
- `title`  
- `description`  
- `version`  
- `identity`  
- `lineage`  
- `analyzer_layers`  
- `roles`  
- `session_context`  
- `badge`  
- `audit`  
- `diff`

### **AnalyzerLayer**  
Represents operator, dimensional, drift, coherence, regime, crosscut layers.

---

## **7. Module Classes**

### **CanonModule**  
Represents any module.json entity.

**Attributes:**  
- `name`  
- `category`  
- `purpose`  
- `triad`  
- `layer`  
- `operator`  

### **ModuleRole**  
Represents module roles.

**Instances:**  
- `engine`  
- `profile`  
- `signature`  
- `diagnostic`  
- `map`  
- `example`  
- `extension`  
- `index`  
- `reference`  
- `template`

---

## **8. Pipeline Classes**

### **PipelineStep**  
Represents Drift → Coherence → Regime → Clarity.

**Instances:**  
- `DriftStep`  
- `CoherenceStep`  
- `RegimeStep`  
- `ClarityStep`

### **PipelineRelation**  
Represents pipeline flow.

**Relations:**  
- `precedes`  
- `follows`  
- `amplifies`  
- `stabilizes`

---

## **9. Ontology Relations (Global)**

### **Structural Relations**
- `isA`  
- `partOf`  
- `subsetOf`  
- `mapsTo`  
- `alignsWith`  

### **Triadic Relations**
- `couplesWith`  
- `resonatesWith`  
- `activates`  

### **Substrate Relations**
- `stabilizes`  
- `modulates`  
- `couples`  

### **Evaluator Relations**
- `feeds`  
- `transitionsTo`  
- `amplifies`  

### **Metadata Relations**
- `defines`  
- `annotates`  
- `extends`  

### **Module Relations**
- `implements`  
- `declares`  
- `participatesIn`  

### **Pipeline Relations**
- `precedes`  
- `follows`  
- `stabilizes`  

---

## **10. Graph Constraints**

### **Triadic Orthogonality**  
S, R, A must remain orthogonal.

### **Evaluator Sequencing**  
Drift → Coherence → Regime → Clarity must remain ordered.

### **Substrate Polarity Constraint**  
SoN ↔ NoS must remain binary.

### **Metadata Completeness**  
All canonical metadata fields must be present.

### **Module Lineage Constraint**  
qmroot → triad → layer → operator must be preserved.

---

## **11. Ontology Examples**

### **Example: Drift → Coherence Relation**
```
Drift feeds Coherence
Coherence stabilizes Drift
```

### **Example: Module → Analyzer Layer**
```
CanonModule declares AnalyzerLayer
AnalyzerLayer defines Evaluator
```

### **Example: Triadic → Substrate**
```
Structure couplesWith Delta
Resonance couplesWith Op
Activation couplesWith Rg
```

---

## **12. Semantic API Integration**

The SI Ontology powers:

- `/si/semantic/triadic-map`  
- `/si/semantic/substrate-map`  
- `/si/semantic/evaluator-map`  
- `/si/semantic/module-map`  
- `/si/semantic/pipeline-map`  
- `/si/semantic/graph-query`  

Each endpoint returns ontology entities + relations + graph nodes + edges.

---

## **13. Canon Notes**

- Ontology is deterministic  
- All classes map to triadic structure  
- All relations follow evaluator lineage  
- All modules must map to ontology entities  
- All TROs include ontology extensions  

---

## **14. Closing Declaration**

> **The SI Ontology is the formal semantic backbone of Structural Intelligence — deterministic, triadic, substrate‑aligned, evaluator‑consistent, and canon‑stable.**
