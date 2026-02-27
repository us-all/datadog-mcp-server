# Datadog MCP Server

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Datadog. Gives AI assistants like Claude direct access to your Datadog monitoring data — metrics, logs, APM traces, RUM, monitors, dashboards, and more.

[한국어 README](./README_KO.md)

## Why This Server?

The existing community MCP server only covers basic operations. This project provides full Datadog API coverage:

| Feature | Community MCP | This Server |
|---------|:---:|:---:|
| Time-series metric queries (CPU, memory, IOPS, etc.) | - | ✓ |
| APM / Trace search | - | ✓ |
| RUM event search & aggregation | - | ✓ |
| Monitor / Dashboard CRUD | - | ✓ |
| Synthetics test management | - | ✓ |
| Downtime management | - | ✓ |
| Security signals | - | ✓ |
| On-Call schedules | - | ✓ |
| Usage / Account management | - | ✓ |
| **Total tools** | **6** | **46** |

## Quick Start

### Option 1: npx (Recommended)

```bash
npx @us-all/datadog-mcp \
  --env DD_API_KEY=<your-key> \
  --env DD_APP_KEY=<your-key> \
  --env DD_SITE=us5.datadoghq.com
```

### Option 2: Docker

```bash
docker run -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=us5.datadoghq.com \
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

`create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `create-dashboard`, `update-dashboard`, `delete-dashboard`, `send-logs`, `post-event`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`, `create-downtime`, `cancel-downtime`

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
        "DD_SITE": "us5.datadoghq.com"
      }
    }
  }
}
```

### Claude Code

```bash
# Global (all projects)
claude mcp add datadog -s user \
  -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=us5.datadoghq.com \
  -- npx -y @us-all/datadog-mcp

# Project-only
claude mcp add datadog -s project \
  -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=us5.datadoghq.com \
  -- npx -y @us-all/datadog-mcp
```

## Tools (46)

### Metrics (5)
| Tool | Description |
|------|-------------|
| `query-metrics` | Query time-series metric data with full Datadog query syntax |
| `get-metrics` | Search available metrics by name pattern |
| `get-metric-metadata` | Get metric metadata (type, unit, description) |
| `list-active-metrics` | List active metrics, optionally filtered by host or tag |
| `list-metric-tags` | List tags for a specific metric |

### Monitors (6)
| Tool | Description |
|------|-------------|
| `get-monitors` | List monitors with filtering by name, tags, or state |
| `get-monitor` | Get detailed monitor information by ID |
| `create-monitor` | Create a new monitor |
| `update-monitor` | Update a monitor's configuration |
| `delete-monitor` | Delete a monitor |
| `mute-monitor` | Mute a monitor for a scope and optional duration |

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

### RUM (2)
| Tool | Description |
|------|-------------|
| `search-rum-events` | Search RUM events (sessions, views, errors, actions) |
| `aggregate-rum` | Aggregate RUM data with computations and grouping |

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

## Architecture

```
Claude AI → MCP Protocol (stdio) → index.ts → tools/*.ts → Datadog SDK → Datadog API
```

### Project Structure

```
src/
├── index.ts          # MCP server entry point, 46 tools registered
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
    ├── rum.ts        # RUM event search and aggregation
    ├── hosts.ts      # Infrastructure host management
    ├── slos.ts       # SLO queries and history
    ├── synthetics.ts # Synthetics test CRUD + triggering
    ├── downtimes.ts  # Downtime management
    ├── security.ts   # Security signal search
    ├── account.ts    # Usage summary and user management
    ├── notebooks.ts  # Notebook listing
    └── oncall.ts     # On-call schedule and responders
```

## Tech Stack

- **Runtime**: Node.js 18+ (TypeScript strict mode, ESM)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Datadog Client**: `@datadog/datadog-api-client` (official SDK)
- **Validation**: zod
- **Config**: dotenv

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)
