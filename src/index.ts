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
import {
  listLogsMetricsSchema, listLogsMetrics, getLogsMetricSchema, getLogsMetric,
  createLogsMetricSchema, createLogsMetric, updateLogsMetricSchema, updateLogsMetric,
  deleteLogsMetricSchema, deleteLogsMetric,
} from "./tools/logs-metrics.js";
import {
  listSpansMetricsSchema, listSpansMetrics, getSpansMetricSchema, getSpansMetric,
  createSpansMetricSchema, createSpansMetric, updateSpansMetricSchema, updateSpansMetric,
  deleteSpansMetricSchema, deleteSpansMetric,
} from "./tools/spans-metrics.js";
import {
  listSloCorrectionsSchema, listSloCorrections, getSloCorrectionsSchema, getSloCorrection,
  createSloCorrectionSchema, createSloCorrection, updateSloCorrectionSchema, updateSloCorrection,
  deleteSloCorrectionSchema, deleteSloCorrection,
} from "./tools/slo-corrections.js";
import {
  listApmRetentionFiltersSchema, listApmRetentionFilters, getApmRetentionFilterSchema, getApmRetentionFilter,
  createApmRetentionFilterSchema, createApmRetentionFilter, updateApmRetentionFilterSchema, updateApmRetentionFilter,
  deleteApmRetentionFilterSchema, deleteApmRetentionFilter,
} from "./tools/apm-retention-filters.js";
import { validateMonitorSchema, validateMonitor } from "./tools/monitors.js";
import {
  listStatusPagesSchema, listStatusPages, getStatusPageSchema, getStatusPage,
  createStatusPageSchema, createStatusPage, updateStatusPageSchema, updateStatusPage,
  deleteStatusPageSchema, deleteStatusPage, publishStatusPageSchema, publishStatusPage,
  unpublishStatusPageSchema, unpublishStatusPage,
  listStatusPageComponentsSchema, listStatusPageComponents, getStatusPageComponentSchema, getStatusPageComponent,
  createStatusPageComponentSchema, createStatusPageComponent, updateStatusPageComponentSchema, updateStatusPageComponent,
  deleteStatusPageComponentSchema, deleteStatusPageComponent,
  listStatusPageDegradationsSchema, listStatusPageDegradations, getStatusPageDegradationSchema, getStatusPageDegradation,
  createStatusPageDegradationSchema, createStatusPageDegradation, updateStatusPageDegradationSchema, updateStatusPageDegradation,
  deleteStatusPageDegradationSchema, deleteStatusPageDegradation,
  listStatusPageMaintenancesSchema, listStatusPageMaintenances, getStatusPageMaintenanceSchema, getStatusPageMaintenance,
  createStatusPageMaintenanceSchema, createStatusPageMaintenance, updateStatusPageMaintenanceSchema, updateStatusPageMaintenance,
} from "./tools/status-pages.js";
import {
  listFleetAgentsSchema, listFleetAgents, getFleetAgentInfoSchema, getFleetAgentInfo,
  listFleetAgentVersionsSchema, listFleetAgentVersions,
  listFleetClustersSchema, listFleetClusters,
  listFleetTracersSchema, listFleetTracers,
  listFleetDeploymentsSchema, listFleetDeployments, getFleetDeploymentSchema, getFleetDeployment,
  createFleetDeploymentConfigureSchema, createFleetDeploymentConfigure,
  createFleetDeploymentUpgradeSchema, createFleetDeploymentUpgrade,
  cancelFleetDeploymentSchema, cancelFleetDeployment,
  listFleetSchedulesSchema, listFleetSchedules, getFleetScheduleSchema, getFleetSchedule,
  createFleetScheduleSchema, createFleetSchedule, updateFleetScheduleSchema, updateFleetSchedule,
  deleteFleetScheduleSchema, deleteFleetSchedule, triggerFleetScheduleSchema, triggerFleetSchedule,
  listFleetInstrumentedPodsSchema, listFleetInstrumentedPods,
} from "./tools/fleet.js";

import { registry, searchToolsSchema, searchTools, type Category } from "./tool-registry.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import {
  analyzeMonitorStateSchema, analyzeMonitorState,
  sloComplianceSnapshotSchema, sloComplianceSnapshot,
} from "./tools/aggregations.js";

validateConfig();

const server = new McpServer({
  name: "datadog",
  version: "1.8.0",
});

// --- Tool registration with category-based filtering (DD_TOOLS / DD_DISABLE) ---
let currentCategory: Category = "metrics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tool(name: string, description: string, schema: any, handler: any): void {
  registry.register(name, description, currentCategory);
  if (registry.isEnabled(currentCategory)) {
    server.tool(name, description, schema, handler);
  }
}

// --- Metrics ---
currentCategory = "metrics";

