<script>
(function () {
  // WebMCP only exists in browsers that support it
  if (!("modelContext" in navigator)) {
    return;
  }

  const abortController = new AbortController();

  // Helper to register a tool
  function register(name, description, inputSchema, execute) {
    navigator.modelContext.registerTool(
      {
        name,
        description,
        inputSchema,
        execute
      },
      { signal: abortController.signal }
    );
  }

  // --- TriadicFrameworks WebMCP Tools ---

  register(
    "triadic-search",
    "Search TriadicFrameworks modules, RTT operators, coherence layers, and metadata.",
    {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    },
    async ({ query }) => {
      const res = await fetch(`/MCP/search?q=${encodeURIComponent(query)}`);
      return await res.json();
    }
  );

  register(
    "triadic-module",
    "Retrieve a TriadicFrameworks module by ID.",
    {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    },
    async ({ id }) => {
      const res = await fetch(`/MCP/module?id=${encodeURIComponent(id)}`);
      return await res.json();
    }
  );

  register(
    "triadic-rtt-eval",
    "Evaluate RTT operators using the Quad Engine.",
    {
      type: "object",
      properties: {
        operator: { type: "string" },
        input: { type: "string" }
      },
      required: ["operator", "input"]
    },
    async ({ operator, input }) => {
      const res = await fetch(
        `/MCP/rtt?operator=${encodeURIComponent(operator)}&input=${encodeURIComponent(input)}`
      );
      return await res.json();
    }
  );

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    abortController.abort();
  });
})();
</script>
