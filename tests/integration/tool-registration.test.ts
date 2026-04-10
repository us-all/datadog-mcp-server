import { describe, it, expect, vi, beforeAll } from "vitest";

const toolCalls: { name: string; description: string }[] = [];

// Mock McpServer to capture tool registrations
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, description: string, ..._args: unknown[]) {
      toolCalls.push({ name, description });
    }
    connect() {
      return Promise.resolve();
    }
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
];

describe("tool registration", () => {
  beforeAll(async () => {
    toolCalls.length = 0;
    await import("../../src/index.js");
  });

  it("registers exactly 94 tools", () => {
    expect(toolCalls).toHaveLength(94);
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
