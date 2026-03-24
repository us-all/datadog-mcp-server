# Security Policy

## Read-Only by Default

All write/mutate operations are **blocked by default**. The server starts in read-only mode to prevent accidental changes when used by AI agents.

To enable write operations, set the environment variable:

```
DD_ALLOW_WRITE=true
```

### Write-Gated Tools (19)

`create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `create-dashboard`, `update-dashboard`, `delete-dashboard`, `send-logs`, `post-event`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`, `create-downtime`, `cancel-downtime`, `create-case`, `update-case-status`, `send-dora-deployment`, `send-dora-incident`

## API Key Best Practices

- Use **least-privilege** scopes for your Datadog Application Key
- Never commit API keys to source control — use environment variables or a secrets manager
- Rotate keys periodically via the Datadog console
- For read-only usage, the Application Key only needs read scopes

## Error Sanitization

The server automatically redacts sensitive patterns (API keys, app keys, authorization headers) from error messages before returning them to the AI agent.

## Reporting a Vulnerability

If you discover a security issue, please email the maintainers directly rather than opening a public issue. We will respond within 72 hours.