tool(
  "query-metrics",
  "Query time-series metric data from Datadog. Supports any Datadog metric query syntax (e.g., avg:system.cpu.user{host:myhost} by {env})",
  queryMetricsSchema.shape,
  wrapToolHandler(queryMetrics),
);

tool(
  "get-metrics",
  "Search for available Datadog metrics by name pattern",
  getMetricsSchema.shape,
  wrapToolHandler(getMetrics),
);

tool(
  "get-metric-metadata",
  "Get metadata for a specific Datadog metric (type, unit, description)",
  getMetricMetadataSchema.shape,
  wrapToolHandler(getMetricMetadata),
);

tool(
  "list-active-metrics",
  "List active metrics from a given time, optionally filtered by host or tag",
  listActiveMetricsSchema.shape,
  wrapToolHandler(listActiveMetrics),
);

tool(
  "list-metric-tags",
  "List tags for a specific metric (useful for understanding available groupings and filters)",
  listMetricTagsSchema.shape,
  wrapToolHandler(listMetricTags),
);

// --- Monitors ---
currentCategory = "monitors";

tool(
  "get-monitors",
  "List Datadog monitors with optional filtering by name, tags, or state",
  getMonitorsSchema.shape,
  wrapToolHandler(getMonitors),
);

tool(
  "get-monitor",
  "Get detailed information about a specific Datadog monitor by ID",
  getMonitorSchema.shape,
  wrapToolHandler(getMonitor),
);

tool(
  "create-monitor",
  "Create a new Datadog monitor (metric alert, log alert, etc.)",
  createMonitorSchema.shape,
  wrapToolHandler(createMonitor),
);

tool(
  "update-monitor",
  "Update an existing Datadog monitor's configuration",
  updateMonitorSchema.shape,
  wrapToolHandler(updateMonitor),
);

tool(
  "delete-monitor",
  "Delete a Datadog monitor by ID",
  deleteMonitorSchema.shape,
  wrapToolHandler(deleteMonitor),
);

tool(
  "mute-monitor",
  "Mute a Datadog monitor (silence notifications) for a scope and optional duration",
  muteMonitorSchema.shape,
  wrapToolHandler(muteMonitor),
);

// --- Dashboards ---
currentCategory = "dashboards";

tool(
  "get-dashboards",
  "List all Datadog dashboards",
  getDashboardsSchema.shape,
  wrapToolHandler(getDashboards),
);

tool(
  "get-dashboard",
  "Get a specific Datadog dashboard with all widgets and configuration",
  getDashboardSchema.shape,
  wrapToolHandler(getDashboard),
);

tool(
  "create-dashboard",
  "Create a new Datadog dashboard with widgets",
  createDashboardSchema.shape,
  wrapToolHandler(createDashboard),
);

tool(
  "update-dashboard",
  "Update an existing Datadog dashboard",
  updateDashboardSchema.shape,
  wrapToolHandler(updateDashboard),
);

tool(
  "delete-dashboard",
  "Delete a Datadog dashboard by ID",
  deleteDashboardSchema.shape,
  wrapToolHandler(deleteDashboard),
);

// --- Logs ---
currentCategory = "logs";

tool(
  "search-logs",
  "Search Datadog logs by query with time range filtering",
  searchLogsSchema.shape,
  wrapToolHandler(searchLogs),
);

tool(
  "aggregate-logs",
  "Aggregate Datadog logs with statistical computations (count, avg, sum, percentiles) and grouping",
  aggregateLogsSchema.shape,
  wrapToolHandler(aggregateLogs),
);

tool(
  "send-logs",
  "Send log entries to Datadog",
  sendLogsSchema.shape,
  wrapToolHandler(sendLogs),
);

// --- Events ---
currentCategory = "logs";

tool(
  "get-events",
  "Get Datadog events within a time range, optionally filtered by priority, source, or tags",
  getEventsSchema.shape,
  wrapToolHandler(getEvents),
);

tool(
  "post-event",
  "Post a custom event to Datadog (supports markdown, @mentions)",
  postEventSchema.shape,
  wrapToolHandler(postEvent),
);

// --- Incidents ---
currentCategory = "incidents";

tool(
  "get-incidents",
  "List Datadog incidents with pagination",
  getIncidentsSchema.shape,
  wrapToolHandler(getIncidents),
);

tool(
  "get-incident",
  "Get detailed information about a specific Datadog incident by ID",
  getIncidentSchema.shape,
  wrapToolHandler(getIncident),
);

tool(
  "search-incidents",
  "Search Datadog incidents by query (state, severity, title keywords)",
  searchIncidentsSchema.shape,
  wrapToolHandler(searchIncidents),
);

tool(
  "create-incident",
  "Create a new Datadog incident with title and customer impact info",
  createIncidentSchema.shape,
  wrapToolHandler(createIncident),
);

tool(
  "update-incident",
  "Update a Datadog incident's title, customer impact, or timestamps",
  updateIncidentSchema.shape,
  wrapToolHandler(updateIncident),
);

