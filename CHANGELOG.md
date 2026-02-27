# Changelog

All notable changes to this project will be documented in this file.

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
