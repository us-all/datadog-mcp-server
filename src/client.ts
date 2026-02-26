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

// v2 APIs
export const logsApi = new v2.LogsApi(configuration);
export const incidentsApi = new v2.IncidentsApi(configuration);
export const spansApi = new v2.SpansApi(configuration);
export const rumApi = new v2.RUMApi(configuration);
export const downtimesApi = new v2.DowntimesApi(configuration);
export const securityMonitoringApi = new v2.SecurityMonitoringApi(configuration);
export const usersApi = new v2.UsersApi(configuration);