tool(
  "delete-incident",
  "Delete a Datadog incident by ID",
  deleteIncidentSchema.shape,
  wrapToolHandler(deleteIncident),
);

// --- APM ---
currentCategory = "apm";

tool(
  "search-spans",
  "Search APM spans/traces for performance analysis. Filter by service, resource, status, duration",
  searchSpansSchema.shape,
  wrapToolHandler(searchSpans),
);

// --- RUM ---
currentCategory = "rum";

tool(
  "search-rum-events",
  "Search Real User Monitoring events (sessions, views, errors, actions) from mobile/web apps",
  searchRumEventsSchema.shape,
  wrapToolHandler(searchRumEvents),
);

tool(
  "aggregate-rum",
  "Aggregate RUM data with statistical computations (count, avg, percentiles) and grouping by fields",
  aggregateRumSchema.shape,
  wrapToolHandler(aggregateRum),
);

tool(
  "list-rum-applications",
  "List all RUM applications in your Datadog organization",
  listRumApplicationsSchema.shape,
  wrapToolHandler(listRumApplications),
);

tool(
  "get-rum-application",
  "Get detailed information about a specific RUM application by ID",
  getRumApplicationSchema.shape,
  wrapToolHandler(getRumApplication),
);

tool(
  "create-rum-application",
  "Create a new RUM application (browser, ios, android, react-native, flutter, etc.)",
  createRumApplicationSchema.shape,
  wrapToolHandler(createRumApplication),
);

tool(
  "update-rum-application",
  "Update an existing RUM application's name or type",
  updateRumApplicationSchema.shape,
  wrapToolHandler(updateRumApplication),
);

tool(
  "delete-rum-application",
  "Delete a RUM application by ID",
  deleteRumApplicationSchema.shape,
  wrapToolHandler(deleteRumApplication),
);

// --- Hosts ---
currentCategory = "infra";

tool(
  "list-hosts",
  "List infrastructure hosts with filtering, sorting, and metadata",
  listHostsSchema.shape,
  wrapToolHandler(listHosts),
);

tool(
  "get-host-totals",
  "Get total number of active and up hosts",
  getHostTotalsSchema.shape,
  wrapToolHandler(getHostTotals),
);

// --- SLOs ---
currentCategory = "metrics";

tool(
  "list-slos",
  "List Service Level Objectives with optional filtering by query, tags, or IDs",
  listSlosSchema.shape,
  wrapToolHandler(listSlos),
);

tool(
  "get-slo",
  "Get detailed information about a specific SLO",
  getSloSchema.shape,
  wrapToolHandler(getSlo),
);

tool(
  "get-slo-history",
  "Get SLO performance history over a time range (status, error budget, compliance)",
  getSloHistorySchema.shape,
  wrapToolHandler(getSloHistory),
);

// --- Synthetics ---
currentCategory = "synthetics";

tool(
  "list-synthetics",
  "List all Synthetics monitoring tests (API, Browser, Mobile)",
  listSyntheticsSchema.shape,
  wrapToolHandler(listSynthetics),
);

tool(
  "get-synthetics-result",
  "Get latest results for a Synthetics API test by public ID",
  getSyntheticsResultSchema.shape,
  wrapToolHandler(getSyntheticsResult),
);

tool(
  "trigger-synthetics",
  "Trigger one or more Synthetics tests on demand",
  triggerSyntheticsSchema.shape,
  wrapToolHandler(triggerSynthetics),
);

tool(
  "create-synthetics-test",
  "Create a new Synthetics API test (HTTP, SSL, TCP, DNS, etc.)",
  createSyntheticsTestSchema.shape,
  wrapToolHandler(createSyntheticsTest),
);

tool(
  "update-synthetics-test",
  "Update an existing Synthetics API test",
  updateSyntheticsTestSchema.shape,
  wrapToolHandler(updateSyntheticsTest),
);

tool(
  "delete-synthetics-test",
  "Delete one or more Synthetics tests by public ID",
  deleteSyntheticsTestSchema.shape,
  wrapToolHandler(deleteSyntheticsTest),
);

// --- Downtimes ---
currentCategory = "monitors";

tool(
  "list-downtimes",
  "List scheduled downtimes (monitor mute periods)",
  listDowntimesSchema.shape,
  wrapToolHandler(listDowntimes),
);

tool(
  "create-downtime",
  "Create a downtime to mute monitors by scope, monitor ID, or monitor tags",
  createDowntimeSchema.shape,
  wrapToolHandler(createDowntime),
);

tool(
  "cancel-downtime",
  "Cancel an active downtime by ID",
  cancelDowntimeSchema.shape,
  wrapToolHandler(cancelDowntime),
);

// --- Security ---
currentCategory = "security";

tool(
  "search-security-signals",
  "Search Datadog security monitoring signals with query filtering",
  searchSecuritySignalsSchema.shape,
  wrapToolHandler(searchSecuritySignals),
);

