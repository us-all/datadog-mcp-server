import { z } from "zod/v4";
import { monitorsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const getMonitorsSchema = z.object({
  name: z.string().optional().describe("Filter monitors by name substring. Example: CPU Alert"),
  tags: z.string().optional().describe("Comma-separated tags to filter. Example: env:prod,team:backend"),
  monitorTags: z.string().optional().describe("Comma-separated service/custom tags. Example: service:web-app"),
  groupStates: z.string().optional().describe("Filter by group states: all, alert, warn, no data. Example: alert"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (default 50)"),
  page: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function getMonitors(params: z.infer<typeof getMonitorsSchema>) {
  const response = await monitorsApi.listMonitors({
    name: params.name,
    tags: params.tags,
    monitorTags: params.monitorTags,
    groupStates: params.groupStates,
    pageSize: params.pageSize,
    page: params.page,
  });

  return response.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    query: m.query,
    message: m.message,
    overallState: m.overallState,
    tags: m.tags,
    created: m.created?.toISOString(),
    modified: m.modified?.toISOString(),
    creator: m.creator?.email,
  }));
}

export const getMonitorSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID. Example: 12345678"),
  groupStates: z.string().optional().describe("Filter by group states. Example: alert,warn"),
});

export async function getMonitor(params: z.infer<typeof getMonitorSchema>) {
  const response = await monitorsApi.getMonitor({
    monitorId: params.monitorId,
    groupStates: params.groupStates,
  });

  return {
    id: response.id,
    name: response.name,
    type: response.type,
    query: response.query,
    message: response.message,
    overallState: response.overallState,
    tags: response.tags,
    options: response.options,
    created: response.created?.toISOString(),
    modified: response.modified?.toISOString(),
    creator: response.creator?.email,
    state: response.state,
  };
}

export const createMonitorSchema = z.object({
  name: z.string().describe("Monitor name. Example: High CPU on production"),
  type: z.string().describe("Monitor type. Example: metric alert, log alert, query alert, service check"),
  query: z.string().describe("Monitor query string. Example: avg(last_5m):avg:system.cpu.user{env:prod} > 90"),
  message: z.string().optional().describe("Notification message (supports @mentions). Example: CPU is high @slack-alerts"),
  tags: z.array(z.string()).optional().describe("Tags for the monitor. Example: [\"env:prod\", \"team:infra\"]"),
  priority: z.coerce.number().optional().describe("Priority 1-5 (1=highest). Example: 2"),
  options: z.record(z.string(), z.any()).optional().describe("Advanced monitor options (thresholds, etc.)"),
});

export async function createMonitor(params: z.infer<typeof createMonitorSchema>) {
  assertWriteAllowed();
  const response = await monitorsApi.createMonitor({
    body: {
      name: params.name,
      type: params.type as any,
      query: params.query,
      message: params.message,
      tags: params.tags,
      priority: params.priority != null ? (params.priority as any) : undefined,
      options: params.options as any,
    },
  });

  return {
    id: response.id,
    name: response.name,
    type: response.type,
    query: response.query,
    overallState: response.overallState,
    created: response.created?.toISOString(),
  };
}

export const updateMonitorSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID to update. Example: 12345678"),
  name: z.string().optional().describe("New monitor name"),
  query: z.string().optional().describe("New query string"),
  message: z.string().optional().describe("New notification message"),
  tags: z.array(z.string()).optional().describe("New tags"),
  priority: z.coerce.number().optional().describe("New priority 1-5"),
  options: z.record(z.string(), z.any()).optional().describe("New monitor options"),
});

export async function updateMonitor(params: z.infer<typeof updateMonitorSchema>) {
  assertWriteAllowed();
  const { monitorId, ...body } = params;
  const response = await monitorsApi.updateMonitor({
    monitorId,
    body: {
      name: body.name,
      query: body.query,
      message: body.message,
      tags: body.tags,
      priority: body.priority != null ? (body.priority as any) : undefined,
      options: body.options as any,
    },
  });

  return {
    id: response.id,
    name: response.name,
    type: response.type,
    query: response.query,
    overallState: response.overallState,
    modified: response.modified?.toISOString(),
  };
}

export const deleteMonitorSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID to delete. Example: 12345678"),
  force: z.boolean().optional().describe("Force delete even if referenced by other resources"),
});

export async function deleteMonitor(params: z.infer<typeof deleteMonitorSchema>) {
  assertWriteAllowed();
  const response = await monitorsApi.deleteMonitor({
    monitorId: params.monitorId,
    force: params.force ? "true" : undefined,
  });

  return {
    deletedMonitorId: response.deletedMonitorId,
  };
}

export const validateMonitorSchema = z.object({
  name: z.string().describe("Monitor name to validate"),
  type: z.string().describe("Monitor type. Example: metric alert, log alert, query alert"),
  query: z.string().describe("Monitor query string to validate. Example: avg(last_5m):avg:system.cpu.user{env:prod} > 90"),
  message: z.string().optional().describe("Notification message"),
  tags: z.array(z.string()).optional().describe("Tags for the monitor"),
  priority: z.coerce.number().optional().describe("Priority 1-5"),
  options: z.record(z.string(), z.any()).optional().describe("Monitor options (thresholds, etc.)"),
});

export async function validateMonitor(params: z.infer<typeof validateMonitorSchema>) {
  const response = await monitorsApi.validateMonitor({
    body: {
      name: params.name,
      type: params.type as any,
      query: params.query,
      message: params.message,
      tags: params.tags,
      priority: params.priority != null ? (params.priority as any) : undefined,
      options: params.options as any,
    },
  });

  return {
    valid: true,
    id: response.id,
    name: response.name,
    type: response.type,
    query: response.query,
  };
}

export const muteMonitorSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID to mute. Example: 12345678"),
  scope: z.string().optional().describe("Scope to mute. Example: host:myhost or env:staging"),
  end: z.coerce.number().optional().describe("Unix epoch seconds when mute should end. Example: 1740003600"),
});

export async function muteMonitor(params: z.infer<typeof muteMonitorSchema>) {
  assertWriteAllowed();
  const response = await monitorsApi.updateMonitor({
    monitorId: params.monitorId,
    body: {
      options: {
        silenced: { [params.scope ?? "*"]: params.end ?? null } as any,
      } as any,
    },
  });

  return {
    id: response.id,
    name: response.name,
    overallState: response.overallState,
    options: response.options,
  };
}
