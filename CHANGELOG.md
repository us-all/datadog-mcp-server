# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-04-10

### Added

- **5 new Incidents tools** (81 → 86 total), full incident lifecycle management
- `get-incident` — get detailed information about a specific incident by ID
- `search-incidents` — search incidents by query (state, severity, title keywords) with sort/pagination
- `create-incident` — create a new incident with title and customer impact info
- `update-incident` — update incident title, customer impact, timestamps
- `delete-incident` — delete an incident by ID
- Enabled unstable SDK operations: `v2.createIncident`, `v2.updateIncident`, `v2.deleteIncident`
- All incident write tools gated behind `DD_ALLOW_WRITE=true`

## [1.2.0] - 2026-04-10

### Added

- **15 new RUM tools** (66 → 81 total), comprehensive RUM API coverage
- **RUM Applications**: `list-rum-applications`, `get-rum-application`, `create-rum-application`, `update-rum-application`, `delete-rum-application` — RUM application CRUD
- **RUM Metrics**: `list-rum-metrics`, `get-rum-metric`, `create-rum-metric`, `update-rum-metric`, `delete-rum-metric` — RUM-based custom metrics CRUD
- **RUM Retention Filters**: `list-rum-retention-filters`, `get-rum-retention-filter`, `create-rum-retention-filter`, `update-rum-retention-filter`, `delete-rum-retention-filter` — RUM data retention filter management
- New API clients: `RumMetricsApi`, `RumRetentionFiltersApi`
- All new write tools gated behind `DD_ALLOW_WRITE=true`

## [1.1.1] - 2026-03-24

### Fixed

- All `z.number()` schemas changed to `z.coerce.number()` to handle MCP clients sending number parameters as strings. Fixes `list-active-metrics`, `get-dashboards`, `search-security-signals`, `search-ci-tests` and other tools failing with "expected number, received string" validation errors.

## [1.1.0] - 2026-03-24

### Added

- **20 new tools** (46 → 66 total), closing feature gaps with the official Datadog MCP server
- **Services**: `list-services`, `get-service-definition` — Software Catalog (SoftwareCatalogApi)
- **Containers**: `list-containers` — infrastructure container monitoring (ContainersApi)
- **Processes**: `list-processes` — process monitoring (ProcessesApi)
- **Audit Logs**: `search-audit-logs` — organization activity tracking (AuditApi)
- **Cases**: `list-cases`, `get-case`, `create-case`, `update-case-status` — Case Management (CaseManagementApi)
- **Error Tracking**: `list-error-tracking-issues`, `get-error-tracking-issue` — error tracking issues (ErrorTrackingApi)
- **CI/CD Visibility**: `search-ci-pipelines`, `aggregate-ci-pipelines`, `search-ci-tests`, `aggregate-ci-tests` — CI pipeline and test visibility (CIVisibilityPipelinesApi, CIVisibilityTestsApi)
- **Network Devices**: `list-network-devices`, `get-network-device` — network device monitoring (NetworkDeviceMonitoringApi)
- **DORA Metrics**: `send-dora-deployment`, `send-dora-incident` — DevOps performance metrics (DORAMetricsApi)
- **Monitor Validation**: `validate-monitor` — validate monitor definitions without creating them
- **Test infrastructure**: vitest with 18 tests across 4 test files (config, utils, schemas, tool registration)
- **Test Visibility**: dd-trace integration for Datadog CI Test Visibility in GitHub Actions
- CI workflow now runs tests on Node 20+ with dd-trace reporting

### Fixed

- Cases API `pageNumber` changed from 0-based to 1-based (Datadog API requires `> 0`)
- Error Tracking `searchIssues` uses SDK model class instances (ObjectSerializer compatibility)
- CI aggregate tools (`aggregate-ci-pipelines`, `aggregate-ci-tests`) use SDK model class instances for `groupBy` serialization

## [1.0.0] - 2026-02-27

### Added

- **46 Datadog tools** across 10 categories
- **Metrics**: `query-metrics`, `get-metrics`, `get-metric-metadata`, `list-active-metrics`, `list-metric-tags`
- **Monitors**: `get-monitors`, `get-monitor`, `create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`
- **Dashboards**: `get-dashboards`, `get-dashboard`, `create-dashboard`, `update-dashboard`, `delete-dashboard`
- **Logs**: `search-logs`, `aggregate-logs`, `send-logs`
- **Events**: `get-events`, `post-event`
- **Incidents**: `get-incidents`
- **APM**: `search-spans`
- **RUM**: `search-rum-events`, `aggregate-rum`
- **Hosts**: `list-hosts`, `get-host-totals`
- **SLOs**: `list-slos`, `get-slo`, `get-slo-history`
- **Synthetics**: `list-synthetics`, `get-synthetics-result`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`
- **Downtimes**: `list-downtimes`, `create-downtime`, `cancel-downtime`
- **Security**: `search-security-signals`
- **Account**: `get-usage-summary`, `list-users`
- **Notebooks**: `list-notebooks`, `get-notebook`
- **On-Call**: `get-team-oncall`, `get-oncall-schedule`
- **Read-only mode** by default — 15 write tools gated behind `DD_ALLOW_WRITE=true`
- Structured error handling with `wrapToolHandler` for all 46 tools
- Error sanitization — API keys, app keys, and auth headers redacted from error output
- Datadog API error extraction — HTTP status codes, error bodies, and request IDs surfaced
- Improved type-safe error parsing with TypeScript type guards; minimized unsafe casts where unavoidable
- Rich tool descriptions with usage examples for all zod schema fields
- Smoke test script (`pnpm run smoke`) validating 5 core read-only tools
- DD_SITE documentation for all 5 Datadog regions (US1, US3, US5, EU1, AP1)
- SECURITY.md with read-only mode docs and API key best practices
- Docker support (multi-stage build)
- GitHub Actions CI/CD (build, npm publish, Docker publish)
- English and Korean documentation
