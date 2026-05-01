# @us-all MCP Server Standard

> **Status**: Living document. Reflects patterns proven across 6 production MCP servers as of 2026-05.
>
> **Audience**: Authors of new `@us-all/*` MCP servers, or contributors evolving existing ones.
>
> **Why this exists**: 2026 saw upstream vendors (Datadog, Google, Databricks, OpenMetadata 1.12, etc.) ship official MCP servers in most categories we operated in. The differentiation that survived was not "more tools" but **"feature-rich + token-efficient by design"** — concrete patterns that keep LLM context costs low while preserving deep coverage. This document captures those patterns so the next MCP server starts at the right place.

## Reference repositories

| repo | npm | size |
|------|-----|------|
| [openmetadata-mcp-server](https://github.com/us-all/openmetadata-mcp-server) | `@us-all/openmetadata-mcp` | 156 tools |
| [datadog-mcp-server](https://github.com/us-all/datadog-mcp-server) | `@us-all/datadog-mcp` | 159 tools |
| [google-drive-mcp-server](https://github.com/us-all/google-drive-mcp-server) | `@us-all/google-drive-mcp` | 96 tools |
| [mlflow-mcp-server](https://github.com/us-all/mlflow-mcp-server) | `@us-all/mlflow-mcp` | 79 tools |
| [unifi-mcp-server](https://github.com/us-all/unifi-mcp-server) | `@us-all/unifi-mcp` | 52 tools |
| [android-mcp-server](https://github.com/us-all/android-mcp-server) | `@us-all/android-mcp` | 73 tools |

## The four token-efficiency patterns

### 1. Tool registry + category-based ENV toggle

**File**: `src/tool-registry.ts`. Define a `CATEGORIES` const array that fits your domain (Datadog: `metrics, monitors, logs, apm, rum, ...`; OpenMetadata: `core, governance, quality, ...`). Wrap `server.tool` with a `tool()` helper that:

1. Registers every tool in the registry (so `search-tools` can find them even if disabled).
2. Conditionally calls the underlying `server.tool` only if the current category is enabled per `<PREFIX>_TOOLS` (allowlist) / `<PREFIX>_DISABLE` (denylist) env vars.

In `src/index.ts`:

```ts
let currentCategory: Category = "default-cat";
function tool(name: string, description: string, schema: any, handler: any): void {
  registry.register(name, description, currentCategory);
  if (registry.isEnabled(currentCategory)) {
    server.tool(name, description, schema, handler);
  }
}

// Section header sets the category for everything below it
currentCategory = "metrics";
tool("query-metrics", "...", schema, handler);
```

**Measured impact** (real `tools/list` JSON sizes, ~4 chars/token):

| Server | Default | Narrow toggle | Reduction |
|--------|---------|---------------|-----------|
| openmetadata | 24K tokens | 4.6K (`OM_TOOLS=search,core`) | **−81%** |
| datadog      | 25K tokens | 3.8K (`DD_TOOLS=metrics,monitors`) | **−85%** |
| google-drive | 18K tokens | 4.0K (`GD_TOOLS=drive`) | **−78%** |
| android      | 9.2K tokens | 2.5K (`ANDROID_TOOLS=device,ui`) | **−73%** |

### 2. `search-tools` meta-tool (always enabled)

A search tool that queries the registry and returns matching tool names + descriptions. Always loaded regardless of category toggles, so even with a narrow allowlist users can discover what else exists. Re-launch with broader categories if needed.

```ts
export async function searchTools(params: { query: string; category?: string; limit?: number }) {
  const matches = registry.search(params.query, params.category, params.limit);
  return { query: params.query, matchCount: matches.length, summary: registry.summary(), matches };
}
```

### 3. `extractFields` response projection (auto-applied)

**File**: `src/tools/extract-fields.ts`. A pure helper that takes a comma-separated dotted-path expression with `*` wildcards and projects only the requested fields from a response.

```
extractFields="id,owner.name,columns.*.name,columns.*.dataType"
→ keeps only those fields, drops everything else
```

**Wire it once in `wrapToolHandler`**:

```ts
import { applyExtractFields } from "./extract-fields.js";

export function wrapToolHandler<T>(fn: (params: T) => Promise<unknown>) {
  return async (params: T) => {
    const result = await fn(params);
    const expr = (params as Record<string, unknown> | undefined)?.extractFields;
    const projected = typeof expr === "string" ? applyExtractFields(result, expr) : result;
    return { content: [{ type: "text" as const, text: JSON.stringify(projected, null, 2) }] };
  };
}
```

Then declare the field on read tool schemas you want LLMs to use it on:

```ts
const ef = z.string().optional().describe(extractFieldsDescription);

export const getTableSchema = z.object({
  id: z.string(),
  // ...
  extractFields: ef,
});
```

**⚠ Schemas must opt in.** Even with auto-apply wired in `wrapToolHandler`, the MCP SDK validates input against each tool's zod schema and drops unknown fields *before* the handler sees them. So `params.extractFields` is `undefined` unless the tool's schema declares it. Either add the field per tool, or use `.passthrough()` if you want it implicit:

```ts
export const listHostsSchema = z.object({
  count: z.coerce.number().optional(),
  // ...
}).passthrough();   // ← extractFields will pass through to wrapToolHandler
```

Real-world impact (live measurement, datadog v1.11.1):

| Tool | Default | With extractFields | Reduction |
|------|---------|--------------------|-----------|
| `get-monitors` (5 monitors) | 594 tokens | 148 tokens | **−75%** |
| `get-monitors` (20 monitors) | 3,108 tokens | 622 tokens | **−80%** |
| `list-hosts` (10 hosts, schema not declared) | 3,965 tokens | 3,965 tokens | 0% (SDK drops unknown field) |

### 4. MCP Resources for hot entities

**File**: `src/resources.ts`. Use the SDK's `server.registerResource(name, ResourceTemplate, metadata, callback)` to expose hot entities by URI. Resources are application-driven (host UI picks them) and don't consume tool schema tokens until read.

```ts
server.registerResource(
  "table",
  new ResourceTemplate("om://table/{fqn}", { list: undefined }),
  { title: "OpenMetadata Table", mimeType: "application/json" },
  async (uri, vars) => {
    const data = await omClient.get(`/tables/name/${encodeURIComponent(String(vars.fqn))}`, {
      fields: "columns,owners,tags",
    });
    return { contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(data) }] };
  },
);
```

Use a custom URI scheme matching your domain (`om://`, `mlflow://`, `dd://`, etc.).

## Aggregation tools (round-trip elimination)

When LLMs reliably issue 3+ tool calls in sequence to assemble a "summary view," provide a single aggregation tool that does it server-side with `Promise.allSettled` for partial-failure tolerance.

```ts
// openmetadata: get-table-summary
//   = get-table-by-name + get-lineage-by-name + (opt) get-table-sample-data + (opt) list-test-cases
// mlflow: summarize-run
//   = get-run + (opt) get-metric-history-per-key + (opt) list-artifacts
```

Naming: `<get|analyze|summarize>-<entity>-<view>`. Always include a `summary` object in the response with metadata (counts, what was/wasn't fetched).

## Project layout

```
src/
├── index.ts              # entry point: server setup + tool() helper + currentCategory + registrations
├── config.ts             # env vars incl. enabledCategories / disabledCategories parsing
├── client.ts             # HTTP client wrapper for the upstream API
├── tool-registry.ts      # CATEGORIES const + ToolRegistry class + searchTools meta-tool
├── resources.ts          # MCP Resources via registerResource (hot entity URIs)
└── tools/
    ├── utils.ts          # wrapToolHandler (auto-applies extractFields), assertWriteAllowed, error sanitization
    ├── extract-fields.ts # applyExtractFields helper + extractFieldsDescription
    ├── aggregations.ts   # round-trip-elimination tools (get-X-summary)
    └── <category>.ts     # one file per logical category, exporting Schema + handler pairs
```

## Other conventions

- **Read-only by default**: gate all create/update/delete behind `<PREFIX>_ALLOW_WRITE=true`.
- **Sensitive token redaction**: in `wrapToolHandler` error path, regex-strip API keys, bearer tokens, and the literal env var names from error messages.
- **Schema-first**: every tool exports `<name>Schema` (zod) + `<name>` handler. Every field has `.describe()`.
- **Categories cover everything**: include even infrequent tools (events, audit) so users can disable them via `<PREFIX>_DISABLE` rather than fork.
- **`packageManager: "pnpm@10.30.2"`** + **`pnpm.overrides`** for transitive vulnerability pinning.
- **CI**: Node 24 in publish workflow (Node 22 has the `npm install -g npm@latest` MODULE_NOT_FOUND issue with `promise-retry`). Trusted publishing requires npm >= 11.5.1 (bundled in Node 24).
- **Versioning**: SemVer. New schema field on existing tool → minor. New tool/category → minor. Pure refactor or transitive dep pin → patch.

## When to deviate

- **Tiny tool surface (<20 tools)**: skip the registry/category complexity. unifi-mcp ran fine without categories at v1.0; only added them when the connector tools brought it past 50.
- **Highly heterogeneous responses**: `extractFields` works best on consistent JSON. For binary or streamed responses (e.g. Android screenshot), don't wire it through — let those handlers return `wrapImageToolHandler` directly.
- **Single-tenant / restricted use case**: ENV toggles add value mainly for shared MCP installations where users have varied workflows. For a single-team internal tool, you can skip them.

## Maintenance

- Run `node scripts/measure-tokens.mjs` (when added by E-6) on every PR; flag if `default` schema tokens grow more than 20%.
- Keep this doc updated as new patterns prove out across multiple repos.
