# **TriadicFrameworks — Semantic API Specification**  
### Canon Version: 1.0  
### File: `/platform/api/semantic_api_spec.md`

---

## **1. Purpose**

The Semantic API exposes Structural Intelligence (SI) as a deterministic, ontology‑driven interface.  
Every endpoint returns a **SemanticTRO** enriched with:

- ontology entities  
- semantic relations  
- graph nodes + edges  
- RTT evaluator lineage  
- module metadata references  

This API is used by:

- RTT Suite engines  
- Cloudflare AI Marketplace adapter  
- module.json semantic discovery  
- SI Ontology graph tools  
- TriadicFrameworks education modules  

---

## **2. Base TRO Structure**

All endpoints return the canonical **SemanticTRO**:

```json
{
  "engine": "si.semantic.<endpoint>",
  "triadic": { ... },
  "substrate": { ... },
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

## **3. Endpoints**

### **3.1 `/si/semantic/triadic-map`**  
Maps input text or TRO into triadic structure (S/R/A) and semantic graph.

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
- triadic S/R/A mapping  
- ontology entities: TriadicLayer, Evaluator  
- semantic graph of relations  

---

### **3.2 `/si/semantic/substrate-map`**  
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

### **3.3 `/si/semantic/evaluator-map`**  
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

### **3.4 `/si/semantic/module-map`**  
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

### **3.5 `/si/semantic/pipeline-map`**  
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

### **3.6 `/si/semantic/graph-query`**  
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

## **4. Request/Response Patterns**

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

## **5. Error Model**

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

## **6. Canon Notes**

- All endpoints are deterministic  
- All responses are TROs  
- All semantic graphs follow RTT lineage  
- All ontology entities map to SI Ontology classes  
- All modules use module.json metadata for semantic discovery  
