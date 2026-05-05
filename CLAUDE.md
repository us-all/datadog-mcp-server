# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custom Datadog MCP (Model Context Protocol) server that gives Claude access to Datadog monitoring APIs. Replaces the limited community MCP server by adding time-series metrics queries, APM/Traces, RUM data, and full Datadog API coverage via the official SDK.

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript (strict mode)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` (^1.27.1)
- **Datadog Client**: `@datadog/datadog-api-client` (^1.56.0)
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

- `src/index.ts` — MCP server entry point, 158 tool registrations
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

### Tool Categories (158 tools)

| File | Tools |
|------|-------|
| `metrics.ts` | `query-metrics`, `get-metrics`, `get-metric-metadata`, `list-active-metrics`, `list-metric-tags` |
| `monitors.ts` | `get-monitors`, `get-monitor`, `create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `validate-monitor` |
| `dashboards.ts` | `get-dashboards`, `get-dashboard`, `create-dashboard`, `update-dashboard`, `delete-dashboard` |
| `logs.ts` | `search-logs`, `aggregate-logs`, `send-logs` |
| `events.ts` | `get-events`, `post-event` |
| `incidents.ts` | `get-incidents`, `get-incident`, `search-incidents`, `create-incident`, `update-incident`, `delete-incident` |
| `apm.ts` | `search-spans` |
| `rum.ts` | `search-rum-events`, `aggregate-rum`, `list-rum-applications`, `get-rum-application`, `create-rum-application`, `update-rum-application`, `delete-rum-application` |
| `rum-metrics.ts` | `list-rum-metrics`, `get-rum-metric`, `create-rum-metric`, `update-rum-metric`, `delete-rum-metric` |
| `rum-retention-filters.ts` | `list-rum-retention-filters`, `get-rum-retention-filter`, `create-rum-retention-filter`, `update-rum-retention-filter`, `delete-rum-retention-filter` |
| `hosts.ts` | `list-hosts`, `get-host-totals` |
| `slos.ts` | `list-slos`, `get-slo`, `get-slo-history` |
| `synthetics.ts` | `list-synthetics`, `get-synthetics-result`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test` |
| `downtimes.ts` | `list-downtimes`, `create-downtime`, `cancel-downtime` |
| `security.ts` | `search-security-signals`, `get-security-signal`, `list-security-rules`, `get-security-rule`, `delete-security-rule`, `list-security-suppressions`, `get-security-suppression`, `create-security-suppression`, `delete-security-suppression` |
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
| `teams.ts` | `list-teams`, `get-team`, `create-team`, `update-team`, `delete-team`, `get-team-members` |
| `logs-metrics.ts` | `list-logs-metrics`, `get-logs-metric`, `create-logs-metric`, `update-logs-metric`, `delete-logs-metric` |
| `spans-metrics.ts` | `list-spans-metrics`, `get-spans-metric`, `create-spans-metric`, `update-spans-metric`, `delete-spans-metric` |
| `slo-corrections.ts` | `list-slo-corrections`, `get-slo-correction`, `create-slo-correction`, `update-slo-correction`, `delete-slo-correction` |
| `apm-retention-filters.ts` | `list-apm-retention-filters`, `get-apm-retention-filter`, `create-apm-retention-filter`, `update-apm-retention-filter`, `delete-apm-retention-filter` |
| `status-pages.ts` | `list-status-pages`, `get-status-page`, `create-status-page`, `update-status-page`, `delete-status-page`, `publish-status-page`, `unpublish-status-page`, `list-status-page-components`, `get-status-page-component`, `create-status-page-component`, `update-status-page-component`, `delete-status-page-component`, `list-status-page-degradations`, `get-status-page-degradation`, `create-status-page-degradation`, `update-status-page-degradation`, `delete-status-page-degradation`, `list-status-page-maintenances`, `get-status-page-maintenance`, `create-status-page-maintenance`, `update-status-page-maintenance` |
| `fleet.ts` | `list-fleet-agents`, `get-fleet-agent-info`, `list-fleet-agent-versions`, `list-fleet-clusters`, `list-fleet-tracers`, `list-fleet-deployments`, `get-fleet-deployment`, `create-fleet-deployment-configure`, `create-fleet-deployment-upgrade`, `cancel-fleet-deployment`, `list-fleet-schedules`, `get-fleet-schedule`, `create-fleet-schedule`, `update-fleet-schedule`, `delete-fleet-schedule`, `trigger-fleet-schedule`, `list-fleet-instrumented-pods` |

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

## 최근 변경사항

- **v1.18.1** (2026-05-05): `@us-all/mcp-toolkit ^1.2.1` 핀 업데이트 — 자동 cascade. 코드 변경 0줄.
- **v1.18.0** (2026-05-05): Apps SDK UI 카드 — `slo-compliance-snapshot` 도구 결과를 `_meta["openai/outputTemplate"]` 통해 ChatGPT/Apps SDK 클라이언트에서 카드로 렌더. 새 리소스 `ui://widget/slo-compliance-snapshot.html` (`text/html+skybridge`), 도구 응답에 `structuredContent` + `_meta` 추가. Claude 클라이언트는 `_meta`를 무시하고 기존 텍스트 응답 그대로 사용 — non-breaking. 빌드 시 `src/ui/*.html`을 `dist/ui/`로 자동 복사.
- **v1.17.0** (2026-05-05): `startMcpServer` 채택 — toolkit v1.2.0의 런타임 헬퍼로 stdio 부트스트랩 12라인을 1줄로 교체. `MCP_TRANSPORT=http`로 Streamable HTTP transport 옵트인 가능 (기본 stdio). `MCP_HTTP_TOKEN` Bearer 인증, `/mcp` JSON-RPC + `/health` 엔드포인트. 기존 stdio 사용자 영향 0.
- **v1.16.5** (2026-05-05): `@us-all/mcp-toolkit ^1.2.0` 핀 업데이트 — 자동 cascade. 코드 변경 0줄.
- **v1.16.4** (2026-05-03): `serverInfo.version`이 `"1.8.0"`에 박혀있던 것을 `package.json`에서 런타임 로드. initialize handshake에서 보고하는 server version이 실제 패키지 버전과 일치.
- **v1.16.3** (2026-05-03): `@us-all/mcp-toolkit ^1.1.0` 채택 + `aggregate()` 헬퍼로 두 어그리게이션 도구(`analyze-monitor-state`, `slo-compliance-snapshot`) 마이그레이션. `Promise.allSettled` + 라벨링된 `caveats.push` 보일러플레이트 통합. `analyze-monitor-state`는 이전엔 caveats 노출 없었음 — 추가됨(추가 필드, 비파괴). caveats 라벨 텍스트 변경 (예: `get-slo failed:` → `getSlo failed:`).
- **v1.16.2** (2026-05-03): `@us-all/mcp-toolkit ^1.0.0` 핀 업데이트. toolkit API freeze (semver 1.x 보장 시작) — 코드 변경 0줄, 23/23 테스트 통과.
- **v1.16.1** (2026-05-03): Wave 5 — `analyze-monitor-state`의 embedded `monitor` 필드를 `get-monitor`의 slim 6-field default(id/name/type/overallState/tags/query)에 정렬. monitorState/monitorType은 slim 전 summary 블록에 보존.
- **v1.16.0** (2026-05-03): SLO CRUD 추가 (`create-slo`, `update-slo`, `delete-slo`) — v1.15.0 검증 중 발견된 audit gap. 도구 159→164.
- **v1.15.0** (2026-05-02): `slo-compliance-snapshot` 어그리게이션 — slo + history + corrections + monitor states 1 call. 상태 compliant/at-risk/breached, errorBudgetRemainingPct.
- **v1.14.0** (2026-05-02): Wave 3 Resources — `dd://service/{name}`, `dd://team/{id}`(team+members 합본), `dd://synthetics/{testId}`.
- **v1.13.0** (2026-05-02): MCP Prompts 4개 — `triage-incident`, `audit-monitor-noise`, `analyze-rum-error-spike`, `investigate-slow-trace`.
- **v1.12.2** (2026-05-02): Wave 1 — describe trim 25, 의존성 bumps, fat-read 3개에 default extractFields(get-monitor/incident/dashboard).
- **v1.12.1** (2026-05-02): `@us-all/mcp-toolkit ^0.2.0` 채택 — 로컬 `sanitize` / `wrapToolHandler` 본문 제거, `createWrapToolHandler` factory로 위임. `redactionPatterns`(DD_API_KEY/DD_APP_KEY)와 `errorExtractors`(WriteBlockedError → passthrough, Datadog ApiException duck-typed → structured)만 명시. utils.ts 108→66 lines.
- **v1.12.0** (2026-05-01): `@us-all/mcp-toolkit ^0.1.0` 마이그레이션 — tool-registry/extract-fields toolkit 위임. ~194 lines 절감.
- **v1.11.1**: 추가 MCP Resources (`dd://host/{name}`).
- **v1.11.0**: `analyze-monitor-state` 어그리게이션 도구 — config + state + recent events + downtimes 1 call.
- **v1.10.0**: MCP Resources (`dd://` URI) — monitor, dashboard, slo, incident.
- **v1.9.2**: `pnpm token-stats` + CI TOKEN_BUDGET=30000 가드.
- **v1.9.1**: `extractFields` auto-apply via wrapToolHandler. rum/security/incidents/monitors 핵심 스키마에 명시적 선언.
- **v1.9.0**: 토큰 효율 표준 (DD_TOOLS / DD_DISABLE 16 카테고리 + search-tools 메타툴).
- **v1.8.1**: hono >=4.12.14 보안 패치 (GHSA-458j-xx4x-4375).
- **README**: 158→159 도구 카운트 동기화. "When to use this vs official Datadog Bits AI MCP" 비교표 추가. PLAN.md 재작성.

## 표준 가이드

`@us-all` MCP 작성 표준은 [mcp-toolkit/STANDARD.md](https://github.com/us-all/mcp-toolkit/blob/main/STANDARD.md)에 있음. 이 repo의 STANDARD.md는 redirect.

신규 패턴 진화 시 `@us-all/mcp-toolkit` 한 곳만 업그레이드 → 6 production repo 자동 혜택.