tool(
  "get-security-signal",
  "Get detailed information about a specific security signal by ID",
  getSecuritySignalSchema.shape,
  wrapToolHandler(getSecuritySignal),
);

tool(
  "list-security-rules",
  "List security monitoring detection rules with optional search filtering",
  listSecurityRulesSchema.shape,
  wrapToolHandler(listSecurityRules),
);

tool(
  "get-security-rule",
  "Get detailed information about a specific security monitoring detection rule",
  getSecurityRuleSchema.shape,
  wrapToolHandler(getSecurityRule),
);

tool(
  "delete-security-rule",
  "Delete a security monitoring detection rule by ID",
  deleteSecurityRuleSchema.shape,
  wrapToolHandler(deleteSecurityRule),
);

tool(
  "list-security-suppressions",
  "List security monitoring suppression rules",
  listSecuritySuppressionsSchema.shape,
  wrapToolHandler(listSecuritySuppressions),
);

tool(
  "get-security-suppression",
  "Get detailed information about a specific security monitoring suppression rule",
  getSecuritySuppressionSchema.shape,
  wrapToolHandler(getSecuritySuppression),
);

tool(
  "create-security-suppression",
  "Create a security monitoring suppression rule to suppress signals matching a query",
  createSecuritySuppressionSchema.shape,
  wrapToolHandler(createSecuritySuppression),
);

tool(
  "delete-security-suppression",
  "Delete a security monitoring suppression rule by ID",
  deleteSecuritySuppressionSchema.shape,
  wrapToolHandler(deleteSecuritySuppression),
);

// --- Account & Usage ---
currentCategory = "account";

tool(
  "get-usage-summary",
  "Get Datadog account usage summary for a billing period (hosts, logs, APM, RUM, etc.)",
  getUsageSummarySchema.shape,
  wrapToolHandler(getUsageSummary),
);

tool(
  "list-users",
  "List Datadog organization users with filtering and pagination",
  listUsersSchema.shape,
  wrapToolHandler(listUsers),
);

// --- Notebooks ---
currentCategory = "dashboards";

tool(
  "list-notebooks",
  "List Datadog notebooks with search and filtering",
  listNotebooksSchema.shape,
  wrapToolHandler(listNotebooks),
);

tool(
  "get-notebook",
  "Get a specific Datadog notebook with all cells and content",
  getNotebookSchema.shape,
  wrapToolHandler(getNotebook),
);

// --- On-Call ---
currentCategory = "oncall";

tool(
  "get-team-oncall",
  "Get current on-call responders for a Datadog team",
  getTeamOnCallSchema.shape,
  wrapToolHandler(getTeamOnCall),
);

tool(
  "get-oncall-schedule",
  "Get an on-call schedule by ID with layers and team information",
  getOnCallScheduleSchema.shape,
  wrapToolHandler(getOnCallSchedule),
);

// --- Services (Software Catalog) ---
currentCategory = "apm";

tool(
  "list-services",
  "List services from Datadog Software Catalog with filtering",
  listServicesSchema.shape,
  wrapToolHandler(listServices),
);

tool(
  "get-service-definition",
  "Get a service definition from Datadog Software Catalog by entity ID",
  getServiceDefinitionSchema.shape,
  wrapToolHandler(getServiceDefinition),
);

// --- Containers ---
currentCategory = "infra";

tool(
  "list-containers",
  "List infrastructure containers with filtering and pagination",
  listContainersSchema.shape,
  wrapToolHandler(listContainers),
);

// --- Processes ---
currentCategory = "infra";

tool(
  "list-processes",
  "List running processes across infrastructure with search and tag filtering",
  listProcessesSchema.shape,
  wrapToolHandler(listProcesses),
);

// --- Audit Logs ---
currentCategory = "logs";

tool(
  "search-audit-logs",
  "Search Datadog audit logs for organization activity tracking (user actions, resource changes)",
  searchAuditLogsSchema.shape,
  wrapToolHandler(searchAuditLogs),
);

// --- Cases ---
currentCategory = "incidents";

tool(
  "list-cases",
  "List Datadog Case Management cases with search and filtering",
  listCasesSchema.shape,
  wrapToolHandler(listCases),
);

tool(
  "get-case",
  "Get detailed information about a specific case by ID",
  getCaseSchema.shape,
  wrapToolHandler(getCase),
);

tool(
  "create-case",
  "Create a new case in Datadog Case Management",
  createCaseSchema.shape,
  wrapToolHandler(createCase),
);

tool(
  "update-case-status",
  "Update the status of a Datadog case (OPEN, IN_PROGRESS, CLOSED)",
  updateCaseStatusSchema.shape,
  wrapToolHandler(updateCaseStatus),
);

// --- Error Tracking ---
currentCategory = "incidents";

