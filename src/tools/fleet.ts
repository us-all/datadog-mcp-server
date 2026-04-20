import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { fleetAutomationApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// ============================================================
// Fleet Agents
// ============================================================

export const listFleetAgentsSchema = z.object({
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (max 100)"),
  filter: z.string().optional().describe("Filter string using Datadog query syntax"),
  tags: z.string().optional().describe("Comma-separated list of tags to filter agents"),
  sortAttribute: z.string().optional().describe("Attribute to sort by"),
  sortDescending: z.boolean().optional().describe("Sort descending if true"),
});

export async function listFleetAgents(params: z.infer<typeof listFleetAgentsSchema>) {
  const response = await fleetAutomationApi.listFleetAgents({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    filter: params.filter,
    tags: params.tags,
    sortAttribute: params.sortAttribute,
    sortDescending: params.sortDescending,
  });

  const agents = (response.data as any)?.attributes?.agents ?? [];
  return {
    count: agents.length,
    agents: agents.map(formatAgent),
  };
}

export const getFleetAgentInfoSchema = z.object({
  agentKey: z.string().describe("The unique identifier (agent key) for the Datadog Agent"),
});

export async function getFleetAgentInfo(params: z.infer<typeof getFleetAgentInfoSchema>) {
  const response = await fleetAutomationApi.getFleetAgentInfo({
    agentKey: params.agentKey,
  });

  const data = response.data;
  return {
    id: data?.id,
    agentInfos: data?.attributes?.agentInfos,
    integrations: data?.attributes?.integrations,
    detectedIntegrations: data?.attributes?.detectedIntegrations,
    configurationFiles: data?.attributes?.configurationFiles,
  };
}

export const listFleetAgentVersionsSchema = z.object({});

export async function listFleetAgentVersions(_params: z.infer<typeof listFleetAgentVersionsSchema>) {
  const response = await fleetAutomationApi.listFleetAgentVersions();

  const versions = response.data ?? [];
  return {
    count: versions.length,
    versions: versions.map((v: any) => ({
      id: v.id,
      version: v.attributes?.version,
    })),
  };
}

// ============================================================
// Fleet Clusters
// ============================================================

export const listFleetClustersSchema = z.object({
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (max 100)"),
  filter: z.string().optional().describe("Filter string for narrowing cluster results"),
  tags: z.string().optional().describe("Comma-separated list of tags to filter clusters"),
});

export async function listFleetClusters(params: z.infer<typeof listFleetClustersSchema>) {
  const response = await fleetAutomationApi.listFleetClusters({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    filter: params.filter,
    tags: params.tags,
  });

  const clusters = (response.data as any)?.attributes?.clusters ?? [];
  return {
    count: clusters.length,
    clusters: clusters.map(formatCluster),
  };
}

// ============================================================
// Fleet Tracers
// ============================================================

export const listFleetTracersSchema = z.object({
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (max 100)"),
  filter: z.string().optional().describe("Filter string for narrowing tracer results"),
});

export async function listFleetTracers(params: z.infer<typeof listFleetTracersSchema>) {
  const response = await fleetAutomationApi.listFleetTracers({
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    filter: params.filter,
  });

  const tracers = (response.data as any)?.attributes?.tracers ?? [];
  return {
    count: tracers.length,
    tracers: tracers.map(formatTracer),
  };
}

// ============================================================
// Fleet Deployments
// ============================================================

export const listFleetDeploymentsSchema = z.object({
  pageSize: z.coerce.number().optional().default(25).describe("Number of deployments per page (max 100)"),
  pageOffset: z.coerce.number().optional().describe("Index of first deployment to return"),
});

export async function listFleetDeployments(params: z.infer<typeof listFleetDeploymentsSchema>) {
  const response = await fleetAutomationApi.listFleetDeployments({
    pageSize: params.pageSize,
    pageOffset: params.pageOffset,
  });

  const deployments = response.data ?? [];
  return {
    count: deployments.length,
    deployments: deployments.map(formatDeployment),
  };
}

export const getFleetDeploymentSchema = z.object({
  deploymentId: z.string().describe("The unique identifier of the deployment"),
  limit: z.coerce.number().optional().default(50).describe("Max number of hosts per page (max 100)"),
  page: z.coerce.number().optional().default(0).describe("Page index for host pagination (0-based)"),
});

export async function getFleetDeployment(params: z.infer<typeof getFleetDeploymentSchema>) {
  const response = await fleetAutomationApi.getFleetDeployment({
    deploymentId: params.deploymentId,
    limit: params.limit,
    page: params.page,
  });

  return formatDeployment(response.data!);
}

export const createFleetDeploymentConfigureSchema = z.object({
  filterQuery: z.string().optional().describe("Datadog query to target specific hosts"),
  configOperations: z.array(z.object({
    filePath: z.string().describe("Configuration file path on target hosts"),
    fileOp: z.enum(["merge-patch", "delete"]).describe("Operation: merge-patch (merge config) or delete (remove file)"),
    patch: z.record(z.string(), z.any()).optional().describe("Patch data for merge-patch operations (JSON object)"),
  })).describe("List of configuration operations to apply"),
});

export async function createFleetDeploymentConfigure(params: z.infer<typeof createFleetDeploymentConfigureSchema>) {
  assertWriteAllowed();

  const attributes = new v2.FleetDeploymentConfigureAttributes();
  if (params.filterQuery !== undefined) attributes.filterQuery = params.filterQuery;
  attributes.configOperations = params.configOperations.map((op) => {
    const operation = new v2.FleetDeploymentOperation();
    operation.filePath = op.filePath;
    operation.fileOp = op.fileOp as v2.FleetDeploymentFileOp;
    if (op.patch) operation.patch = op.patch;
    return operation;
  });

  const data = new v2.FleetDeploymentConfigureCreate();
  data.type = "deployment" as v2.FleetDeploymentResourceType;
  data.attributes = attributes;

  const body = new v2.FleetDeploymentConfigureCreateRequest();
  body.data = data;

  const response = await fleetAutomationApi.createFleetDeploymentConfigure({ body });
  return formatDeployment(response.data!);
}

export const createFleetDeploymentUpgradeSchema = z.object({
  filterQuery: z.string().optional().describe("Datadog query to target specific hosts"),
  targetPackages: z.array(z.object({
    name: z.string().describe("Package name (e.g., 'datadog-agent')"),
    version: z.string().describe("Target version to upgrade to"),
  })).describe("Packages to upgrade with target versions"),
});

export async function createFleetDeploymentUpgrade(params: z.infer<typeof createFleetDeploymentUpgradeSchema>) {
  assertWriteAllowed();

  const attributes = new v2.FleetDeploymentPackageUpgradeAttributes();
  if (params.filterQuery !== undefined) attributes.filterQuery = params.filterQuery;
  attributes.targetPackages = params.targetPackages.map((pkg) => {
    const p = new v2.FleetDeploymentPackage();
    p.name = pkg.name;
    p.version = pkg.version;
    return p;
  });

  const data = new v2.FleetDeploymentPackageUpgradeCreate();
  data.type = "deployment" as v2.FleetDeploymentResourceType;
  data.attributes = attributes;

  const body = new v2.FleetDeploymentPackageUpgradeCreateRequest();
  body.data = data;

  const response = await fleetAutomationApi.createFleetDeploymentUpgrade({ body });
  return formatDeployment(response.data!);
}

export const cancelFleetDeploymentSchema = z.object({
  deploymentId: z.string().describe("The deployment ID to cancel"),
});

export async function cancelFleetDeployment(params: z.infer<typeof cancelFleetDeploymentSchema>) {
  assertWriteAllowed();
  await fleetAutomationApi.cancelFleetDeployment({ deploymentId: params.deploymentId });
  return { cancelled: true, deploymentId: params.deploymentId };
}

// ============================================================
// Fleet Schedules
// ============================================================

export const listFleetSchedulesSchema = z.object({});

export async function listFleetSchedules(_params: z.infer<typeof listFleetSchedulesSchema>) {
  const response = await fleetAutomationApi.listFleetSchedules();

  const schedules = response.data ?? [];
  return {
    count: schedules.length,
    schedules: schedules.map(formatSchedule),
  };
}

export const getFleetScheduleSchema = z.object({
  id: z.string().describe("The schedule ID to retrieve"),
});

export async function getFleetSchedule(params: z.infer<typeof getFleetScheduleSchema>) {
  const response = await fleetAutomationApi.getFleetSchedule({ id: params.id });
  return formatSchedule(response.data!);
}

export const createFleetScheduleSchema = z.object({
  name: z.string().describe("Name of the schedule"),
  query: z.string().describe("Filter query to select target hosts"),
  rule: z.object({
    daysOfWeek: z.array(z.string()).describe("Days of week (e.g., ['monday', 'wednesday'])"),
    maintenanceWindowDuration: z.coerce.number().describe("Duration of maintenance window in minutes"),
    startMaintenanceWindow: z.string().describe("Start time of maintenance window (HH:MM format)"),
    timezone: z.string().describe("Timezone (e.g., 'America/New_York')"),
  }).describe("Recurrence rule for the schedule"),
  status: z.enum(["active", "inactive"]).optional().describe("Schedule status"),
  versionToLatest: z.coerce.number().optional().describe("Number of versions behind latest to target (0 = latest)"),
});

export async function createFleetSchedule(params: z.infer<typeof createFleetScheduleSchema>) {
  assertWriteAllowed();

  const rule = new v2.FleetScheduleRecurrenceRule();
  rule.daysOfWeek = params.rule.daysOfWeek;
  rule.maintenanceWindowDuration = params.rule.maintenanceWindowDuration;
  rule.startMaintenanceWindow = params.rule.startMaintenanceWindow;
  rule.timezone = params.rule.timezone;

  const attributes = new v2.FleetScheduleCreateAttributes();
  attributes.name = params.name;
  attributes.query = params.query;
  attributes.rule = rule;
  if (params.status !== undefined) attributes.status = params.status as v2.FleetScheduleStatus;
  if (params.versionToLatest !== undefined) attributes.versionToLatest = params.versionToLatest;

  const data = new v2.FleetScheduleCreate();
  data.type = "schedule" as v2.FleetScheduleResourceType;
  data.attributes = attributes;

  const body = new v2.FleetScheduleCreateRequest();
  body.data = data;

  const response = await fleetAutomationApi.createFleetSchedule({ body });
  return formatSchedule(response.data!);
}

export const updateFleetScheduleSchema = z.object({
  id: z.string().describe("The schedule ID to update"),
  name: z.string().optional().describe("Updated schedule name"),
  query: z.string().optional().describe("Updated filter query"),
  rule: z.object({
    daysOfWeek: z.array(z.string()).describe("Days of week"),
    maintenanceWindowDuration: z.coerce.number().describe("Duration in minutes"),
    startMaintenanceWindow: z.string().describe("Start time (HH:MM)"),
    timezone: z.string().describe("Timezone"),
  }).optional().describe("Updated recurrence rule"),
  status: z.enum(["active", "inactive"]).optional().describe("Updated status"),
  versionToLatest: z.coerce.number().optional().describe("Updated version offset"),
});

export async function updateFleetSchedule(params: z.infer<typeof updateFleetScheduleSchema>) {
  assertWriteAllowed();

  const attributes = new v2.FleetSchedulePatchAttributes();
  if (params.name !== undefined) attributes.name = params.name;
  if (params.query !== undefined) attributes.query = params.query;
  if (params.status !== undefined) attributes.status = params.status as v2.FleetScheduleStatus;
  if (params.versionToLatest !== undefined) attributes.versionToLatest = params.versionToLatest;
  if (params.rule !== undefined) {
    const rule = new v2.FleetScheduleRecurrenceRule();
    rule.daysOfWeek = params.rule.daysOfWeek;
    rule.maintenanceWindowDuration = params.rule.maintenanceWindowDuration;
    rule.startMaintenanceWindow = params.rule.startMaintenanceWindow;
    rule.timezone = params.rule.timezone;
    attributes.rule = rule;
  }

  const data = new v2.FleetSchedulePatch();
  data.type = "schedule" as v2.FleetScheduleResourceType;
  data.attributes = attributes;

  const body = new v2.FleetSchedulePatchRequest();
  body.data = data;

  const response = await fleetAutomationApi.updateFleetSchedule({ id: params.id, body });
  return formatSchedule(response.data!);
}

export const deleteFleetScheduleSchema = z.object({
  id: z.string().describe("The schedule ID to delete"),
});

export async function deleteFleetSchedule(params: z.infer<typeof deleteFleetScheduleSchema>) {
  assertWriteAllowed();
  await fleetAutomationApi.deleteFleetSchedule({ id: params.id });
  return { deleted: true, id: params.id };
}

export const triggerFleetScheduleSchema = z.object({
  id: z.string().describe("The schedule ID to trigger manually"),
});

export async function triggerFleetSchedule(params: z.infer<typeof triggerFleetScheduleSchema>) {
  assertWriteAllowed();
  const response = await fleetAutomationApi.triggerFleetSchedule({ id: params.id });
  return formatDeployment(response.data!);
}

// ============================================================
// Fleet Instrumented Pods
// ============================================================

export const listFleetInstrumentedPodsSchema = z.object({
  clusterName: z.string().describe("The Kubernetes cluster name"),
});

export async function listFleetInstrumentedPods(params: z.infer<typeof listFleetInstrumentedPodsSchema>) {
  const response = await fleetAutomationApi.listFleetInstrumentedPods({
    clusterName: params.clusterName,
  });

  const groups = (response.data as any)?.attributes?.groups ?? [];
  return {
    count: groups.length,
    groups: groups.map((g: any) => ({
      namespace: g.namespace,
      kubeOwnerrefKind: g.kubeOwnerrefKind,
      kubeOwnerrefName: g.kubeOwnerrefName,
      podCount: g.podCount,
      podNames: g.podNames,
      appliedTargetName: g.appliedTargetName,
      libInjectionAnnotations: g.libInjectionAnnotations,
    })),
  };
}

// ============================================================
// Helpers
// ============================================================

function formatAgent(agent: any) {
  return {
    hostname: agent.hostname,
    agentVersion: agent.agentVersion,
    os: agent.os,
    cloudProvider: agent.cloudProvider,
    clusterName: agent.clusterName,
    enabledProducts: agent.enabledProducts,
    envs: agent.envs,
    services: agent.services,
    team: agent.team,
    remoteConfigStatus: agent.remoteConfigStatus,
    datadogAgentKey: agent.datadogAgentKey,
    firstSeenAt: agent.firstSeenAt,
    lastRestartAt: agent.lastRestartAt,
    tags: agent.tags,
  };
}

function formatCluster(cluster: any) {
  return {
    clusterName: cluster.clusterName,
    nodeCount: cluster.nodeCount,
    agentVersions: cluster.agentVersions,
    cloudProviders: cluster.cloudProviders,
    enabledProducts: cluster.enabledProducts,
    envs: cluster.envs,
    services: cluster.services,
    teams: cluster.teams,
    firstSeenAt: cluster.firstSeenAt,
    nodeCountByStatus: cluster.nodeCountByStatus,
    podCountByState: cluster.podCountByState,
  };
}

function formatTracer(tracer: any) {
  return {
    service: tracer.service,
    hostname: tracer.hostname,
    env: tracer.env,
    language: tracer.language,
    languageVersion: tracer.languageVersion,
    tracerVersion: tracer.tracerVersion,
    serviceVersion: tracer.serviceVersion,
    remoteConfigStatus: tracer.remoteConfigStatus,
  };
}

function formatDeployment(deployment: any) {
  return {
    id: deployment.id,
    filterQuery: deployment.attributes?.filterQuery,
    highLevelStatus: deployment.attributes?.highLevelStatus,
    totalHosts: deployment.attributes?.totalHosts,
    estimatedEndTimeUnix: deployment.attributes?.estimatedEndTimeUnix,
    configOperations: deployment.attributes?.configOperations,
    packages: deployment.attributes?.packages,
    hosts: deployment.attributes?.hosts?.map((h: any) => ({
      hostname: h.hostname,
      status: h.status,
      error: h.error,
      versions: h.versions,
    })),
  };
}

function formatSchedule(schedule: any) {
  return {
    id: schedule.id,
    name: schedule.attributes?.name,
    query: schedule.attributes?.query,
    status: schedule.attributes?.status,
    rule: schedule.attributes?.rule,
    versionToLatest: schedule.attributes?.versionToLatest,
    createdBy: schedule.attributes?.createdBy,
    updatedBy: schedule.attributes?.updatedBy,
    createdAtUnix: schedule.attributes?.createdAtUnix,
    updatedAtUnix: schedule.attributes?.updatedAtUnix,
  };
}
