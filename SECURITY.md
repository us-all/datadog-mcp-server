# Security Policy

## Read-Only by Default

All write/mutate operations are **blocked by default**. The server starts in read-only mode to prevent accidental changes when used by AI agents.

To enable write operations, set the environment variable:

```
DD_ALLOW_WRITE=true
```

### Write-Gated Tools

All Datadog mutations call `assertWriteAllowed()` and require `DD_ALLOW_WRITE=true`.
This includes monitors, dashboards, logs/events, incidents, synthetics, downtimes,
security suppressions/rules, cases, SLOs and corrections, RUM/APM/log/span
metrics or retention filters, status pages, fleet deployment/schedule actions,
teams, and DORA event submission.

When adding a new tool that creates, updates, deletes, mutes, triggers, publishes,
or otherwise changes Datadog state, call `assertWriteAllowed()` before the API
request and add/update a regression test where practical.

## API Key Best Practices

- Use **least-privilege** scopes for your Datadog Application Key
- Never commit API keys to source control — use environment variables or a secrets manager
- Rotate keys periodically via the Datadog console
- For read-only usage, the Application Key only needs read scopes

## Error Sanitization

The server automatically redacts sensitive patterns (API keys, app keys, authorization headers) from error messages before returning them to the AI agent.

## Reporting a Vulnerability

If you discover a security issue, please email the maintainers directly rather than opening a public issue. We will respond within 72 hours.