tool(
  "list-error-tracking-issues",
  "List error tracking issues with search, filtering, and sorting",
  listErrorTrackingIssuesSchema.shape,
  wrapToolHandler(listErrorTrackingIssues),
);

tool(
  "get-error-tracking-issue",
  "Get detailed information about a specific error tracking issue",
  getErrorTrackingIssueSchema.shape,
  wrapToolHandler(getErrorTrackingIssue),
);

// --- CI/CD Visibility ---
currentCategory = "ci";

tool(
  "search-ci-pipelines",
  "Search CI/CD pipeline events (builds, deploys) with query filtering",
  searchCiPipelinesSchema.shape,
  wrapToolHandler(searchCiPipelines),
);

tool(
  "aggregate-ci-pipelines",
  "Aggregate CI/CD pipeline data with statistical computations and grouping",
  aggregateCiPipelinesSchema.shape,
  wrapToolHandler(aggregateCiPipelines),
);

tool(
  "search-ci-tests",
  "Search CI test events (unit tests, integration tests) with query filtering",
  searchCiTestsSchema.shape,
  wrapToolHandler(searchCiTests),
);

tool(
  "aggregate-ci-tests",
  "Aggregate CI test data with statistical computations and grouping",
  aggregateCiTestsSchema.shape,
  wrapToolHandler(aggregateCiTests),
);

// --- Network Devices ---
currentCategory = "infra";

tool(
  "list-network-devices",
  "List network devices (routers, switches, firewalls) monitored by Datadog NDM",
  listNetworkDevicesSchema.shape,
  wrapToolHandler(listNetworkDevices),
);

tool(
  "get-network-device",
  "Get detailed information about a specific network device by ID",
  getNetworkDeviceSchema.shape,
  wrapToolHandler(getNetworkDevice),
);

// --- DORA Metrics ---
currentCategory = "ci";

tool(
  "send-dora-deployment",
  "Send a DORA deployment event for tracking deployment frequency and lead time",
  sendDoraDeploymentSchema.shape,
  wrapToolHandler(sendDoraDeployment),
);

tool(
  "send-dora-incident",
  "Send a DORA incident event for tracking change failure rate and MTTR",
  sendDoraIncidentSchema.shape,
  wrapToolHandler(sendDoraIncident),
);

// --- RUM Metrics ---
currentCategory = "rum";

tool(
  "list-rum-metrics",
  "List all configured rum-based metrics with their definitions",
  listRumMetricsSchema.shape,
  wrapToolHandler(listRumMetrics),
);

tool(
  "get-rum-metric",
  "Get a specific rum-based metric definition by name",
  getRumMetricSchema.shape,
  wrapToolHandler(getRumMetric),
);

tool(
  "create-rum-metric",
  "Create a metric based on RUM data (count or distribution, with filters and group-by)",
  createRumMetricSchema.shape,
  wrapToolHandler(createRumMetric),
);

tool(
  "update-rum-metric",
  "Update a rum-based metric's filter, group-by, or percentile settings",
  updateRumMetricSchema.shape,
  wrapToolHandler(updateRumMetric),
);

tool(
  "delete-rum-metric",
  "Delete a rum-based metric by name",
  deleteRumMetricSchema.shape,
  wrapToolHandler(deleteRumMetric),
);

// --- RUM Retention Filters ---
currentCategory = "rum";

tool(
  "list-rum-retention-filters",
  "List RUM retention filters for a RUM application",
  listRumRetentionFiltersSchema.shape,
  wrapToolHandler(listRumRetentionFilters),
);

tool(
  "get-rum-retention-filter",
  "Get a specific RUM retention filter by ID",
  getRumRetentionFilterSchema.shape,
  wrapToolHandler(getRumRetentionFilter),
);

tool(
  "create-rum-retention-filter",
  "Create a RUM retention filter with event type, sample rate, and query",
  createRumRetentionFilterSchema.shape,
  wrapToolHandler(createRumRetentionFilter),
);

tool(
  "update-rum-retention-filter",
  "Update a RUM retention filter's name, event type, sample rate, or query",
  updateRumRetentionFilterSchema.shape,
  wrapToolHandler(updateRumRetentionFilter),
);

tool(
  "delete-rum-retention-filter",
  "Delete a RUM retention filter by ID",
  deleteRumRetentionFilterSchema.shape,
  wrapToolHandler(deleteRumRetentionFilter),
);

// --- Teams ---
currentCategory = "teams";

tool(
  "list-teams",
  "List Datadog teams with optional search filtering and pagination",
  listTeamsSchema.shape,
  wrapToolHandler(listTeams),
);

tool(
  "get-team",
  "Get detailed information about a specific Datadog team by ID",
  getTeamSchema.shape,
  wrapToolHandler(getTeam),
);

tool(
  "create-team",
  "Create a new Datadog team with name, handle, and description",
  createTeamSchema.shape,
  wrapToolHandler(createTeam),
);

