# Datadog MCP Server

> **The Datadog MCP that answers _"why is this happening?"_ — not just _"what's the value?"_**
>
> Aggregation tools that fold 5–7 sequential API calls into one structured response. Full SLO CRUD. Fleet automation. The widest Datadog API coverage in any MCP — **159 tools** built on the [@us-all MCP standard](https://github.com/us-all/mcp-toolkit/blob/main/STANDARD.md).

[![npm](https://img.shields.io/npm/v/@us-all/datadog-mcp)](https://www.npmjs.com/package/@us-all/datadog-mcp)
[![downloads](https://img.shields.io/npm/dm/@us-all/datadog-mcp)](https://www.npmjs.com/package/@us-all/datadog-mcp)
[![tools](https://img.shields.io/badge/tools-159-blue)](#full-tool-reference)
[![@us-all standard](https://img.shields.io/badge/built%20to-%40us--all%20MCP%20standard-blue)](https://github.com/us-all/mcp-toolkit/blob/main/STANDARD.md)

## What it does that others don't

- **Aggregation tools** — `analyze-monitor-state` and `slo-compliance-snapshot` collapse 5–7 sequential API calls into one structured response with a `caveats` array for partial failures. No other Datadog MCP ships this pattern.
- **Full SLO CRUD** — create, update, delete SLOs (and their corrections). The official Bits AI MCP and community alternatives are read-only on SLOs.
- **Fleet Automation** — 17 tools across deployments, schedules, and instrumented pods. Only this server.
- **Status Pages** — 21 tools for full status-page lifecycle (components, degradations, maintenances). Only this server.
- **Token-efficient by design** — `extractFields` projection, `DD_TOOLS`/`DD_DISABLE` 16-category toggles, and a `search-tools` meta-tool keep LLM context low across 159 tools.
- **Apps SDK card** — `slo-compliance-snapshot` renders as a visual card on ChatGPT clients via `_meta["openai/outputTemplate"]`. Claude clients receive the same JSON content (non-breaking).
- **stdio + Streamable HTTP** — defaults to stdio (Claude Desktop / Code). Set `MCP_TRANSPORT=http` for ChatGPT Apps SDK or remote clients (Bearer auth via `MCP_HTTP_TOKEN`).

## Try this — 5 prompts

Connect the server to Claude Desktop or Claude Code, then paste any of these:

1. **SLO health** — *"List my SLOs and their error budget remaining this month. Group by status: compliant, at-risk, breached."*
2. **Incident triage** — *"There's an active incident on `checkout-service`. Pull the linked monitors, the recent error spikes from APM, and which deployments touched the service in the last 24h."*
3. **Monitor noise audit** — *"Find monitors that alerted more than 10 times in the last 7 days but had MTTR under 5 minutes — these are probably flapping."*
4. **RUM error spike** — *"RUM error rate jumped on the checkout funnel between 14:00 and 14:30 today. Show me the top error groups, affected sessions, and the user actions before the errors."*
5. **Fleet rollout** — *"Schedule the `datadog-agent` 7.55.0 rollout to the `staging` cluster, weekends only, starting next Saturday."*

## When to use this vs Datadog's official MCP

Datadog's official MCP (Bits AI MCP, GA 2026-03-09) is **complementary**, not a replacement:

| | Official Datadog MCP | `@us-all/datadog-mcp` (this) |
|--|----------------------|------------------------------|
| Tool count | 16+ core toolsets | **159 tools** across full API surface |
| Deployment | Remote (managed by Datadog) | **Self-host** stdio (npx / Docker / npm) |
| Auth | Datadog SSO | API + APP key |
| Sites | Public Datadog sites | **Any site, incl. internal/sovereign**; US5 default |
| SLO writes | ❌ | ✅ create/update/delete SLOs + corrections |
| Fleet automation | ❌ | ✅ 17 tools |
| Status pages | ❌ | ✅ 21 tools |
| Aggregation tools | ❌ | ✅ `analyze-monitor-state`, `slo-compliance-snapshot` |
| MCP Prompts | ❌ | ✅ 4 (`triage-incident`, `audit-monitor-noise`, `analyze-rum-error-spike`, `investigate-slow-trace`) |
| MCP Resources | ❌ | ✅ `dd://service/{serviceName}`, `dd://team/{teamId}`, `dd://synthetics/{testId}`, etc. |

Use the official Bits AI MCP for fast managed onboarding and SSO. Use this when you need full API coverage, SLO/fleet/status-page write parity, or self-hosting (internal sites, isolated networks, dev/CI sandboxes).

## Install

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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
claude mcp add datadog -s user \
  -e DD_API_KEY=<your-api-key> -e DD_APP_KEY=<your-app-key> -e DD_SITE=datadoghq.com \
  -- npx -y @us-all/datadog-mcp
```

### Docker

```bash
docker run -e DD_API_KEY=... -e DD_APP_KEY=... -e DD_SITE=datadoghq.com \
  ghcr.io/us-all/datadog-mcp-server:latest
```

### Build from source

```bash
git clone https://github.com/us-all/datadog-mcp-server.git
cd datadog-mcp-server && pnpm install && pnpm build
node dist/index.js
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DD_API_KEY` | ✅ | — | Datadog API key |
| `DD_APP_KEY` | ✅ | — | Datadog Application key |
| `DD_SITE` | ❌ | `us5.datadoghq.com` | Datadog site (see table below) |
| `DD_ALLOW_WRITE` | ❌ | `false` | Set `true` to enable mutations (create/update/delete) |
| `DD_TOOLS` | ❌ | — | Comma-sep allowlist of categories. Only these load — biggest token saver. |
| `DD_DISABLE` | ❌ | — | Comma-sep denylist. Ignored when `DD_TOOLS` is set. |
| `MCP_TRANSPORT` | ❌ | `stdio` | `http` to enable Streamable HTTP transport |
| `MCP_HTTP_TOKEN` | conditional | — | Bearer token. Required when `MCP_TRANSPORT=http` |
| `MCP_HTTP_PORT` | ❌ | `3000` | HTTP listen port |
| `MCP_HTTP_HOST` | ❌ | `127.0.0.1` | HTTP bind host (DNS rebinding protection auto-enabled for localhost) |
| `MCP_HTTP_SKIP_AUTH` | ❌ | `false` | Skip Bearer auth — e.g. behind a reverse proxy that handles it |

**Categories** (16): `metrics`, `monitors`, `dashboards`, `logs`, `apm`, `rum`, `incidents`, `security`, `synthetics`, `ci`, `infra`, `fleet`, `status-pages`, `oncall`, `teams`, `account`.

When `MCP_TRANSPORT=http`: `POST /mcp` (Bearer-auth JSON-RPC) + `GET /health` (public liveness).

**Sites**:

| Site | Value | Region |
|------|-------|--------|
| US1 | `datadoghq.com` | US (Virginia) |
| US3 | `us3.datadoghq.com` | US (Virginia) |
| US5 | `us5.datadoghq.com` | US (Oregon) |
| EU1 | `datadoghq.eu` | EU (Frankfurt) |
| AP1 | `ap1.datadoghq.com` | Asia-Pacific (Tokyo) |

### Token efficiency

Naive setup loads ~25K tokens of tool schema before any conversation. Three knobs mitigate:

| Scenario | Tools | Schema tokens | vs default |
|----------|------:|--------------:|-----------:|
| default (all categories) | 159 | 25,200 | — |
| typical (`DD_TOOLS=metrics,monitors,logs,apm,dashboards`) | 55 | 9,300 | −63% |
| narrow (`DD_TOOLS=metrics,monitors`) | 24 | **3,800** | **−85%** |

1. **Category toggles** — `DD_TOOLS=metrics,monitors,logs,apm` (biggest win).
2. **`extractFields` response projection** — `get-dashboard { dashboardId: "abc", extractFields: "id,title,widgets.*.definition.type" }`.
3. **`search-tools` meta-tool** — always enabled; lets the LLM discover tools at runtime instead of preloading all schemas.

### Read-only mode

By default, all writes are blocked to prevent accidental mutations by AI agents. The following require `DD_ALLOW_WRITE=true`:

`create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `create-dashboard`, `update-dashboard`, `delete-dashboard`, `send-logs`, `post-event`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`, `create-downtime`, `cancel-downtime`, `create-case`, `update-case-status`, `send-dora-deployment`, `send-dora-incident`, `create-slo`, `update-slo`, `delete-slo`, plus all fleet/status-page/security writes.

## MCP Prompts (4)

Workflow templates the model can invoke directly:

- `triage-incident` — given an incident ID, walks linked monitors, recent error spikes, and recent deploys.
- `audit-monitor-noise` — flag flapping monitors via alert frequency × MTTR.
- `analyze-rum-error-spike` — diff RUM error rates across two windows, attribute to top error groups.
- `investigate-slow-trace` — given a slow trace ID, traverse the span tree and surface bottleneck spans.

## MCP Resources

Read-only entities by URI: `dd://monitor/{id}`, `dd://dashboard/{id}`, `dd://slo/{id}`, `dd://incident/{id}`, `dd://service/{serviceName}`, `dd://team/{teamId}` (team + members), `dd://synthetics/{testId}`, `dd://host/{name}`.

## Tool reference

159 tools across 16 categories. Use the `search-tools` meta-tool to discover at runtime; the full list is collapsed below.

| Domain | Tools |
|--------|------:|
| Status Pages | 21 |
| RUM (events + apps + metrics + retention) | 27 |
| Metrics, Hosts, SLOs, Downtimes, Containers, Processes | 19 |
| Fleet Automation | 17 |
| Synthetics, Logs/Spans Metrics, SLO Corrections | 16 |
| Monitors, Dashboards, Notebooks, Events | 16 |
| Incidents, Cases, Error Tracking, Audit | 13 |
| OnCall, Teams, Users, Services, Bots | 11 |
| Security signals + rules + suppressions | 9 |
| APM, CI Visibility, DORA, Network Devices | 9 |
| **+ aggregations** | `analyze-monitor-state`, `slo-compliance-snapshot` |
| **+ meta** | `search-tools` |

<details>
<summary>Full tool list (click to expand)</summary>

### Metrics (5)
`query-metrics`, `get-metrics`, `get-metric-metadata`, `list-active-metrics`, `list-metric-tags`

### Monitors (7)
`get-monitors`, `get-monitor`, `create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `validate-monitor`, `analyze-monitor-state` *(aggregation)*

### Dashboards (5)
`get-dashboards`, `get-dashboard`, `create-dashboard`, `update-dashboard`, `delete-dashboard`

### Logs (3)
`search-logs`, `aggregate-logs`, `send-logs`

### Events (2)
`get-events`, `post-event`

### Incidents (6)
`get-incidents`, `get-incident`, `search-incidents`, `create-incident`, `update-incident`, `delete-incident`

### APM (1)
`search-spans`

### RUM (17)
`search-rum-events`, `aggregate-rum`, `list-rum-applications`, `get-rum-application`, `create-rum-application`, `update-rum-application`, `delete-rum-application`, `list-rum-metrics`, `get-rum-metric`, `create-rum-metric`, `update-rum-metric`, `delete-rum-metric`, `list-rum-retention-filters`, `get-rum-retention-filter`, `create-rum-retention-filter`, `update-rum-retention-filter`, `delete-rum-retention-filter`

### SLOs (6)
`list-slos`, `get-slo`, `get-slo-history`, `create-slo`, `update-slo`, `delete-slo`, `slo-compliance-snapshot` *(aggregation)*, plus 5 SLO-correction tools

### Synthetics (6)
`list-synthetics`, `get-synthetics-result`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`

### Hosts / Containers / Processes (4)
`list-hosts`, `get-host-totals`, `list-containers`, `list-processes`

### Downtimes (3)
`list-downtimes`, `create-downtime`, `cancel-downtime`

### Security (9)
`search-security-signals`, `get-security-signal`, `list-security-rules`, `get-security-rule`, `delete-security-rule`, `list-security-suppressions`, `get-security-suppression`, `create-security-suppression`, `delete-security-suppression`

### CI Visibility (4)
`search-ci-pipelines`, `aggregate-ci-pipelines`, `search-ci-tests`, `aggregate-ci-tests`

### Cases (4)
`list-cases`, `get-case`, `create-case`, `update-case-status`

### Error Tracking (2)
`list-error-tracking-issues`, `get-error-tracking-issue`

### DORA (2)
`send-dora-deployment`, `send-dora-incident`

### Network Devices (2)
`list-network-devices`, `get-network-device`

### Notebooks (2)
`list-notebooks`, `get-notebook`

### OnCall (2)
`get-team-oncall`, `get-oncall-schedule`

### Services & Software Catalog (2)
`list-services`, `get-service-definition`

### Teams (6)
`list-teams`, `get-team`, `create-team`, `update-team`, `delete-team`, `get-team-members`

### Account & Users (2)
`get-usage-summary`, `list-users`

### Logs/Spans/APM Retention metrics (15)
5 each for `logs-metrics`, `spans-metrics`, `apm-retention-filters` (list/get/create/update/delete)

### Status Pages (21)
Full lifecycle: pages, components, degradations, maintenances. See `src/tools/status-pages.ts`.

### Fleet Automation (17)
Agents, deployments, schedules, instrumented pods. See `src/tools/fleet.ts`.

### Audit (1)
`search-audit-logs`

### Meta (1)
`search-tools` — query other tools by keyword; always enabled regardless of `DD_TOOLS`.

</details>

## Architecture

```
Claude → MCP stdio → index.ts → tools/*.ts → @datadog/datadog-api-client → Datadog API
```

Built on [`@us-all/mcp-toolkit`](https://github.com/us-all/mcp-toolkit):
- `extractFields` — token-efficient response projections
- `aggregate(fetchers, caveats)` — fan-out helper for aggregation tools
- `createWrapToolHandler` — domain-specific redaction (DD_API_KEY/DD_APP_KEY) + Datadog `ApiException` error extraction
- `search-tools` meta-tool

## Tech stack

Node.js 18+ • TypeScript strict ESM • pnpm • `@modelcontextprotocol/sdk` • `@datadog/datadog-api-client` (official) • zod • dotenv • vitest + dd-trace.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). New shared patterns belong in [`@us-all/mcp-toolkit`](https://github.com/us-all/mcp-toolkit) — single source of truth for the 7-server suite.

## License

[MIT](./LICENSE)
