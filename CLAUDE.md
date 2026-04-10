# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custom Datadog MCP (Model Context Protocol) server that gives Claude access to Datadog monitoring APIs. Replaces the limited community MCP server by adding time-series metrics queries, APM/Traces, RUM data, and full Datadog API coverage via the official SDK.

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript (strict mode)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` (^1.27.1)
- **Datadog Client**: `@datadog/datadog-api-client` (^1.52.0)
- **Validation**: zod
- **Config**: dotenv

## Build & Run Commands

```bash
pnpm install          # Install dependencies
pnpm run build        # Compile TypeScript → dist/
pnpm run dev          # Watch mode (auto-rebuild)
node dist/index.js    # Run the MCP server
```

## Architecture

This is an MCP server running as a subprocess, configured via `.mcp.json`. The data flow is:

```
Claude AI → MCP Protocol → index.ts (server) → tools/*.ts → Datadog API Client → Datadog API
```

### Key Source Files

- `src/index.ts` — MCP server entry point, 81 tool registrations
- `src/config.ts` — Environment variable loading (DD_API_KEY, DD_APP_KEY, DD_SITE)
- `src/client.ts` — Datadog API client initialization using official SDK
- `src/tools/utils.ts` — `wrapToolHandler` error handling wrapper for all tools
- `src/tools/` — One file per tool category, each exporting schema + handler

### Tool Pattern

Each tool file follows the same pattern:
1. Define zod input schema with `.describe()` on every field
2. Call Datadog API via official SDK client
3. Transform response to a readable format
4. Handler is wrapped with `wrapToolHandler()` in index.ts for error handling

### Tool Categories (81 tools)

| File | Tools |
|------|-------|
| `metrics.ts` | `query-metrics`, `get-metrics`, `get-metric-metadata`, `list-active-metrics`, `list-metric-tags` |
| `monitors.ts` | `get-monitors`, `get-monitor`, `create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `validate-monitor` |
| `dashboards.ts` | `get-dashboards`, `get-dashboard`, `create-dashboard`, `update-dashboard`, `delete-dashboard` |
| `logs.ts` | `search-logs`, `aggregate-logs`, `send-logs` |
| `events.ts` | `get-events`, `post-event` |
| `incidents.ts` | `get-incidents` |
| `apm.ts` | `search-spans` |
| `rum.ts` | `search-rum-events`, `aggregate-rum`, `list-rum-applications`, `get-rum-application`, `create-rum-application`, `update-rum-application`, `delete-rum-application` |
| `rum-metrics.ts` | `list-rum-metrics`, `get-rum-metric`, `create-rum-metric`, `update-rum-metric`, `delete-rum-metric` |
| `rum-retention-filters.ts` | `list-rum-retention-filters`, `get-rum-retention-filter`, `create-rum-retention-filter`, `update-rum-retention-filter`, `delete-rum-retention-filter` |
| `hosts.ts` | `list-hosts`, `get-host-totals` |
| `slos.ts` | `list-slos`, `get-slo`, `get-slo-history` |
| `synthetics.ts` | `list-synthetics`, `get-synthetics-result`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test` |
| `downtimes.ts` | `list-downtimes`, `create-downtime`, `cancel-downtime` |
| `security.ts` | `search-security-signals` |
| `account.ts` | `get-usage-summary`, `list-users` |
| `notebooks.ts` | `list-notebooks`, `get-notebook` |
| `oncall.ts` | `get-team-oncall`, `get-oncall-schedule` |
| `services.ts` | `list-services`, `get-service-definition` |
| `containers.ts` | `list-containers` |
| `processes.ts` | `list-processes` |
| `audit.ts` | `search-audit-logs` |
| `cases.ts` | `list-cases`, `get-case`, `create-case`, `update-case-status` |
| `errors.ts` | `list-error-tracking-issues`, `get-error-tracking-issue` |
| `ci.ts` | `search-ci-pipelines`, `aggregate-ci-pipelines`, `search-ci-tests`, `aggregate-ci-tests` |
| `networks.ts` | `list-network-devices`, `get-network-device` |
| `dora.ts` | `send-dora-deployment`, `send-dora-incident` |

## Environment Variables

```bash
DD_API_KEY=<datadog-api-key>        # Required
DD_APP_KEY=<datadog-application-key> # Required
DD_SITE=us5.datadoghq.com           # Default: us5.datadoghq.com
DD_ALLOW_WRITE=false                 # Default: false. Set to "true" to enable write operations.
```

## SDK Usage Pattern

Datadog v2 API aggregate tools (`aggregate-logs`, `aggregate-rum`) must use SDK model class instances. Passing plain objects with `as any` causes `ObjectSerializer` to fail field mapping (e.g., `groupBy` → `group_by`), resulting in API 400 errors.

```typescript
// Correct (SDK model instances)
const compute = new v2.LogsCompute();
const body = new v2.LogsAggregateRequest();

// Wrong (plain object + as any)
const body = { compute: [...] } as any;  // ObjectSerializer mapping fails
```
