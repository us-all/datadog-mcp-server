#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateConfig } from "./config.js";

// Tool imports
import {
  queryMetricsSchema, queryMetrics,
  getMetricsSchema, getMetrics,
  getMetricMetadataSchema, getMetricMetadata,
  listActiveMetricsSchema, listActiveMetrics,
} from "./tools/metrics.js";
import {
  getMonitorsSchema, getMonitors, getMonitorSchema, getMonitor,
  createMonitorSchema, createMonitor, updateMonitorSchema, updateMonitor,
  deleteMonitorSchema, deleteMonitor, muteMonitorSchema, muteMonitor,
} from "./tools/monitors.js";
import {
  getDashboardsSchema, getDashboards, getDashboardSchema, getDashboard,
  createDashboardSchema, createDashboard, updateDashboardSchema, updateDashboard,
  deleteDashboardSchema, deleteDashboard,
} from "./tools/dashboards.js";
import { searchLogsSchema, searchLogs, aggregateLogsSchema, aggregateLogs, sendLogsSchema, sendLogs } from "./tools/logs.js";
import { getEventsSchema, getEvents, postEventSchema, postEvent } from "./tools/events.js";
import { getIncidentsSchema, getIncidents } from "./tools/incidents.js";
import { searchSpansSchema, searchSpans } from "./tools/apm.js";
import { searchRumEventsSchema, searchRumEvents, aggregateRumSchema, aggregateRum } from "./tools/rum.js";
import { listHostsSchema, listHosts, getHostTotalsSchema, getHostTotals } from "./tools/hosts.js";
import { listSlosSchema, listSlos, getSloSchema, getSlo, getSloHistorySchema, getSloHistory } from "./tools/slos.js";
import {
  listSyntheticsSchema, listSynthetics, getSyntheticsResultSchema, getSyntheticsResult,
  triggerSyntheticsSchema, triggerSynthetics, createSyntheticsTestSchema, createSyntheticsTest,
  updateSyntheticsTestSchema, updateSyntheticsTest, deleteSyntheticsTestSchema, deleteSyntheticsTest,
} from "./tools/synthetics.js";
import { listDowntimesSchema, listDowntimes, createDowntimeSchema, createDowntime, cancelDowntimeSchema, cancelDowntime } from "./tools/downtimes.js";
import { searchSecuritySignalsSchema, searchSecuritySignals } from "./tools/security.js";
import { getUsageSummarySchema, getUsageSummary, listUsersSchema, listUsers } from "./tools/account.js";
import { listNotebooksSchema, listNotebooks, getNotebookSchema, getNotebook } from "./tools/notebooks.js";

validateConfig();

const server = new McpServer({
  name: "datadog",
  version: "1.0.0",
});

// --- Metrics ---

server.tool(
  "query-metrics",
  "Query time-series metric data from Datadog. Supports any Datadog metric query syntax (e.g., avg:system.cpu.user{host:myhost} by {env})",
  queryMetricsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await queryMetrics(params), null, 2) }],
  }),
);

server.tool(
  "get-metrics",
  "Search for available Datadog metrics by name pattern",
  getMetricsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getMetrics(params), null, 2) }],
  }),
);

server.tool(
  "get-metric-metadata",
  "Get metadata for a specific Datadog metric (type, unit, description)",
  getMetricMetadataSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getMetricMetadata(params), null, 2) }],
  }),
);

server.tool(
  "list-active-metrics",
  "List active metrics from a given time, optionally filtered by host or tag",
  listActiveMetricsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listActiveMetrics(params), null, 2) }],
  }),
);

// --- Monitors ---

server.tool(
  "get-monitors",
  "List Datadog monitors with optional filtering by name, tags, or state",
  getMonitorsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getMonitors(params), null, 2) }],
  }),
);

server.tool(
  "get-monitor",
  "Get detailed information about a specific Datadog monitor by ID",
  getMonitorSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getMonitor(params), null, 2) }],
  }),
);

server.tool(
  "create-monitor",
  "Create a new Datadog monitor (metric alert, log alert, etc.)",
  createMonitorSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await createMonitor(params), null, 2) }],
  }),
);

server.tool(
  "update-monitor",
  "Update an existing Datadog monitor's configuration",
  updateMonitorSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await updateMonitor(params), null, 2) }],
  }),
);

server.tool(
  "delete-monitor",
  "Delete a Datadog monitor by ID",
  deleteMonitorSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await deleteMonitor(params), null, 2) }],
  }),
);

server.tool(
  "mute-monitor",
  "Mute a Datadog monitor (silence notifications) for a scope and optional duration",
  muteMonitorSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await muteMonitor(params), null, 2) }],
  }),
);

// --- Dashboards ---

server.tool(
  "get-dashboards",
  "List all Datadog dashboards",
  getDashboardsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getDashboards(params), null, 2) }],
  }),
);

server.tool(
  "get-dashboard",
  "Get a specific Datadog dashboard with all widgets and configuration",
  getDashboardSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getDashboard(params), null, 2) }],
  }),
);

server.tool(
  "create-dashboard",
  "Create a new Datadog dashboard with widgets",
  createDashboardSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await createDashboard(params), null, 2) }],
  }),
);

server.tool(
  "update-dashboard",
  "Update an existing Datadog dashboard",
  updateDashboardSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await updateDashboard(params), null, 2) }],
  }),
);

server.tool(
  "delete-dashboard",
  "Delete a Datadog dashboard by ID",
  deleteDashboardSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await deleteDashboard(params), null, 2) }],
  }),
);

