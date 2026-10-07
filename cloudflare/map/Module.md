<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />

  <title>Clarity Map — TriadicFrameworks</title>
  <meta name="triadic:id" content="clarity.map" />
  <meta name="triadic:version" content="1.0.0" />
  <meta name="triadic:canon_version" content="R5" />
  <meta name="triadic:category" content="map" />
  <meta name="triadic:roles" content="map,clarity" />

  <meta name="triadic:rtt:drift" content="bounded" />
  <meta name="triadic:rtt:coherence" content="declared" />
  <meta name="triadic:rtt:regime" content="clarity-aware" />
  <meta name="triadic:rtt:clarity" content="C3" />

  <meta name="triadic:dimensional:primary" content="3D" />
  <meta name="triadic:dimensional:list" content="1D,2D,3D" />

  <meta name="triadic:si:ontology_ref" content="si://clarity/ontology" />
  <meta name="triadic:si:lexicon_ref" content="si://clarity/lexicon" />
  <meta name="triadic:si:semantic_api_ref" content="si://clarity/api" />

  <meta name="triadic:lineage:parent" content="clarity" />
  <meta name="triadic:lineage:siblings" content="clarity.engine,clarity.signature,clarity.diagnostic,clarity.example,clarity.extension,clarity.template" />
  <meta name="triadic:lineage:children" content="" />

  <meta name="triadic:badge:label" content="Clarity Map" />
  <meta name="triadic:badge:category" content="RTT" />
  <meta name="triadic:audit:status" content="clean" />
</head>
<body>

  <header>
    <h1>Clarity Map</h1>
    <p><strong>Module ID:</strong> clarity.map · <strong>Canon:</strong> R5 · <strong>Version:</strong> 1.0.0</p>
    <p><strong>Category:</strong> map · <strong>Roles:</strong> map, clarity</p>
  </header>

  <section id="summary">
    <h2>Summary</h2>
    <p>
      The Clarity Map visualizes clarity trajectories across drift and coherence evolution.
      It provides structural maps used by diagnostics, examples, and teaching modules.
    </p>
  </section>

  <section id="triad">
    <h2>Triadic Structure</h2>
    <ul>
      <li><strong>Structure (S):</strong> clarity-trajectory-map</li>
      <li><strong>Resonance (R):</strong> clarity-path-resonance</li>
      <li><strong>Activation (A):</strong> clarity-map-activation</li>
    </ul>

    <h3>Substrate</h3>
    <ul>
      <li><strong>ΔC:</strong> clarity delta along mapped paths</li>
      <li><strong>Oscillation:</strong> clarity oscillation across regimes</li>
      <li><strong>Regime:</strong> bounded · flowing · unstable</li>
    </ul>
  </section>

  <section id="rtt">
    <h2>RTT Profile</h2>
    <ul>
      <li><strong>Drift:</strong> bounded</li>
      <li><strong>Coherence:</strong> declared</li>
      <li><strong>Regime:</strong> clarity-aware</li>
      <li><strong>Clarity Baseline:</strong> C3</li>
    </ul>
  </section>

  <section id="analyzers">
    <h2>Analyzer Layers</h2>
    <h3>Operator</h3>
    <ul>
      <li>triad</li>
      <li>stability_index</li>
    </ul>
    <h3>Dimensional</h3>
    <ul>
      <li>clarity_map_dimensional_scan</li>
    </ul>
    <h3>Regime</h3>
    <ul>
      <li>regime_map</li>
    </ul>
    <h3>Drift</h3>
    <ul>
      <li>drift_path_trace</li>
    </ul>
    <h3>Coherence</h3>
    <ul>
      <li>coherence_path_trace</li>
    </ul>
    <h3>Cross-Cutting</h3>
    <ul>
      <li>clarity_map_cross_section</li>
    </ul>
  </section>

  <section id="session">
    <h2>Session Context</h2>
    <p>
      Used to visualize clarity evolution in RTT sessions, especially for teaching drift/coherence transitions.
    </p>
  </section>

  <section id="audit">
    <h2>Audit</h2>
    <ul>
      <li><strong>Status:</strong> clean</li>
      <li><strong>Notes:</strong>
        <ul>
          <li>Map analyzers validated</li>
        </ul>
      </li>
    </ul>

    <h3>Diff</h3>
    <ul>
      <li><strong>Previous Version:</strong> 0.9.0</li>
      <li><strong>Changes:</strong>
        <ul>
          <li>Initial Cloudflare map scaffold</li>
        </ul>
      </li>
    </ul>
  </section>

</body>
</html>
