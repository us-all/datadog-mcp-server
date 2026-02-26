# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custom Datadog MCP (Model Context Protocol) server that gives Claude access to Datadog monitoring APIs. Replaces the limited community MCP server by adding time-series metrics queries, APM/Traces, RUM data, and full Datadog API coverage via the official SDK.

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript (strict mode)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` (^1.8.0)
- **Datadog Client**: `@datadog/datadog-api-client` (^1.33.1)
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

- `src/index.ts` — MCP server entry point, tool registration
- `src/config.ts` — Environment variable loading (DD_API_KEY, DD_APP_KEY, DD_SITE)
- `src/client.ts` — Datadog API client initialization using official SDK
- `src/tools/` — One file per tool category, each exporting tool handlers

### Tool Pattern

Each tool file follows the same pattern:
1. Define zod input schema
2. Call Datadog API via official SDK client
3. Transform response to a readable format
4. Return as MCP ToolResult

### Tool Categories

| File | Tools | Phase |
|------|-------|-------|
| `metrics.ts` | `query-metrics`, `get-metrics`, `get-metric-metadata` | 1 (MVP) |
| `monitors.ts` | `get-monitors`, `get-monitor` | 1 |
| `dashboards.ts` | `get-dashboards`, `get-dashboard` | 1 |
| `logs.ts` | `search-logs`, `aggregate-logs` | 1 |
| `events.ts` | `get-events` | 1 |
| `incidents.ts` | `get-incidents` | 1 |
| `apm.ts` | `search-spans` | 2 |
| `rum.ts` | `search-rum-events`, `aggregate-rum` | 2 |
| `downtimes.ts` | `list-downtimes`, `create-downtime`, `cancel-downtime` | 3 |
| `slos.ts` | `list-slos`, `get-slo`, `get-slo-history` | 3 |
| `synthetics.ts` | `list-synthetics`, `trigger-synthetics` | 3 |
| `hosts.ts` | `list-hosts`, `get-host-totals` | 3 |

## Environment Variables

```bash
DD_API_KEY=<datadog-api-key>        # Required
DD_APP_KEY=<datadog-application-key> # Required
DD_SITE=us5.datadoghq.com           # Default: us5.datadoghq.com
```

## Implementation Phases

- **Phase 1 (MVP)**: `query-metrics` (highest priority — the primary gap vs community MCP) + migrate existing tools (monitors, dashboards, logs, events, incidents, metrics catalog)
- **Phase 2**: APM span search + RUM events/aggregation
- **Phase 3**: Downtime management, SLOs, Synthetics, Hosts/Infra

## Key Services

Primary Datadog-monitored services: `us-app-prod` (Flutter RUM), `us-insight-api-prod`, `us-campus` (backend), MongoDB Atlas (`cluster0`).
