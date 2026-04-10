#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateConfig } from "./config.js";
import { wrapToolHandler } from "./tools/utils.js";

// Tool imports
import {
  queryMetricsSchema, queryMetrics,
  getMetricsSchema, getMetrics,
  getMetricMetadataSchema, getMetricMetadata,
  listActiveMetricsSchema, listActiveMetrics,
  listMetricTagsSchema, listMetricTags,
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
import {
  getIncidentsSchema, getIncidents, getIncidentSchema, getIncident,
  searchIncidentsSchema, searchIncidents, createIncidentSchema, createIncident,
  updateIncidentSchema, updateIncident, deleteIncidentSchema, deleteIncident,
} from "./tools/incidents.js";
import { searchSpansSchema, searchSpans } from "./tools/apm.js";
import {
  searchRumEventsSchema, searchRumEvents, aggregateRumSchema, aggregateRum,
  listRumApplicationsSchema, listRumApplications, getRumApplicationSchema, getRumApplication,
  createRumApplicationSchema, createRumApplication, updateRumApplicationSchema, updateRumApplication,
  deleteRumApplicationSchema, deleteRumApplication,
} from "./tools/rum.js";
import { listHostsSchema, listHosts, getHostTotalsSchema, getHostTotals } from "./tools/hosts.js";
import { listSlosSchema, listSlos, getSloSchema, getSlo, getSloHistorySchema, getSloHistory } from "./tools/slos.js";
import {
  listSyntheticsSchema, listSynthetics, getSyntheticsResultSchema, getSyntheticsResult,
  triggerSyntheticsSchema, triggerSynthetics, createSyntheticsTestSchema, createSyntheticsTest,
  updateSyntheticsTestSchema, updateSyntheticsTest, deleteSyntheticsTestSchema, deleteSyntheticsTest,
} from "./tools/synthetics.js";
import { listDowntimesSchema, listDowntimes, createDowntimeSchema, createDowntime, cancelDowntimeSchema, cancelDowntime } from "./tools/downtimes.js";
import {
  searchSecuritySignalsSchema, searchSecuritySignals,
  getSecuritySignalSchema, getSecuritySignal,
  listSecurityRulesSchema, listSecurityRules,
  getSecurityRuleSchema, getSecurityRule,
  deleteSecurityRuleSchema, deleteSecurityRule,
  listSecuritySuppressionsSchema, listSecuritySuppressions,
  getSecuritySuppressionSchema, getSecuritySuppression,
  createSecuritySuppressionSchema, createSecuritySuppression,
  deleteSecuritySuppressionSchema, deleteSecuritySuppression,
} from "./tools/security.js";
import { getUsageSummarySchema, getUsageSummary, listUsersSchema, listUsers } from "./tools/account.js";
import { listNotebooksSchema, listNotebooks, getNotebookSchema, getNotebook } from "./tools/notebooks.js";
import { getTeamOnCallSchema, getTeamOnCall, getOnCallScheduleSchema, getOnCallSchedule } from "./tools/oncall.js";
import { listServicesSchema, listServices, getServiceDefinitionSchema, getServiceDefinition } from "./tools/services.js";
import { listContainersSchema, listContainers } from "./tools/containers.js";
import { listProcessesSchema, listProcesses } from "./tools/processes.js";
import { searchAuditLogsSchema, searchAuditLogs } from "./tools/audit.js";
import { listCasesSchema, listCases, getCaseSchema, getCase, createCaseSchema, createCase, updateCaseStatusSchema, updateCaseStatus } from "./tools/cases.js";
import { listErrorTrackingIssuesSchema, listErrorTrackingIssues, getErrorTrackingIssueSchema, getErrorTrackingIssue } from "./tools/errors.js";
import { searchCiPipelinesSchema, searchCiPipelines, aggregateCiPipelinesSchema, aggregateCiPipelines, searchCiTestsSchema, searchCiTests, aggregateCiTestsSchema, aggregateCiTests } from "./tools/ci.js";
import { listNetworkDevicesSchema, listNetworkDevices, getNetworkDeviceSchema, getNetworkDevice } from "./tools/networks.js";
import { sendDoraDeploymentSchema, sendDoraDeployment, sendDoraIncidentSchema, sendDoraIncident } from "./tools/dora.js";
import {
  listTeamsSchema, listTeams, getTeamSchema, getTeam,
  createTeamSchema, createTeam, updateTeamSchema, updateTeam,
  deleteTeamSchema, deleteTeam, getTeamMembersSchema, getTeamMembers,
} from "./tools/teams.js";
import {
  listRumMetricsSchema, listRumMetrics, getRumMetricSchema, getRumMetric,
  createRumMetricSchema, createRumMetric, updateRumMetricSchema, updateRumMetric,
  deleteRumMetricSchema, deleteRumMetric,
} from "./tools/rum-metrics.js";
import {
  listRumRetentionFiltersSchema, listRumRetentionFilters, getRumRetentionFilterSchema, getRumRetentionFilter,
  createRumRetentionFilterSchema, createRumRetentionFilter, updateRumRetentionFilterSchema, updateRumRetentionFilter,
  deleteRumRetentionFilterSchema, deleteRumRetentionFilter,
} from "./tools/rum-retention-filters.js";
import { validateMonitorSchema, validateMonitor } from "./tools/monitors.js";

validateConfig();

const server = new McpServer({
  name: "datadog",
  version: "1.5.0",
});

// --- Metrics ---

server.tool(
  "query-metrics",
  "Query time-series metric data from Datadog. Supports any Datadog metric query syntax (e.g., avg:system.cpu.user{host:myhost} by {env})",
  queryMetricsSchema.shape,
  wrapToolHandler(queryMetrics),
);

server.tool(
  "get-metrics",
  "Search for available Datadog metrics by name pattern",
  getMetricsSchema.shape,
  wrapToolHandler(getMetrics),
);

server.tool(
  "get-metric-metadata",
  "Get metadata for a specific Datadog metric (type, unit, description)",
  getMetricMetadataSchema.shape,
  wrapToolHandler(getMetricMetadata),
);

server.tool(
  "list-active-metrics",
  "List active metrics from a given time, optionally filtered by host or tag",
  listActiveMetricsSchema.shape,
  wrapToolHandler(listActiveMetrics),
);

server.tool(
  "list-metric-tags",
  "List tags for a specific metric (useful for understanding available groupings and filters)",
  listMetricTagsSchema.shape,
  wrapToolHandler(listMetricTags),
);

// --- Monitors ---

server.tool(
  "get-monitors",
  "List Datadog monitors with optional filtering by name, tags, or state",
  getMonitorsSchema.shape,
  wrapToolHandler(getMonitors),
);

server.tool(
  "get-monitor",
  "Get detailed information about a specific Datadog monitor by ID",
  getMonitorSchema.shape,
  wrapToolHandler(getMonitor),
);

server.tool(
  "create-monitor",
  "Create a new Datadog monitor (metric alert, log alert, etc.)",
  createMonitorSchema.shape,
  wrapToolHandler(createMonitor),
);

server.tool(
  "update-monitor",
  "Update an existing Datadog monitor's configuration",
  updateMonitorSchema.shape,
  wrapToolHandler(updateMonitor),
);

server.tool(
  "delete-monitor",
  "Delete a Datadog monitor by ID",
  deleteMonitorSchema.shape,
  wrapToolHandler(deleteMonitor),
);

server.tool(
  "mute-monitor",
  "Mute a Datadog monitor (silence notifications) for a scope and optional duration",
  muteMonitorSchema.shape,
  wrapToolHandler(muteMonitor),
);

// --- Dashboards ---

server.tool(
  "get-dashboards",
  "List all Datadog dashboards",
  getDashboardsSchema.shape,
  wrapToolHandler(getDashboards),
);

server.tool(
  "get-dashboard",
  "Get a specific Datadog dashboard with all widgets and configuration",
  getDashboardSchema.shape,
  wrapToolHandler(getDashboard),
);

server.tool(
  "create-dashboard",
  "Create a new Datadog dashboard with widgets",
  createDashboardSchema.shape,
  wrapToolHandler(createDashboard),
);

server.tool(
  "update-dashboard",
  "Update an existing Datadog dashboard",
  updateDashboardSchema.shape,
  wrapToolHandler(updateDashboard),
);

server.tool(
  "delete-dashboard",
  "Delete a Datadog dashboard by ID",
  deleteDashboardSchema.shape,
  wrapToolHandler(deleteDashboard),
);

// --- Logs ---

server.tool(
  "search-logs",
  "Search Datadog logs by query with time range filtering",
  searchLogsSchema.shape,
  wrapToolHandler(searchLogs),
);

server.tool(
  "aggregate-logs",
  "Aggregate Datadog logs with statistical computations (count, avg, sum, percentiles) and grouping",
  aggregateLogsSchema.shape,
  wrapToolHandler(aggregateLogs),
);

server.tool(
  "send-logs",
  "Send log entries to Datadog",
  sendLogsSchema.shape,
  wrapToolHandler(sendLogs),
);

// --- Events ---

server.tool(
  "get-events",
  "Get Datadog events within a time range, optionally filtered by priority, source, or tags",
  getEventsSchema.shape,
  wrapToolHandler(getEvents),
);

server.tool(
  "post-event",
  "Post a custom event to Datadog (supports markdown, @mentions)",
  postEventSchema.shape,
  wrapToolHandler(postEvent),
);

// --- Incidents ---

server.tool(
  "get-incidents",
  "List Datadog incidents with pagination",
  getIncidentsSchema.shape,
  wrapToolHandler(getIncidents),
);

server.tool(
  "get-incident",
  "Get detailed information about a specific Datadog incident by ID",
  getIncidentSchema.shape,
  wrapToolHandler(getIncident),
);

server.tool(
  "search-incidents",
  "Search Datadog incidents by query (state, severity, title keywords)",
  searchIncidentsSchema.shape,
  wrapToolHandler(searchIncidents),
);

server.tool(
  "create-incident",
  "Create a new Datadog incident with title and customer impact info",
  createIncidentSchema.shape,
  wrapToolHandler(createIncident),
);

server.tool(
  "update-incident",
  "Update a Datadog incident's title, customer impact, or timestamps",
  updateIncidentSchema.shape,
  wrapToolHandler(updateIncident),
);

server.tool(
  "delete-incident",
  "Delete a Datadog incident by ID",
  deleteIncidentSchema.shape,
  wrapToolHandler(deleteIncident),
);

// --- APM ---

server.tool(
  "search-spans",
  "Search APM spans/traces for performance analysis. Filter by service, resource, status, duration",
  searchSpansSchema.shape,
  wrapToolHandler(searchSpans),
);

// --- RUM ---

server.tool(
  "search-rum-events",
  "Search Real User Monitoring events (sessions, views, errors, actions) from mobile/web apps",
  searchRumEventsSchema.shape,
  wrapToolHandler(searchRumEvents),
);

server.tool(
  "aggregate-rum",
  "Aggregate RUM data with statistical computations (count, avg, percentiles) and grouping by fields",
  aggregateRumSchema.shape,
  wrapToolHandler(aggregateRum),
);

server.tool(
  "list-rum-applications",
  "List all RUM applications in your Datadog organization",
  listRumApplicationsSchema.shape,
  wrapToolHandler(listRumApplications),
);

server.tool(
  "get-rum-application",
  "Get detailed information about a specific RUM application by ID",
  getRumApplicationSchema.shape,
  wrapToolHandler(getRumApplication),
);

server.tool(
  "create-rum-application",
  "Create a new RUM application (browser, ios, android, react-native, flutter, etc.)",
  createRumApplicationSchema.shape,
  wrapToolHandler(createRumApplication),
);

server.tool(
  "update-rum-application",
  "Update an existing RUM application's name or type",
  updateRumApplicationSchema.shape,
  wrapToolHandler(updateRumApplication),
);

server.tool(
  "delete-rum-application",
  "Delete a RUM application by ID",
  deleteRumApplicationSchema.shape,
  wrapToolHandler(deleteRumApplication),
);

// --- Hosts ---

server.tool(
  "list-hosts",
  "List infrastructure hosts with filtering, sorting, and metadata",
  listHostsSchema.shape,
  wrapToolHandler(listHosts),
);

server.tool(
  "get-host-totals",
  "Get total number of active and up hosts",
  getHostTotalsSchema.shape,
  wrapToolHandler(getHostTotals),
);

// --- SLOs ---

server.tool(
  "list-slos",
  "List Service Level Objectives with optional filtering by query, tags, or IDs",
  listSlosSchema.shape,
  wrapToolHandler(listSlos),
);

server.tool(
  "get-slo",
  "Get detailed information about a specific SLO",
  getSloSchema.shape,
  wrapToolHandler(getSlo),
);

server.tool(
  "get-slo-history",
  "Get SLO performance history over a time range (status, error budget, compliance)",
  getSloHistorySchema.shape,
  wrapToolHandler(getSloHistory),
);

// --- Synthetics ---

server.tool(
  "list-synthetics",
  "List all Synthetics monitoring tests (API, Browser, Mobile)",
  listSyntheticsSchema.shape,
  wrapToolHandler(listSynthetics),
);

server.tool(
  "get-synthetics-result",
  "Get latest results for a Synthetics API test by public ID",
  getSyntheticsResultSchema.shape,
  wrapToolHandler(getSyntheticsResult),
);

server.tool(
  "trigger-synthetics",
  "Trigger one or more Synthetics tests on demand",
  triggerSyntheticsSchema.shape,
  wrapToolHandler(triggerSynthetics),
);

server.tool(
  "create-synthetics-test",
  "Create a new Synthetics API test (HTTP, SSL, TCP, DNS, etc.)",
  createSyntheticsTestSchema.shape,
  wrapToolHandler(createSyntheticsTest),
);

server.tool(
  "update-synthetics-test",
  "Update an existing Synthetics API test",
  updateSyntheticsTestSchema.shape,
  wrapToolHandler(updateSyntheticsTest),
);

server.tool(
  "delete-synthetics-test",
  "Delete one or more Synthetics tests by public ID",
  deleteSyntheticsTestSchema.shape,
  wrapToolHandler(deleteSyntheticsTest),
);

// --- Downtimes ---

server.tool(
  "list-downtimes",
  "List scheduled downtimes (monitor mute periods)",
  listDowntimesSchema.shape,
  wrapToolHandler(listDowntimes),
);

server.tool(
  "create-downtime",
  "Create a downtime to mute monitors by scope, monitor ID, or monitor tags",
  createDowntimeSchema.shape,
  wrapToolHandler(createDowntime),
);

server.tool(
  "cancel-downtime",
  "Cancel an active downtime by ID",
  cancelDowntimeSchema.shape,
  wrapToolHandler(cancelDowntime),
);

// --- Security ---

server.tool(
  "search-security-signals",
  "Search Datadog security monitoring signals with query filtering",
  searchSecuritySignalsSchema.shape,
  wrapToolHandler(searchSecuritySignals),
);

server.tool(
  "get-security-signal",
  "Get detailed information about a specific security signal by ID",
  getSecuritySignalSchema.shape,
  wrapToolHandler(getSecuritySignal),
);

server.tool(
  "list-security-rules",
  "List security monitoring detection rules with optional search filtering",
  listSecurityRulesSchema.shape,
  wrapToolHandler(listSecurityRules),
);

server.tool(
  "get-security-rule",
  "Get detailed information about a specific security monitoring detection rule",
  getSecurityRuleSchema.shape,
  wrapToolHandler(getSecurityRule),
);

server.tool(
  "delete-security-rule",
  "Delete a security monitoring detection rule by ID",
  deleteSecurityRuleSchema.shape,
  wrapToolHandler(deleteSecurityRule),
);

server.tool(
  "list-security-suppressions",
  "List security monitoring suppression rules",
  listSecuritySuppressionsSchema.shape,
  wrapToolHandler(listSecuritySuppressions),
);

server.tool(
  "get-security-suppression",
  "Get detailed information about a specific security monitoring suppression rule",
  getSecuritySuppressionSchema.shape,
  wrapToolHandler(getSecuritySuppression),
);

server.tool(
  "create-security-suppression",
  "Create a security monitoring suppression rule to suppress signals matching a query",
  createSecuritySuppressionSchema.shape,
  wrapToolHandler(createSecuritySuppression),
);

server.tool(
  "delete-security-suppression",
  "Delete a security monitoring suppression rule by ID",
  deleteSecuritySuppressionSchema.shape,
  wrapToolHandler(deleteSecuritySuppression),
);

// --- Account & Usage ---

server.tool(
  "get-usage-summary",
  "Get Datadog account usage summary for a billing period (hosts, logs, APM, RUM, etc.)",
  getUsageSummarySchema.shape,
  wrapToolHandler(getUsageSummary),
);

server.tool(
  "list-users",
  "List Datadog organization users with filtering and pagination",
  listUsersSchema.shape,
  wrapToolHandler(listUsers),
);

// --- Notebooks ---

server.tool(
  "list-notebooks",
  "List Datadog notebooks with search and filtering",
  listNotebooksSchema.shape,
  wrapToolHandler(listNotebooks),
);

server.tool(
  "get-notebook",
  "Get a specific Datadog notebook with all cells and content",
  getNotebookSchema.shape,
  wrapToolHandler(getNotebook),
);

// --- On-Call ---

server.tool(
  "get-team-oncall",
  "Get current on-call responders for a Datadog team",
  getTeamOnCallSchema.shape,
  wrapToolHandler(getTeamOnCall),
);

server.tool(
  "get-oncall-schedule",
  "Get an on-call schedule by ID with layers and team information",
  getOnCallScheduleSchema.shape,
  wrapToolHandler(getOnCallSchedule),
);

// --- Services (Software Catalog) ---

server.tool(
  "list-services",
  "List services from Datadog Software Catalog with filtering",
  listServicesSchema.shape,
  wrapToolHandler(listServices),
);

server.tool(
  "get-service-definition",
  "Get a service definition from Datadog Software Catalog by entity ID",
  getServiceDefinitionSchema.shape,
  wrapToolHandler(getServiceDefinition),
);

// --- Containers ---

server.tool(
  "list-containers",
  "List infrastructure containers with filtering and pagination",
  listContainersSchema.shape,
  wrapToolHandler(listContainers),
);

// --- Processes ---

server.tool(
  "list-processes",
  "List running processes across infrastructure with search and tag filtering",
  listProcessesSchema.shape,
  wrapToolHandler(listProcesses),
);

// --- Audit Logs ---

server.tool(
  "search-audit-logs",
  "Search Datadog audit logs for organization activity tracking (user actions, resource changes)",
  searchAuditLogsSchema.shape,
  wrapToolHandler(searchAuditLogs),
);

// --- Cases ---

server.tool(
  "list-cases",
  "List Datadog Case Management cases with search and filtering",
  listCasesSchema.shape,
  wrapToolHandler(listCases),
);

server.tool(
  "get-case",
  "Get detailed information about a specific case by ID",
  getCaseSchema.shape,
  wrapToolHandler(getCase),
);

server.tool(
  "create-case",
  "Create a new case in Datadog Case Management",
  createCaseSchema.shape,
  wrapToolHandler(createCase),
);

server.tool(
  "update-case-status",
  "Update the status of a Datadog case (OPEN, IN_PROGRESS, CLOSED)",
  updateCaseStatusSchema.shape,
  wrapToolHandler(updateCaseStatus),
);

// --- Error Tracking ---

server.tool(
  "list-error-tracking-issues",
  "List error tracking issues with search, filtering, and sorting",
  listErrorTrackingIssuesSchema.shape,
  wrapToolHandler(listErrorTrackingIssues),
);

server.tool(
  "get-error-tracking-issue",
  "Get detailed information about a specific error tracking issue",
  getErrorTrackingIssueSchema.shape,
  wrapToolHandler(getErrorTrackingIssue),
);

// --- CI/CD Visibility ---

server.tool(
  "search-ci-pipelines",
  "Search CI/CD pipeline events (builds, deploys) with query filtering",
  searchCiPipelinesSchema.shape,
  wrapToolHandler(searchCiPipelines),
);

server.tool(
  "aggregate-ci-pipelines",
  "Aggregate CI/CD pipeline data with statistical computations and grouping",
  aggregateCiPipelinesSchema.shape,
  wrapToolHandler(aggregateCiPipelines),
);

server.tool(
  "search-ci-tests",
  "Search CI test events (unit tests, integration tests) with query filtering",
  searchCiTestsSchema.shape,
  wrapToolHandler(searchCiTests),
);

server.tool(
  "aggregate-ci-tests",
  "Aggregate CI test data with statistical computations and grouping",
  aggregateCiTestsSchema.shape,
  wrapToolHandler(aggregateCiTests),
);

// --- Network Devices ---

server.tool(
  "list-network-devices",
  "List network devices (routers, switches, firewalls) monitored by Datadog NDM",
  listNetworkDevicesSchema.shape,
  wrapToolHandler(listNetworkDevices),
);

server.tool(
  "get-network-device",
  "Get detailed information about a specific network device by ID",
  getNetworkDeviceSchema.shape,
  wrapToolHandler(getNetworkDevice),
);

// --- DORA Metrics ---

server.tool(
  "send-dora-deployment",
  "Send a DORA deployment event for tracking deployment frequency and lead time",
  sendDoraDeploymentSchema.shape,
  wrapToolHandler(sendDoraDeployment),
);

server.tool(
  "send-dora-incident",
  "Send a DORA incident event for tracking change failure rate and MTTR",
  sendDoraIncidentSchema.shape,
  wrapToolHandler(sendDoraIncident),
);

// --- RUM Metrics ---

server.tool(
  "list-rum-metrics",
  "List all configured rum-based metrics with their definitions",
  listRumMetricsSchema.shape,
  wrapToolHandler(listRumMetrics),
);

server.tool(
  "get-rum-metric",
  "Get a specific rum-based metric definition by name",
  getRumMetricSchema.shape,
  wrapToolHandler(getRumMetric),
);

server.tool(
  "create-rum-metric",
  "Create a metric based on RUM data (count or distribution, with filters and group-by)",
  createRumMetricSchema.shape,
  wrapToolHandler(createRumMetric),
);

server.tool(
  "update-rum-metric",
  "Update a rum-based metric's filter, group-by, or percentile settings",
  updateRumMetricSchema.shape,
  wrapToolHandler(updateRumMetric),
);

server.tool(
  "delete-rum-metric",
  "Delete a rum-based metric by name",
  deleteRumMetricSchema.shape,
  wrapToolHandler(deleteRumMetric),
);

// --- RUM Retention Filters ---

server.tool(
  "list-rum-retention-filters",
  "List RUM retention filters for a RUM application",
  listRumRetentionFiltersSchema.shape,
  wrapToolHandler(listRumRetentionFilters),
);

server.tool(
  "get-rum-retention-filter",
  "Get a specific RUM retention filter by ID",
  getRumRetentionFilterSchema.shape,
  wrapToolHandler(getRumRetentionFilter),
);

server.tool(
  "create-rum-retention-filter",
  "Create a RUM retention filter with event type, sample rate, and query",
  createRumRetentionFilterSchema.shape,
  wrapToolHandler(createRumRetentionFilter),
);

server.tool(
  "update-rum-retention-filter",
  "Update a RUM retention filter's name, event type, sample rate, or query",
  updateRumRetentionFilterSchema.shape,
  wrapToolHandler(updateRumRetentionFilter),
);

server.tool(
  "delete-rum-retention-filter",
  "Delete a RUM retention filter by ID",
  deleteRumRetentionFilterSchema.shape,
  wrapToolHandler(deleteRumRetentionFilter),
);

// --- Teams ---

server.tool(
  "list-teams",
  "List Datadog teams with optional search filtering and pagination",
  listTeamsSchema.shape,
  wrapToolHandler(listTeams),
);

server.tool(
  "get-team",
  "Get detailed information about a specific Datadog team by ID",
  getTeamSchema.shape,
  wrapToolHandler(getTeam),
);

server.tool(
  "create-team",
  "Create a new Datadog team with name, handle, and description",
  createTeamSchema.shape,
  wrapToolHandler(createTeam),
);

server.tool(
  "update-team",
  "Update a Datadog team's name, handle, or description",
  updateTeamSchema.shape,
  wrapToolHandler(updateTeam),
);

server.tool(
  "delete-team",
  "Delete a Datadog team by ID",
  deleteTeamSchema.shape,
  wrapToolHandler(deleteTeam),
);

server.tool(
  "get-team-members",
  "Get members of a Datadog team with their roles",
  getTeamMembersSchema.shape,
  wrapToolHandler(getTeamMembers),
);

// --- Monitor Validation ---

server.tool(
  "validate-monitor",
  "Validate a monitor definition without creating it (check query syntax, thresholds, etc.)",
  validateMonitorSchema.shape,
  wrapToolHandler(validateMonitor),
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
