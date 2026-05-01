# Datadog MCP Server

[![@us-all standard](https://img.shields.io/badge/built%20to-%40us--all%20MCP%20standard-blue)](./STANDARD.md)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Datadog. **159 tools** across the full Datadog API surface — metrics, logs, APM/RUM, monitors, dashboards, incidents, security signals, status pages, fleet automation, and more.

> Authored to the [@us-all MCP Standard](./STANDARD.md) — token-efficient by design (category toggles, extractFields auto-apply, search-tools meta-tool, MCP Resources, aggregation tools).

**Token-efficient by design** — `extractFields` response projection, `DD_TOOLS`/`DD_DISABLE` category toggles, and a `search-tools` meta-tool let you keep LLM context costs low across the 159-tool surface.

[한국어](./README_KO.md)

## When to use this vs Datadog's official MCP

Datadog announced an official MCP server (Bits AI MCP, GA 2026-03-09). The two are complementary:

| | Official Datadog MCP | `@us-all/datadog-mcp` (this) |
|--|----------------------|------------------------------|
| Tool count | 16+ core toolsets (APM, Errors, DBM, Security, LLM Obs.) | **158 tools** across full API surface |
| Deployment | Remote (managed by Datadog, no local server) | **Self-host** stdio (npx / Docker / npm) |
| Auth | Datadog SSO | API + APP key |
| Sites | Public Datadog sites | **Any site incl. internal/sovereign**, US5 default |
| Best for | Quick AI agent setup with Datadog managed UX | Self-hosted setups, internal sites, full API CRUD, dev/CI sandboxes |

Use the official Bits AI MCP for fast managed onboarding and SSO flows. Use this server when you need full API coverage, write/CRUD parity, or self-hosting (e.g. internal sites, isolated networks, ephemeral dev/CI environments).

## Tool Coverage (158)

| Domain | Tools |
|--------|------:|
| Status Pages | 21 |
| Fleet Automation | 17 |
| RUM (events + apps + metrics + retention) | 27 |
| Security signals + rules + suppressions | 9 |
| Synthetics, Logs/Spans Metrics, SLO Corrections | 16 |
| Incidents, Cases, Error Tracking, Audit | 13 |
| Monitors, Dashboards, Notebooks, Events | 16 |
| APM, CI Visibility, DORA, Network Devices | 9 |
| Metrics, Hosts, SLOs, Downtimes, Containers, Processes | 19 |
| OnCall, Teams, Users, Services, Bots | 11 |

## Quick Start

### Option 1: npx (Recommended)

```bash
npx @us-all/datadog-mcp \
  --env DD_API_KEY=<your-api-key> \
  --env DD_APP_KEY=<your-app-key> \
  --env DD_SITE=datadoghq.com
```

### Option 2: Docker

```bash
docker run -e DD_API_KEY=<your-api-key> -e DD_APP_KEY=<your-app-key> -e DD_SITE=datadoghq.com \
  ghcr.io/us-all/datadog-mcp-server:latest
```

### Option 3: Build from Source

```bash
git clone https://github.com/us-all/datadog-mcp-server.git
cd datadog-mcp-server
pnpm install
pnpm run build
node dist/index.js
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DD_API_KEY` | Yes | — | Datadog API key |
| `DD_APP_KEY` | Yes | — | Datadog Application key |
| `DD_SITE` | No | `us5.datadoghq.com` | Datadog site (see below) |
| `DD_ALLOW_WRITE` | No | `false` | Set to `true` to enable write/mutate operations (create, update, delete) |
| `DD_TOOLS` | No | — | Comma-separated allowlist of tool categories (e.g. `metrics,monitors,logs`). When set, **only** these load — biggest token saver. Categories: `metrics`, `monitors`, `dashboards`, `logs`, `apm`, `rum`, `incidents`, `security`, `synthetics`, `ci`, `infra`, `fleet`, `status-pages`, `oncall`, `teams`, `account`. |
| `DD_DISABLE` | No | — | Comma-separated denylist (e.g. `fleet,status-pages`). Ignored when `DD_TOOLS` is set. |

### Token Efficiency

With 159 tools, naive setup loads ~25K tokens of tool schema into LLM context before any conversation begins. Three patterns mitigate.

**Measured impact** (from `tools/list` JSON length, ~4 chars/token):

| Scenario | Tools loaded | Schema tokens | vs default |
|----------|--------------|---------------|-----------|
| default (all categories) | 159 | **25,200** | — |
| typical (`DD_TOOLS=metrics,monitors,logs,apm,dashboards`) | 55 | 9,300 | −63% |
| narrow (`DD_TOOLS=metrics,monitors`) | 24 | **3,800** | **−85%** |

Three patterns:

**1. Category toggles** (biggest win):
```bash
DD_TOOLS=metrics,monitors,logs,apm    # observability essentials only
DD_DISABLE=fleet,status-pages         # exclude infrequent ops
```

**2. `extractFields` response projection** (on `get-dashboard`, `get-dashboards`, `search-logs`, `search-spans`, `search-rum-events`):
```jsonc
get-dashboard { "dashboardId": "abc", "extractFields": "id,title,widgets.*.definition.type" }
```

**3. `search-tools` meta-tool** (always enabled, even when categories restricted):
```
search-tools { "query": "rum events" }
→ search-rum-events, aggregate-rum, list-rum-applications, ...
```

### Supported DD_SITE Values

| Site | Value | Region |
|------|-------|--------|
| US1 | `datadoghq.com` | US (Virginia) |
| US3 | `us3.datadoghq.com` | US (Virginia) |
| US5 | `us5.datadoghq.com` | US (Oregon) |
| EU1 | `datadoghq.eu` | EU (Frankfurt) |
| AP1 | `ap1.datadoghq.com` | Asia-Pacific (Tokyo) |

If `DD_SITE` is not set, it defaults to `us5.datadoghq.com`. Set this to match your Datadog organization's site.

### Read-Only Mode

By default, all write operations are blocked to prevent accidental changes by AI agents. The following tools require `DD_ALLOW_WRITE=true`:

`create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `create-dashboard`, `update-dashboard`, `delete-dashboard`, `send-logs`, `post-event`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`, `create-downtime`, `cancel-downtime`, `create-case`, `update-case-status`, `send-dora-deployment`, `send-dora-incident`

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@us-all/datadog-mcp"],
      "env": {
        "DD_API_KEY": "<your-api-key>",
        "DD_APP_KEY": "<your-app-key>",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}
```

### Claude Code

```bash
# Global (all projects)
claude mcp add datadog -s user \
  -e DD_API_KEY=<your-api-key> -e DD_APP_KEY=<your-app-key> -e DD_SITE=datadoghq.com \
  -- npx -y @us-all/datadog-mcp

# Project-only
claude mcp add datadog -s project \
  -e DD_API_KEY=<your-api-key> -e DD_APP_KEY=<your-app-key> -e DD_SITE=datadoghq.com \
  -- npx -y @us-all/datadog-mcp
```

## Tools (81)

### Metrics (5)
| Tool | Description |
|------|-------------|
| `query-metrics` | Query time-series metric data with full Datadog query syntax |
| `get-metrics` | Search available metrics by name pattern |
| `get-metric-metadata` | Get metric metadata (type, unit, description) |
| `list-active-metrics` | List active metrics, optionally filtered by host or tag |
| `list-metric-tags` | List tags for a specific metric |

### Monitors (7)
| Tool | Description |
|------|-------------|
| `get-monitors` | List monitors with filtering by name, tags, or state |
| `get-monitor` | Get detailed monitor information by ID |
| `create-monitor` | Create a new monitor |
| `update-monitor` | Update a monitor's configuration |
| `delete-monitor` | Delete a monitor |
| `mute-monitor` | Mute a monitor for a scope and optional duration |
| `validate-monitor` | Validate a monitor definition without creating it |

### Dashboards (5)
| Tool | Description |
|------|-------------|
| `get-dashboards` | List all dashboards |
| `get-dashboard` | Get dashboard with all widgets and configuration |
| `create-dashboard` | Create a new dashboard |
| `update-dashboard` | Update a dashboard |
| `delete-dashboard` | Delete a dashboard |

### Logs (3)
| Tool | Description |
|------|-------------|
| `search-logs` | Search logs by query with time range filtering |
| `aggregate-logs` | Aggregate logs with computations (count, avg, sum, percentiles) and grouping |
| `send-logs` | Send log entries to Datadog |

### Events (2)
| Tool | Description |
|------|-------------|
| `get-events` | Get events filtered by priority, source, or tags |
| `post-event` | Post a custom event (supports markdown, @mentions) |

### Incidents (1)
| Tool | Description |
|------|-------------|
| `get-incidents` | List incidents with pagination |

### APM (1)
| Tool | Description |
|------|-------------|
| `search-spans` | Search APM spans/traces by service, resource, status, duration |

### RUM (17)
| Tool | Description |
|------|-------------|
| `search-rum-events` | Search RUM events (sessions, views, errors, actions) |
| `aggregate-rum` | Aggregate RUM data with computations and grouping |
| `list-rum-applications` | List all RUM applications |
| `get-rum-application` | Get RUM application details by ID |
| `create-rum-application` | Create a new RUM application (browser, ios, android, etc.) |
| `update-rum-application` | Update a RUM application's name or type |
| `delete-rum-application` | Delete a RUM application |
| `list-rum-metrics` | List configured rum-based metrics |
| `get-rum-metric` | Get a rum-based metric definition |
| `create-rum-metric` | Create a metric based on RUM data |
| `update-rum-metric` | Update a rum-based metric |
| `delete-rum-metric` | Delete a rum-based metric |
| `list-rum-retention-filters` | List RUM retention filters for an application |
| `get-rum-retention-filter` | Get a RUM retention filter by ID |
| `create-rum-retention-filter` | Create a RUM retention filter |
| `update-rum-retention-filter` | Update a RUM retention filter |
| `delete-rum-retention-filter` | Delete a RUM retention filter |

### Hosts (2)
| Tool | Description |
|------|-------------|
| `list-hosts` | List infrastructure hosts with filtering and metadata |
| `get-host-totals` | Get total active and up host counts |

### SLOs (3)
| Tool | Description |
|------|-------------|
| `list-slos` | List SLOs with filtering by query, tags, or IDs |
| `get-slo` | Get detailed SLO information |
| `get-slo-history` | Get SLO performance history (status, error budget, compliance) |

### Synthetics (6)
| Tool | Description |
|------|-------------|
| `list-synthetics` | List Synthetics tests (API, Browser, Mobile) |
| `get-synthetics-result` | Get latest results for a test |
| `trigger-synthetics` | Trigger tests on demand |
| `create-synthetics-test` | Create a new Synthetics test |
| `update-synthetics-test` | Update a Synthetics test |
| `delete-synthetics-test` | Delete Synthetics tests |

### Downtimes (3)
| Tool | Description |
|------|-------------|
| `list-downtimes` | List scheduled downtimes |
| `create-downtime` | Create a downtime (mute monitors) |
| `cancel-downtime` | Cancel an active downtime |

### Security (1)
| Tool | Description |
|------|-------------|
| `search-security-signals` | Search security monitoring signals |

### Account & Usage (2)
| Tool | Description |
|------|-------------|
| `get-usage-summary` | Get usage summary (hosts, logs, APM, RUM, etc.) |
| `list-users` | List organization users |

### Notebooks (2)
| Tool | Description |
|------|-------------|
| `list-notebooks` | List notebooks with search and filtering |
| `get-notebook` | Get a notebook with all cells and content |

### On-Call (2)
| Tool | Description |
|------|-------------|
| `get-team-oncall` | Get current on-call responders for a team |
| `get-oncall-schedule` | Get an on-call schedule with layers and team info |

### Services (2)
| Tool | Description |
|------|-------------|
| `list-services` | List services from Software Catalog with filtering |
| `get-service-definition` | Get a service definition by entity ID |

### Containers (1)
| Tool | Description |
|------|-------------|
| `list-containers` | List infrastructure containers with filtering |

### Processes (1)
| Tool | Description |
|------|-------------|
| `list-processes` | List running processes with search and tag filtering |

### Audit Logs (1)
| Tool | Description |
|------|-------------|
| `search-audit-logs` | Search audit logs for organization activity tracking |

### Cases (4)
| Tool | Description |
|------|-------------|
| `list-cases` | List Case Management cases with search |
| `get-case` | Get case details by ID |
| `create-case` | Create a new case |
| `update-case-status` | Update case status (OPEN, IN_PROGRESS, CLOSED) |

### Error Tracking (2)
| Tool | Description |
|------|-------------|
| `list-error-tracking-issues` | List error tracking issues with filtering |
| `get-error-tracking-issue` | Get error tracking issue details |

### CI/CD Visibility (4)
| Tool | Description |
|------|-------------|
| `search-ci-pipelines` | Search CI/CD pipeline events |
| `aggregate-ci-pipelines` | Aggregate CI/CD pipeline data with computations |
| `search-ci-tests` | Search CI test events |
| `aggregate-ci-tests` | Aggregate CI test data with computations |

### Network Devices (2)
| Tool | Description |
|------|-------------|
| `list-network-devices` | List network devices monitored by NDM |
| `get-network-device` | Get network device details |

### DORA Metrics (2)
| Tool | Description |
|------|-------------|
| `send-dora-deployment` | Send a DORA deployment event |
| `send-dora-incident` | Send a DORA incident event |

## Architecture

```
Claude AI → MCP Protocol (stdio) → index.ts → tools/*.ts → Datadog SDK → Datadog API
```

### Project Structure

```
src/
├── index.ts          # MCP server entry point, 81 tools registered
├── config.ts         # Environment variable loading
├── client.ts         # Datadog API client initialization
└── tools/
    ├── utils.ts      # Error handling wrapper
    ├── metrics.ts    # Time-series queries + metric catalog
    ├── monitors.ts   # Monitor CRUD + mute
    ├── dashboards.ts # Dashboard CRUD
    ├── logs.ts       # Log search, aggregation, sending
    ├── events.ts     # Event listing and creation
    ├── incidents.ts  # Incident listing
    ├── apm.ts        # APM span/trace search
    ├── rum.ts        # RUM event search, aggregation, and application CRUD
    ├── rum-metrics.ts # RUM-based metrics CRUD
    ├── rum-retention-filters.ts # RUM retention filter management
    ├── hosts.ts      # Infrastructure host management
    ├── slos.ts       # SLO queries and history
    ├── synthetics.ts # Synthetics test CRUD + triggering
    ├── downtimes.ts  # Downtime management
    ├── security.ts   # Security signal search
    ├── account.ts    # Usage summary and user management
    ├── notebooks.ts  # Notebook listing
    ├── oncall.ts     # On-call schedule and responders
    ├── services.ts   # Software Catalog
    ├── containers.ts # Container monitoring
    ├── processes.ts  # Process monitoring
    ├── audit.ts      # Audit log search
    ├── cases.ts      # Case Management CRUD
    ├── errors.ts     # Error Tracking
    ├── ci.ts         # CI/CD Visibility (pipelines + tests)
    ├── networks.ts   # Network Device Monitoring
    └── dora.ts       # DORA metrics (deployments + incidents)
```

## Tech Stack

- **Runtime**: Node.js 18+ (TypeScript strict mode, ESM)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Datadog Client**: `@datadog/datadog-api-client` (official SDK)
- **Validation**: zod
- **Config**: dotenv
- **Testing**: vitest + dd-trace (Test Visibility)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)