tool(
  "update-team",
  "Update a Datadog team's name, handle, or description",
  updateTeamSchema.shape,
  wrapToolHandler(updateTeam),
);

tool(
  "delete-team",
  "Delete a Datadog team by ID",
  deleteTeamSchema.shape,
  wrapToolHandler(deleteTeam),
);

tool(
  "get-team-members",
  "Get members of a Datadog team with their roles",
  getTeamMembersSchema.shape,
  wrapToolHandler(getTeamMembers),
);

// --- Logs Metrics ---
currentCategory = "logs";

tool(
  "list-logs-metrics",
  "List all configured log-based metrics with their definitions",
  listLogsMetricsSchema.shape,
  wrapToolHandler(listLogsMetrics),
);

tool(
  "get-logs-metric",
  "Get a specific log-based metric definition by name",
  getLogsMetricSchema.shape,
  wrapToolHandler(getLogsMetric),
);

tool(
  "create-logs-metric",
  "Create a metric based on log data (count or distribution, with filters and group-by)",
  createLogsMetricSchema.shape,
  wrapToolHandler(createLogsMetric),
);

tool(
  "update-logs-metric",
  "Update a log-based metric's filter, group-by, or percentile settings",
  updateLogsMetricSchema.shape,
  wrapToolHandler(updateLogsMetric),
);

tool(
  "delete-logs-metric",
  "Delete a log-based metric by name",
  deleteLogsMetricSchema.shape,
  wrapToolHandler(deleteLogsMetric),
);

// --- Spans Metrics ---
currentCategory = "apm";

tool(
  "list-spans-metrics",
  "List all configured span-based metrics with their definitions",
  listSpansMetricsSchema.shape,
  wrapToolHandler(listSpansMetrics),
);

tool(
  "get-spans-metric",
  "Get a specific span-based metric definition by name",
  getSpansMetricSchema.shape,
  wrapToolHandler(getSpansMetric),
);

tool(
  "create-spans-metric",
  "Create a metric based on APM span data (count or distribution, with filters and group-by)",
  createSpansMetricSchema.shape,
  wrapToolHandler(createSpansMetric),
);

tool(
  "update-spans-metric",
  "Update a span-based metric's filter, group-by, or percentile settings",
  updateSpansMetricSchema.shape,
  wrapToolHandler(updateSpansMetric),
);

tool(
  "delete-spans-metric",
  "Delete a span-based metric by name",
  deleteSpansMetricSchema.shape,
  wrapToolHandler(deleteSpansMetric),
);

// --- SLO Corrections ---
currentCategory = "metrics";

tool(
  "list-slo-corrections",
  "List SLO status corrections (maintenance windows, deployments excluded from SLO calculations)",
  listSloCorrectionsSchema.shape,
  wrapToolHandler(listSloCorrections),
);

tool(
  "get-slo-correction",
  "Get detailed information about a specific SLO correction by ID",
  getSloCorrectionsSchema.shape,
  wrapToolHandler(getSloCorrection),
);

tool(
  "create-slo-correction",
  "Create an SLO correction to exclude a time period from SLO calculations (maintenance, deployments)",
  createSloCorrectionSchema.shape,
  wrapToolHandler(createSloCorrection),
);

tool(
  "update-slo-correction",
  "Update an existing SLO correction's category, time range, or description",
  updateSloCorrectionSchema.shape,
  wrapToolHandler(updateSloCorrection),
);

tool(
  "delete-slo-correction",
  "Delete an SLO correction by ID",
  deleteSloCorrectionSchema.shape,
  wrapToolHandler(deleteSloCorrection),
);

// --- APM Retention Filters ---
currentCategory = "apm";

tool(
  "list-apm-retention-filters",
  "List APM retention filters that control which traces are retained for search",
  listApmRetentionFiltersSchema.shape,
  wrapToolHandler(listApmRetentionFilters),
);

tool(
  "get-apm-retention-filter",
  "Get detailed information about a specific APM retention filter",
  getApmRetentionFilterSchema.shape,
  wrapToolHandler(getApmRetentionFilter),
);

tool(
  "create-apm-retention-filter",
  "Create an APM retention filter with query, sample rate, and enable/disable",
  createApmRetentionFilterSchema.shape,
  wrapToolHandler(createApmRetentionFilter),
);

tool(
  "update-apm-retention-filter",
  "Update an APM retention filter's name, query, rate, or enabled state",
  updateApmRetentionFilterSchema.shape,
  wrapToolHandler(updateApmRetentionFilter),
);

tool(
  "delete-apm-retention-filter",
  "Delete an APM retention filter by ID",
  deleteApmRetentionFilterSchema.shape,
  wrapToolHandler(deleteApmRetentionFilter),
);

// --- Monitor Validation ---
currentCategory = "monitors";

