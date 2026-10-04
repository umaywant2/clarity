<script>
(function () {
  // Only proceed if the browser supports WebMCP
  if (!("modelContext" in navigator)) {
    return;
  }

  const abortController = new AbortController();

  function registerTool(def) {
    navigator.modelContext.registerTool(def, {
      signal: abortController.signal
    });
  }

  // --- TriadicFrameworks WebMCP Tools ---

  registerTool({
    name: "triadic-search",
    description: "Search TriadicFrameworks modules, RTT operators, coherence layers, and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    },
    async execute({ query }) {
      const res = await fetch(`/MCP/search?q=${encodeURIComponent(query)}`);
      return await res.json();
    }
  });

  registerTool({
    name: "triadic-module",
    description: "Retrieve a TriadicFrameworks module by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    },
    async execute({ id }) {
      const res = await fetch(`/MCP/module?id=${encodeURIComponent(id)}`);
      return await res.json();
    }
  });

  registerTool({
    name: "triadic-rtt-eval",
    description: "Evaluate RTT operators using the Quad Engine.",
    inputSchema: {
      type: "object",
      properties: {
        operator: { type: "string" },
        input: { type: "string" }
      },
      required: ["operator", "input"]
    },
    async execute({ operator, input }) {
      const res = await fetch(
        `/MCP/rtt?operator=${encodeURIComponent(operator)}&input=${encodeURIComponent(input)}`
      );
      return await res.json();
    }
  });

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    abortController.abort();
  });
})();
</script>
