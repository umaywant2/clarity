# **Structural Intelligence — Semantic API (SI Semantic API)**  
### Canon Version: R5  
### File: `/docs/si_semantic_api.md`  
  [github.com](https://github.com/umaywant2/clarity/edit/main/docs/si_semantic_api.md)

---

## **1. Purpose**

The **SI Semantic API** exposes Structural Intelligence as a deterministic, ontology‑driven interface.  
It transforms text, TROs, and module metadata into:

- triadic structure  
- substrate primitives  
- evaluator lineage  
- semantic graphs  
- ontology entities  
- pipeline mappings  

This API is the semantic backbone of the RTT Suite.

---

## **2. Core Principles**

The Semantic API follows five canonical principles:

1. **Deterministic** — no probabilistic inference.  
2. **Ontology‑Driven** — every endpoint maps to SI Ontology classes.  
3. **Triadic‑Aligned** — S/R/A structure is always preserved.  
4. **Evaluator‑Consistent** — Drift → Coherence → Regime → Clarity lineage enforced.  
5. **Graph‑Structured** — all outputs include semantic graph nodes + edges.

---

## **3. Base Response Format**

All endpoints return a **SemanticTRO**, extending the standard TRO with ontology and graph fields:

```json
{
  "engine": "si.semantic.<endpoint>",
  "triadic": { ... },
  "substrate": { ... },
  "evaluators": { ... },
  "commentary": { ... },
  "metadata": { ... },
  "ontology": {
    "entities": [],
    "relations": [],
    "classes": []
  },
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

---

## **4. Endpoints**

The Semantic API contains **six canonical endpoints**.

---

### **4.1 `/si/semantic/triadic-map`**

Maps text or TRO into triadic structure (S/R/A) and semantic graph.

**Input:**
```json
{
  "text": "string",
  "options": {
    "include_graph": true,
    "include_ontology": true,
    "focus": ["TriadicLayer", "Evaluator"]
  }
}
```

**Output:**
- triadic mapping  
- ontology entities: TriadicLayer, Evaluator  
- semantic graph  

---

### **4.2 `/si/semantic/substrate-map`**

Maps content into substrate primitives (Δ / Op / Rg families).

**Input:**
```json
{
  "text": "string",
  "options": {
    "include_graph": true,
    "focus": ["SubstratePrimitive"]
  }
}
```

**Output:**
- substrate primitives  
- polarity + stability  
- substrate graph  

---

### **4.3 `/si/semantic/evaluator-map`**

Runs Drift → Coherence → Regime → Clarity mapping.

**Input:**
```json
{
  "tro": { ... },
  "options": {
    "include_graph": true,
    "focus": ["Evaluator"]
  }
}
```

**Output:**
- evaluator graph  
- drift/coherence/regime/clarity relations  
- evaluator lineage  

---

### **4.4 `/si/semantic/module-map`**

Maps a module.json manifest into ontology entities.

**Input:**
```json
{
  "module": { ... },
  "options": {
    "include_graph": true,
    "focus": ["CanonModule", "MetadataEntity"]
  }
}
```

**Output:**
- CanonModule entity  
- metadata lineage  
- analyzer-layer mapping  
- module semantic graph  

---

### **4.5 `/si/semantic/pipeline-map`**

Runs the full RTT pipeline and returns semantic graph.

**Input:**
```json
{
  "text": "string",
  "options": {
    "include_graph": true,
    "focus": ["PipelineStep"]
  }
}
```

**Output:**
- Drift → Coherence → Regime → Clarity pipeline  
- pipeline graph  
- evaluator relations  

---

### **4.6 `/si/semantic/graph-query`**

Queries the ontology graph.

**Input:**
```json
{
  "query": "string",
  "options": {
    "include_graph": true
  }
}
```

**Output:**
- filtered ontology graph  
- semantic relations matching query  

---

## **5. Request/Response Patterns**

### **Request**
```json
{
  "input": "<content or TRO>",
  "options": {
    "include_graph": true,
    "include_ontology": true,
    "focus": ["TriadicLayer", "Evaluator", "SubstratePrimitive"]
  }
}
```

### **Response**
- always includes TRO core  
- optionally includes ontology + graph sections  

---

## **6. Error Model**

Semantic errors return:

```json
{
  "engine": "si.semantic.error",
  "commentary": { "summary": "Ontology constraint violation" },
  "ontology": {
    "violations": [
      { "constraint": "TriadicOrthogonality", "details": "..." }
    ]
  }
}
```

---

## **7. Ontology Integration**

The Semantic API is powered by the **SI Ontology**, which defines:

- TriadicLayer  
- SubstratePrimitive  
- Evaluator  
- CanonModule  
- MetadataEntity  
- PipelineStep  

Every endpoint maps directly to ontology classes and relations.

---

## **8. Canon Notes**

- All endpoints are deterministic.  
- All responses are TROs.  
- All semantic graphs follow triadic orthogonality.  
- All modules use module.json metadata for semantic discovery.  
- All evaluator lineage is enforced.  

---

## **9. Status**

The SI Semantic API is **canonical, stable, and complete for R5**.