tool(
  "validate-monitor",
  "Validate a monitor definition without creating it (check query syntax, thresholds, etc.)",
  validateMonitorSchema.shape,
  wrapToolHandler(validateMonitor),
);

// --- Status Pages ---
currentCategory = "status-pages";

tool(
  "list-status-pages",
  "List all Datadog status pages for the organization",
  listStatusPagesSchema.shape,
  wrapToolHandler(listStatusPages),
);

tool(
  "get-status-page",
  "Get a specific status page by ID",
  getStatusPageSchema.shape,
  wrapToolHandler(getStatusPage),
);

tool(
  "create-status-page",
  "Create a new status page with name, domain prefix, and type (public/internal)",
  createStatusPageSchema.shape,
  wrapToolHandler(createStatusPage),
);

tool(
  "update-status-page",
  "Update a status page's name, domain prefix, or subscription settings",
  updateStatusPageSchema.shape,
  wrapToolHandler(updateStatusPage),
);

tool(
  "delete-status-page",
  "Delete a status page by ID",
  deleteStatusPageSchema.shape,
  wrapToolHandler(deleteStatusPage),
);

tool(
  "publish-status-page",
  "Publish a status page to make it accessible (public internet or internal org)",
  publishStatusPageSchema.shape,
  wrapToolHandler(publishStatusPage),
);

tool(
  "unpublish-status-page",
  "Unpublish a status page to remove public/internal access",
  unpublishStatusPageSchema.shape,
  wrapToolHandler(unpublishStatusPage),
);

// --- Status Page Components ---

tool(
  "list-status-page-components",
  "List all components for a status page",
  listStatusPageComponentsSchema.shape,
  wrapToolHandler(listStatusPageComponents),
);

tool(
  "get-status-page-component",
  "Get a specific component by ID from a status page",
  getStatusPageComponentSchema.shape,
  wrapToolHandler(getStatusPageComponent),
);

tool(
  "create-status-page-component",
  "Create a component or group on a status page",
  createStatusPageComponentSchema.shape,
  wrapToolHandler(createStatusPageComponent),
);

tool(
  "update-status-page-component",
  "Update a status page component's name or position",
  updateStatusPageComponentSchema.shape,
  wrapToolHandler(updateStatusPageComponent),
);

tool(
  "delete-status-page-component",
  "Delete a component from a status page",
  deleteStatusPageComponentSchema.shape,
  wrapToolHandler(deleteStatusPageComponent),
);

// --- Status Page Degradations ---

tool(
  "list-status-page-degradations",
  "List degradation incidents across status pages with optional status/page filtering",
  listStatusPageDegradationsSchema.shape,
  wrapToolHandler(listStatusPageDegradations),
);

tool(
  "get-status-page-degradation",
  "Get detailed information about a specific degradation incident",
  getStatusPageDegradationSchema.shape,
  wrapToolHandler(getStatusPageDegradation),
);

tool(
  "create-status-page-degradation",
  "Create a degradation incident on a status page with affected components",
  createStatusPageDegradationSchema.shape,
  wrapToolHandler(createStatusPageDegradation),
);

tool(
  "update-status-page-degradation",
  "Update a degradation incident's status, title, or affected components",
  updateStatusPageDegradationSchema.shape,
  wrapToolHandler(updateStatusPageDegradation),
);

tool(
  "delete-status-page-degradation",
  "Delete a degradation incident from a status page",
  deleteStatusPageDegradationSchema.shape,
  wrapToolHandler(deleteStatusPageDegradation),
);

// --- Status Page Maintenances ---

tool(
  "list-status-page-maintenances",
  "List maintenance windows across status pages with optional status/page filtering",
  listStatusPageMaintenancesSchema.shape,
  wrapToolHandler(listStatusPageMaintenances),
);

tool(
  "get-status-page-maintenance",
  "Get detailed information about a specific maintenance window",
  getStatusPageMaintenanceSchema.shape,
  wrapToolHandler(getStatusPageMaintenance),
);

tool(
  "create-status-page-maintenance",
  "Schedule a maintenance window on a status page with affected components",
  createStatusPageMaintenanceSchema.shape,
  wrapToolHandler(createStatusPageMaintenance),
);

tool(
  "update-status-page-maintenance",
  "Update a maintenance window's status, schedule, or affected components",
  updateStatusPageMaintenanceSchema.shape,
  wrapToolHandler(updateStatusPageMaintenance),
);

// --- Fleet Agents ---
currentCategory = "fleet";

tool(
  "list-fleet-agents",
  "List Datadog Agents in the fleet with filtering, sorting, and pagination",
  listFleetAgentsSchema.shape,
  wrapToolHandler(listFleetAgents),
);

tool(
  "get-fleet-agent-info",
  "Get detailed info about a specific Datadog Agent including integrations and config",
  getFleetAgentInfoSchema.shape,
  wrapToolHandler(getFleetAgentInfo),
);

