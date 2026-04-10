import { client, v1, v2 } from "@datadog/datadog-api-client";
import { config } from "./config.js";

const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: config.apiKey,
    appKeyAuth: config.appKey,
  },
});

configuration.setServerVariables({
  site: config.site,
});

// Enable unstable operations
configuration.unstableOperations["v2.listIncidents"] = true;
configuration.unstableOperations["v2.getIncident"] = true;
configuration.unstableOperations["v2.searchIncidents"] = true;
configuration.unstableOperations["v2.createIncident"] = true;
configuration.unstableOperations["v2.updateIncident"] = true;
configuration.unstableOperations["v2.deleteIncident"] = true;

// v1 APIs
export const metricsApi = new v1.MetricsApi(configuration);
export const monitorsApi = new v1.MonitorsApi(configuration);
export const dashboardsApi = new v1.DashboardsApi(configuration);
export const eventsApi = new v1.EventsApi(configuration);
export const hostsApi = new v1.HostsApi(configuration);
export const slosApi = new v1.ServiceLevelObjectivesApi(configuration);
export const syntheticsApi = new v1.SyntheticsApi(configuration);
export const logsV1Api = new v1.LogsApi(configuration);
export const usageMeteringApi = new v1.UsageMeteringApi(configuration);
export const notebooksApi = new v1.NotebooksApi(configuration);
export const sloCorrectionsApi = new v1.ServiceLevelObjectiveCorrectionsApi(configuration);

// v2 APIs
export const metricsV2Api = new v2.MetricsApi(configuration);
export const logsApi = new v2.LogsApi(configuration);
export const incidentsApi = new v2.IncidentsApi(configuration);
export const spansApi = new v2.SpansApi(configuration);
export const rumApi = new v2.RUMApi(configuration);
export const downtimesApi = new v2.DowntimesApi(configuration);
export const securityMonitoringApi = new v2.SecurityMonitoringApi(configuration);
export const usersApi = new v2.UsersApi(configuration);
export const onCallApi = new v2.OnCallApi(configuration);

// v2 APIs — added in v1.1.0
export const softwareCatalogApi = new v2.SoftwareCatalogApi(configuration);
export const containersApi = new v2.ContainersApi(configuration);
export const processesApi = new v2.ProcessesApi(configuration);
export const auditApi = new v2.AuditApi(configuration);
export const caseManagementApi = new v2.CaseManagementApi(configuration);
export const errorTrackingApi = new v2.ErrorTrackingApi(configuration);
export const ciPipelinesApi = new v2.CIVisibilityPipelinesApi(configuration);
export const ciTestsApi = new v2.CIVisibilityTestsApi(configuration);
export const networkDevicesApi = new v2.NetworkDeviceMonitoringApi(configuration);
export const doraMetricsApi = new v2.DORAMetricsApi(configuration);
export const rumMetricsApi = new v2.RumMetricsApi(configuration);
export const rumRetentionFiltersApi = new v2.RumRetentionFiltersApi(configuration);
export const teamsApi = new v2.TeamsApi(configuration);
export const logsMetricsApi = new v2.LogsMetricsApi(configuration);
export const spansMetricsApi = new v2.SpansMetricsApi(configuration);
export const apmRetentionFiltersApi = new v2.APMRetentionFiltersApi(configuration);
