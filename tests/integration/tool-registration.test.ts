import { describe, it, expect, vi, beforeAll } from "vitest";

const toolCalls: { name: string; description: string }[] = [];

// Mock McpServer to capture tool registrations
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, description: string, ..._args: unknown[]) {
      toolCalls.push({ name, description });
    }
    registerResource(..._args: unknown[]) {
      // resources are not counted as tools — no-op for this test
    }
    registerPrompt(..._args: unknown[]) {
      // prompts are not counted as tools — no-op for this test
    }
    connect() {
      return Promise.resolve();
    }
  },
  ResourceTemplate: class {
    constructor(public uriTemplate: string, public _options?: unknown) {}
  },
}));

// Mock StdioServerTransport
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class {},
}));

const EXPECTED_TOOLS = [
  // Metrics (5)
  "query-metrics", "get-metrics", "get-metric-metadata", "list-active-metrics", "list-metric-tags",
  // Monitors (7)
  "get-monitors", "get-monitor", "create-monitor", "update-monitor", "delete-monitor", "mute-monitor", "validate-monitor",
  // Dashboards (5)
  "get-dashboards", "get-dashboard", "create-dashboard", "update-dashboard", "delete-dashboard",
  // Logs (3)
  "search-logs", "aggregate-logs", "send-logs",
  // Events (2)
  "get-events", "post-event",
  // Incidents (6)
  "get-incidents", "get-incident", "search-incidents", "create-incident", "update-incident", "delete-incident",
  // APM (1)
  "search-spans",
  // RUM (17)
  "search-rum-events", "aggregate-rum",
  "list-rum-applications", "get-rum-application", "create-rum-application", "update-rum-application", "delete-rum-application",
  "list-rum-metrics", "get-rum-metric", "create-rum-metric", "update-rum-metric", "delete-rum-metric",
  "list-rum-retention-filters", "get-rum-retention-filter", "create-rum-retention-filter", "update-rum-retention-filter", "delete-rum-retention-filter",
  // Hosts (2)
  "list-hosts", "get-host-totals",
  // SLOs (3)
  "list-slos", "get-slo", "get-slo-history",
  // Synthetics (6)
  "list-synthetics", "get-synthetics-result", "trigger-synthetics",
  "create-synthetics-test", "update-synthetics-test", "delete-synthetics-test",
  // Downtimes (3)
  "list-downtimes", "create-downtime", "cancel-downtime",
  // Security (9)
  "search-security-signals", "get-security-signal",
  "list-security-rules", "get-security-rule", "delete-security-rule",
  "list-security-suppressions", "get-security-suppression", "create-security-suppression", "delete-security-suppression",
  // Account (2)
  "get-usage-summary", "list-users",
  // Notebooks (2)
  "list-notebooks", "get-notebook",
  // OnCall (2)
  "get-team-oncall", "get-oncall-schedule",
  // Services (2)
  "list-services", "get-service-definition",
  // Containers (1)
  "list-containers",
  // Processes (1)
  "list-processes",
  // Audit (1)
  "search-audit-logs",
  // Cases (4)
  "list-cases", "get-case", "create-case", "update-case-status",
  // Error Tracking (2)
  "list-error-tracking-issues", "get-error-tracking-issue",
  // CI (4)
  "search-ci-pipelines", "aggregate-ci-pipelines", "search-ci-tests", "aggregate-ci-tests",
  // Networks (2)
  "list-network-devices", "get-network-device",
  // DORA (2)
  "send-dora-deployment", "send-dora-incident",
  // Teams (6)
  "list-teams", "get-team", "create-team", "update-team", "delete-team", "get-team-members",
  // Logs Metrics (5)
  "list-logs-metrics", "get-logs-metric", "create-logs-metric", "update-logs-metric", "delete-logs-metric",
  // Spans Metrics (5)
  "list-spans-metrics", "get-spans-metric", "create-spans-metric", "update-spans-metric", "delete-spans-metric",
  // SLO Corrections (5)
  "list-slo-corrections", "get-slo-correction", "create-slo-correction", "update-slo-correction", "delete-slo-correction",
  // APM Retention Filters (5)
  "list-apm-retention-filters", "get-apm-retention-filter", "create-apm-retention-filter", "update-apm-retention-filter", "delete-apm-retention-filter",
  // Status Pages (21)
  "list-status-pages", "get-status-page", "create-status-page", "update-status-page", "delete-status-page",
  "publish-status-page", "unpublish-status-page",
  "list-status-page-components", "get-status-page-component", "create-status-page-component", "update-status-page-component", "delete-status-page-component",
  "list-status-page-degradations", "get-status-page-degradation", "create-status-page-degradation", "update-status-page-degradation", "delete-status-page-degradation",
  "list-status-page-maintenances", "get-status-page-maintenance", "create-status-page-maintenance", "update-status-page-maintenance",
  // Fleet Automation (17)
  "list-fleet-agents", "get-fleet-agent-info", "list-fleet-agent-versions",
  "list-fleet-clusters", "list-fleet-tracers",
  "list-fleet-deployments", "get-fleet-deployment", "create-fleet-deployment-configure", "create-fleet-deployment-upgrade", "cancel-fleet-deployment",
  "list-fleet-schedules", "get-fleet-schedule", "create-fleet-schedule", "update-fleet-schedule", "delete-fleet-schedule", "trigger-fleet-schedule",
  "list-fleet-instrumented-pods",
  // Aggregations (2)
  "analyze-monitor-state", "slo-compliance-snapshot",
];

describe("tool registration", () => {
  beforeAll(async () => {
    toolCalls.length = 0;
    await import("../../src/index.js");
  });

  it("registers exactly 164 tools (161 datadog + 2 aggregations + 1 search-tools meta)", () => {
    expect(toolCalls).toHaveLength(164);
  });

  it("registers all expected tool names", () => {
    const registeredNames = toolCalls.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      expect(registeredNames, `missing tool: ${expected}`).toContain(expected);
    }
  });

  it("has no duplicate tool names", () => {
    const names = toolCalls.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("every tool has a non-empty description", () => {
    for (const tool of toolCalls) {
      expect(tool.description.length, `${tool.name} has empty description`).toBeGreaterThan(0);
    }
  });
});
