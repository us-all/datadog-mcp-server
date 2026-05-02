import { z } from "zod/v4";
import { monitorsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";
import { applyExtractFields, extractFieldsDescription } from "./extract-fields.js";

const ef = z.string().optional().describe(extractFieldsDescription);

// Default projection for fat read tools when caller didn't pass extractFields.
// Matches the formatter output shape (camelCase, not raw API field names).
const DEFAULT_MONITOR_FIELDS = "id,name,type,overallState,tags,query";

export const getMonitorsSchema = z.object({
  name: z.string().optional().describe("Filter monitors by name substring"),
  tags: z.string().optional().describe("Comma-separated tags. Example: env:prod,team:backend"),
  monitorTags: z.string().optional().describe("Comma-separated service/custom tags"),
  groupStates: z.string().optional().describe("Filter by group states: all, alert, warn, no data"),
  pageSize: z.coerce.number().optional().default(50).describe("Number of results per page (default 50)"),
  page: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  extractFields: ef,
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

  const result = response.map((m) => ({
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

  // If caller passed extractFields, return raw — wrapToolHandler projects.
  // Otherwise apply default projection to keep response lightweight.
  if (params.extractFields) return result;
  return applyExtractFields(result, DEFAULT_MONITOR_FIELDS);
}

export const getMonitorSchema = z.object({
  monitorId: z.coerce.number().describe("Monitor ID"),
  groupStates: z.string().optional().describe("Filter by group states (e.g. alert,warn)"),
  extractFields: ef,
});

export async function getMonitor(params: z.infer<typeof getMonitorSchema>) {
  const response = await monitorsApi.getMonitor({
    monitorId: params.monitorId,
    groupStates: params.groupStates,
  });

  const result = {
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

  // If caller passed extractFields, return raw — wrapToolHandler projects.
  // Otherwise apply default projection to drop heavy fields (options, state).
  if (params.extractFields) return result;
  return applyExtractFields(result, DEFAULT_MONITOR_FIELDS);
}

export const createMonitorSchema = z.object({
  name: z.string().describe("Monitor name"),
  type: z.string().describe("Monitor type (e.g. metric alert, log alert, query alert, service check)"),
  query: z.string().describe("Monitor query. Example: avg(last_5m):avg:system.cpu.user{env:prod} > 90"),
  message: z.string().optional().describe("Notification message (supports @mentions)"),
  tags: z.array(z.string()).optional().describe("Tags for the monitor"),
  priority: z.coerce.number().optional().describe("Priority 1-5 (1=highest)"),
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
  monitorId: z.coerce.number().describe("Monitor ID to update"),
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
  monitorId: z.coerce.number().describe("Monitor ID to delete"),
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
  type: z.string().describe("Monitor type (e.g. metric alert, log alert, query alert)"),
  query: z.string().describe("Monitor query to validate"),
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
  monitorId: z.coerce.number().describe("Monitor ID to mute"),
  scope: z.string().optional().describe("Scope to mute (e.g. host:myhost or env:staging)"),
  end: z.coerce.number().optional().describe("Unix epoch seconds when mute should end"),
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
