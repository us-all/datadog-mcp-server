import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { rumApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";
import { extractFieldsDescription } from "./extract-fields.js";

const ef = z.string().optional().describe(extractFieldsDescription);

export const searchRumEventsSchema = z.object({
  query: z.string().describe("RUM search query. Example: service:my-app @type:error @session.type:user"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  limit: z.coerce.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
  extractFields: ef,
});

export async function searchRumEvents(params: z.infer<typeof searchRumEventsSchema>) {
  const response = await rumApi.listRUMEvents({
    filterQuery: params.query,
    filterFrom: new Date(params.from),
    filterTo: new Date(params.to),
    pageLimit: params.limit,
    sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
  });

  const events = response.data ?? [];
  return {
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      timestamp: e.attributes?.timestamp?.toISOString(),
      service: e.attributes?.service,
      attributes: e.attributes?.attributes,
      tags: e.attributes?.tags,
    })),
  };
}

export const aggregateRumSchema = z.object({
  query: z.string().describe("RUM filter query. Example: service:my-app @type:view"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  aggregation: z.enum(["count", "cardinality", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc98", "pc99"]).describe("Aggregation function. Example: count or avg"),
  metric: z.string().optional().describe("Metric field for non-count aggregations. Example: @view.loading_time or @action.loading_time"),
  groupBy: z.string().optional().describe("Field to group by. Example: @application.id or @view.url_path or @geo.country"),
});

export async function aggregateRum(params: z.infer<typeof aggregateRumSchema>) {
  const compute = new v2.RUMCompute();
  compute.aggregation = params.aggregation as v2.RUMAggregationFunction;
  if (params.metric) {
    compute.metric = params.metric;
  }

  const filter = new v2.RUMQueryFilter();
  filter.query = params.query;
  filter.from = params.from;
  filter.to = params.to;

  const body = new v2.RUMAggregateRequest();
  body.compute = [compute];
  body.filter = filter;

  if (params.groupBy) {
    const groupBy = new v2.RUMGroupBy();
    groupBy.facet = params.groupBy;
    groupBy.limit = 10;

    body.groupBy = [groupBy];
  }

  const response = await rumApi.aggregateRUMEvents({ body });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}

// --- RUM Applications ---

export const listRumApplicationsSchema = z.object({});

export async function listRumApplications() {
  const response = await rumApi.getRUMApplications();
  const apps = response.data ?? [];
  return {
    count: apps.length,
    applications: apps.map((app) => ({
      id: app.id,
      type: app.type,
      name: app.attributes?.name,
      applicationId: app.attributes?.applicationId,
      applicationType: app.attributes?.type,
      createdAt: app.attributes?.createdAt,
      createdByHandle: app.attributes?.createdByHandle,
      orgId: app.attributes?.orgId,
      isActive: app.attributes?.isActive,
    })),
  };
}

export const getRumApplicationSchema = z.object({
  id: z.string().describe("RUM application ID. Example: abc123def456"),
});

export async function getRumApplication(params: z.infer<typeof getRumApplicationSchema>) {
  const response = await rumApi.getRUMApplication({ id: params.id });
  const app = response.data;
  return {
    id: app?.id,
    type: app?.type,
    name: app?.attributes?.name,
    clientToken: app?.attributes?.clientToken,
    applicationId: app?.attributes?.applicationId,
    applicationType: app?.attributes?.type,
    createdAt: app?.attributes?.createdAt,
    updatedAt: app?.attributes?.updatedAt,
    createdByHandle: app?.attributes?.createdByHandle,
    orgId: app?.attributes?.orgId,
    isActive: app?.attributes?.isActive,
    hash: app?.attributes?.hash,
  };
}

export const createRumApplicationSchema = z.object({
  name: z.string().describe("Name of the RUM application. Example: My Web App"),
  type: z.enum(["browser", "ios", "android", "react-native", "flutter", "roku", "electron", "unity", "kotlin-multiplatform"])
    .optional().default("browser")
    .describe("Type of the RUM application. Default: browser"),
});

export async function createRumApplication(params: z.infer<typeof createRumApplicationSchema>) {
  assertWriteAllowed();

  const attrs = new v2.RUMApplicationCreateAttributes();
  attrs.name = params.name;
  attrs.type = params.type;

  const appData = new v2.RUMApplicationCreate();
  appData.attributes = attrs;
  appData.type = "rum_application_create";

  const body = new v2.RUMApplicationCreateRequest();
  body.data = appData;

  const response = await rumApi.createRUMApplication({ body });
  const app = response.data;
  return {
    id: app?.id,
    type: app?.type,
    name: app?.attributes?.name,
    clientToken: app?.attributes?.clientToken,
    applicationId: app?.attributes?.applicationId,
    applicationType: app?.attributes?.type,
    createdAt: app?.attributes?.createdAt,
  };
}

export const updateRumApplicationSchema = z.object({
  id: z.string().describe("RUM application ID to update"),
  name: z.string().optional().describe("New name for the RUM application"),
  type: z.enum(["browser", "ios", "android", "react-native", "flutter", "roku", "electron", "unity", "kotlin-multiplatform"])
    .optional().describe("New type for the RUM application"),
});

export async function updateRumApplication(params: z.infer<typeof updateRumApplicationSchema>) {
  assertWriteAllowed();

  const attrs = new v2.RUMApplicationUpdateAttributes();
  if (params.name) attrs.name = params.name;
  if (params.type) attrs.type = params.type;

  const appData = new v2.RUMApplicationUpdate();
  appData.id = params.id;
  appData.attributes = attrs;
  appData.type = "rum_application_update";

  const body = new v2.RUMApplicationUpdateRequest();
  body.data = appData;

  const response = await rumApi.updateRUMApplication({ id: params.id, body });
  const app = response.data;
  return {
    id: app?.id,
    type: app?.type,
    name: app?.attributes?.name,
    clientToken: app?.attributes?.clientToken,
    applicationId: app?.attributes?.applicationId,
    applicationType: app?.attributes?.type,
    updatedAt: app?.attributes?.updatedAt,
  };
}

export const deleteRumApplicationSchema = z.object({
  id: z.string().describe("RUM application ID to delete"),
});

export async function deleteRumApplication(params: z.infer<typeof deleteRumApplicationSchema>) {
  assertWriteAllowed();
  await rumApi.deleteRUMApplication({ id: params.id });
  return { deleted: true, id: params.id };
}