// --- Logs ---

server.tool(
  "search-logs",
  "Search Datadog logs by query with time range filtering",
  searchLogsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await searchLogs(params), null, 2) }],
  }),
);

server.tool(
  "aggregate-logs",
  "Aggregate Datadog logs with statistical computations (count, avg, sum, percentiles) and grouping",
  aggregateLogsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await aggregateLogs(params), null, 2) }],
  }),
);

server.tool(
  "send-logs",
  "Send log entries to Datadog",
  sendLogsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await sendLogs(params), null, 2) }],
  }),
);

// --- Events ---

server.tool(
  "get-events",
  "Get Datadog events within a time range, optionally filtered by priority, source, or tags",
  getEventsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getEvents(params), null, 2) }],
  }),
);

server.tool(
  "post-event",
  "Post a custom event to Datadog (supports markdown, @mentions)",
  postEventSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await postEvent(params), null, 2) }],
  }),
);

// --- Incidents ---

server.tool(
  "get-incidents",
  "List Datadog incidents with pagination",
  getIncidentsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getIncidents(params), null, 2) }],
  }),
);

// --- APM ---

server.tool(
  "search-spans",
  "Search APM spans/traces for performance analysis. Filter by service, resource, status, duration",
  searchSpansSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await searchSpans(params), null, 2) }],
  }),
);

// --- RUM ---

server.tool(
  "search-rum-events",
  "Search Real User Monitoring events (sessions, views, errors, actions) from mobile/web apps",
  searchRumEventsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await searchRumEvents(params), null, 2) }],
  }),
);

server.tool(
  "aggregate-rum",
  "Aggregate RUM data with statistical computations (count, avg, percentiles) and grouping by fields",
  aggregateRumSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await aggregateRum(params), null, 2) }],
  }),
);

// --- Hosts ---

server.tool(
  "list-hosts",
  "List infrastructure hosts with filtering, sorting, and metadata",
  listHostsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listHosts(params), null, 2) }],
  }),
);

server.tool(
  "get-host-totals",
  "Get total number of active and up hosts",
  getHostTotalsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getHostTotals(params), null, 2) }],
  }),
);

// --- SLOs ---

server.tool(
  "list-slos",
  "List Service Level Objectives with optional filtering by query, tags, or IDs",
  listSlosSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listSlos(params), null, 2) }],
  }),
);

server.tool(
  "get-slo",
  "Get detailed information about a specific SLO",
  getSloSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getSlo(params), null, 2) }],
  }),
);

server.tool(
  "get-slo-history",
  "Get SLO performance history over a time range (status, error budget, compliance)",
  getSloHistorySchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getSloHistory(params), null, 2) }],
  }),
);

// --- Synthetics ---

server.tool(
  "list-synthetics",
  "List all Synthetics monitoring tests (API, Browser, Mobile)",
  listSyntheticsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listSynthetics(params), null, 2) }],
  }),
);

server.tool(
  "get-synthetics-result",
  "Get latest results for a Synthetics API test by public ID",
  getSyntheticsResultSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getSyntheticsResult(params), null, 2) }],
  }),
);

server.tool(
  "trigger-synthetics",
  "Trigger one or more Synthetics tests on demand",
  triggerSyntheticsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await triggerSynthetics(params), null, 2) }],
  }),
);

server.tool(
  "create-synthetics-test",
  "Create a new Synthetics API test (HTTP, SSL, TCP, DNS, etc.)",
  createSyntheticsTestSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await createSyntheticsTest(params), null, 2) }],
  }),
);

server.tool(
  "update-synthetics-test",
  "Update an existing Synthetics API test",
  updateSyntheticsTestSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await updateSyntheticsTest(params), null, 2) }],
  }),
);

server.tool(
  "delete-synthetics-test",
  "Delete one or more Synthetics tests by public ID",
  deleteSyntheticsTestSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await deleteSyntheticsTest(params), null, 2) }],
  }),
);

// --- Downtimes ---

server.tool(
  "list-downtimes",
  "List scheduled downtimes (monitor mute periods)",
  listDowntimesSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listDowntimes(params), null, 2) }],
  }),
);

server.tool(
  "create-downtime",
  "Create a downtime to mute monitors by scope, monitor ID, or monitor tags",
  createDowntimeSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await createDowntime(params), null, 2) }],
  }),
);

server.tool(
  "cancel-downtime",
  "Cancel an active downtime by ID",
  cancelDowntimeSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await cancelDowntime(params), null, 2) }],
  }),
);

// --- Security ---

server.tool(
  "search-security-signals",
  "Search Datadog security monitoring signals with query filtering",
  searchSecuritySignalsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await searchSecuritySignals(params), null, 2) }],
  }),
);

// --- Account & Usage ---

server.tool(
  "get-usage-summary",
  "Get Datadog account usage summary for a billing period (hosts, logs, APM, RUM, etc.)",
  getUsageSummarySchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getUsageSummary(params), null, 2) }],
  }),
);

server.tool(
  "list-users",
  "List Datadog organization users with filtering and pagination",
  listUsersSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listUsers(params), null, 2) }],
  }),
);

// --- Notebooks ---

server.tool(
  "list-notebooks",
  "List Datadog notebooks with search and filtering",
  listNotebooksSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await listNotebooks(params), null, 2) }],
  }),
);

server.tool(
  "get-notebook",
  "Get a specific Datadog notebook with all cells and content",
  getNotebookSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getNotebook(params), null, 2) }],
  }),
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Datadog MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