tool(
  "list-fleet-agent-versions",
  "List all available Datadog Agent versions for deployment",
  listFleetAgentVersionsSchema.shape,
  wrapToolHandler(listFleetAgentVersions),
);

// --- Fleet Clusters ---

tool(
  "list-fleet-clusters",
  "List Kubernetes clusters with agent versions, node counts, and enabled products",
  listFleetClustersSchema.shape,
  wrapToolHandler(listFleetClusters),
);

// --- Fleet Tracers ---

tool(
  "list-fleet-tracers",
  "List fleet tracers (telemetry-derived service names) with filtering",
  listFleetTracersSchema.shape,
  wrapToolHandler(listFleetTracers),
);

// --- Fleet Deployments ---

tool(
  "list-fleet-deployments",
  "List fleet automation deployments with pagination",
  listFleetDeploymentsSchema.shape,
  wrapToolHandler(listFleetDeployments),
);

tool(
  "get-fleet-deployment",
  "Get detailed deployment info including per-host status and package versions",
  getFleetDeploymentSchema.shape,
  wrapToolHandler(getFleetDeployment),
);

tool(
  "create-fleet-deployment-configure",
  "Create a deployment to apply configuration changes to hosts matching a filter",
  createFleetDeploymentConfigureSchema.shape,
  wrapToolHandler(createFleetDeploymentConfigure),
);

tool(
  "create-fleet-deployment-upgrade",
  "Create a deployment to upgrade Datadog Agent packages on matching hosts",
  createFleetDeploymentUpgradeSchema.shape,
  wrapToolHandler(createFleetDeploymentUpgrade),
);

tool(
  "cancel-fleet-deployment",
  "Cancel an active fleet deployment and stop pending operations",
  cancelFleetDeploymentSchema.shape,
  wrapToolHandler(cancelFleetDeployment),
);

// --- Fleet Schedules ---

tool(
  "list-fleet-schedules",
  "List automated fleet upgrade schedules",
  listFleetSchedulesSchema.shape,
  wrapToolHandler(listFleetSchedules),
);

tool(
  "get-fleet-schedule",
  "Get detailed information about a specific fleet schedule",
  getFleetScheduleSchema.shape,
  wrapToolHandler(getFleetSchedule),
);

tool(
  "create-fleet-schedule",
  "Create an automated schedule for fleet agent upgrades with maintenance windows",
  createFleetScheduleSchema.shape,
  wrapToolHandler(createFleetSchedule),
);

tool(
  "update-fleet-schedule",
  "Update a fleet schedule's name, query, recurrence rule, or status",
  updateFleetScheduleSchema.shape,
  wrapToolHandler(updateFleetSchedule),
);

tool(
  "delete-fleet-schedule",
  "Delete a fleet upgrade schedule permanently",
  deleteFleetScheduleSchema.shape,
  wrapToolHandler(deleteFleetSchedule),
);

tool(
  "trigger-fleet-schedule",
  "Manually trigger a fleet schedule to immediately create a deployment",
  triggerFleetScheduleSchema.shape,
  wrapToolHandler(triggerFleetSchedule),
);

// --- Fleet Instrumented Pods ---

tool(
  "list-fleet-instrumented-pods",
  "List pods targeted for Single Step Instrumentation (SSI) in a Kubernetes cluster",
  listFleetInstrumentedPodsSchema.shape,
  wrapToolHandler(listFleetInstrumentedPods),
);

// --- Aggregation tools (round-trip elimination) ---
currentCategory = "monitors";

tool(
  "analyze-monitor-state",
  "Aggregated monitor view: config + current state + recent triggered events + active downtimes in one call. Replaces 3 round-trips of get-monitor + get-events + list-downtimes.",
  analyzeMonitorStateSchema.shape,
  wrapToolHandler(analyzeMonitorState),
);

tool(
  "slo-compliance-snapshot",
  "Aggregated SLO health: config + history-window SLI + active corrections + each linked monitor's current state in one call. Computes errorBudgetRemainingPct and status (compliant | at-risk | breached). Replaces 3-5 round-trips of get-slo + get-slo-history + list-slo-corrections + get-monitor (per linked monitor). Uses Promise.allSettled — partial failures populate caveats[] instead of crashing.",
  sloComplianceSnapshotSchema.shape,
  wrapToolHandler(sloComplianceSnapshot),
);

// --- Meta tools (always enabled) ---
currentCategory = "meta";

tool(
  "search-tools",
  "Discover available tools by natural language query. Returns matching tool names + descriptions across all 158+ tools. Use this first to navigate the surface efficiently — call this, then call the specific tool you need.",
  searchToolsSchema.shape,
  wrapToolHandler(searchTools),
);

// --- MCP Resources (dd:// URI scheme) ---
registerResources(server);

// --- MCP Prompts (workflow templates) ---
registerPrompts(server);

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
