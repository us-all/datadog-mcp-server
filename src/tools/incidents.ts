import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { incidentsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";
import { extractFieldsDescription } from "./extract-fields.js";

const ef = z.string().optional().describe(extractFieldsDescription);

// --- List Incidents ---

export const getIncidentsSchema = z.object({
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageOffset: z.coerce.number().optional().default(0).describe("Pagination offset"),
  extractFields: ef,
});

export async function getIncidents(params: z.infer<typeof getIncidentsSchema>) {
  const response = await incidentsApi.listIncidents({
    pageSize: params.pageSize,
    pageOffset: params.pageOffset,
  });

  const incidents = response.data ?? [];
  return {
    count: incidents.length,
    incidents: incidents.map(formatIncident),
  };
}

// --- Get Incident ---

export const getIncidentSchema = z.object({
  incidentId: z.string().describe("The incident ID to retrieve"),
});

export async function getIncident(params: z.infer<typeof getIncidentSchema>) {
  const response = await incidentsApi.getIncident({
    incidentId: params.incidentId,
  });

  return formatIncident(response.data!);
}

// --- Search Incidents ---

export const searchIncidentsSchema = z.object({
  query: z.string().describe("Search query for incidents. Example: state:active, severity:SEV-1, title keywords"),
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageOffset: z.coerce.number().optional().default(0).describe("Pagination offset"),
  sort: z.enum(["created", "-created"]).optional().default("-created").describe("Sort order: -created (newest first) or created (oldest first)"),
});

export async function searchIncidents(params: z.infer<typeof searchIncidentsSchema>) {
  const response = await incidentsApi.searchIncidents({
    query: params.query,
    pageSize: params.pageSize,
    pageOffset: params.pageOffset,
    sort: params.sort as v2.IncidentSearchSortOrder,
  });

  const incidents = response.data?.attributes?.incidents ?? [];
  return {
    count: incidents.length,
    totalCount: response.data?.attributes?.total ?? 0,
    incidents: incidents.map((inc) => ({
      id: inc.data?.id,
      title: inc.data?.attributes?.title,
      status: inc.data?.attributes?.state,
      severity: inc.data?.attributes?.severity,
      created: inc.data?.attributes?.created?.toISOString(),
      modified: inc.data?.attributes?.modified?.toISOString(),
      resolved: inc.data?.attributes?.resolved?.toISOString(),
      customerImpactScope: inc.data?.attributes?.customerImpactScope,
      customerImpacted: inc.data?.attributes?.customerImpacted,
    })),
  };
}

// --- Create Incident ---

export const createIncidentSchema = z.object({
  title: z.string().describe("The title of the incident, summarizing what happened"),
  customerImpacted: z.boolean().describe("Whether the incident caused customer impact"),
  customerImpactScope: z.string().optional().describe("Summary of the impact customers experienced (required if customerImpacted is true)"),
});

export async function createIncident(params: z.infer<typeof createIncidentSchema>) {
  assertWriteAllowed();

  const attributes = new v2.IncidentCreateAttributes();
  attributes.title = params.title;
  attributes.customerImpacted = params.customerImpacted;
  if (params.customerImpactScope) {
    attributes.customerImpactScope = params.customerImpactScope;
  }

  const data = new v2.IncidentCreateData();
  data.type = "incidents" as v2.IncidentType;
  data.attributes = attributes;

  const body = new v2.IncidentCreateRequest();
  body.data = data;

  const response = await incidentsApi.createIncident({ body });

  return formatIncident(response.data!);
}

// --- Update Incident ---

export const updateIncidentSchema = z.object({
  incidentId: z.string().describe("The incident ID to update"),
  title: z.string().optional().describe("Updated title of the incident"),
  customerImpacted: z.boolean().optional().describe("Whether the incident caused customer impact"),
  customerImpactScope: z.string().optional().describe("Updated summary of customer impact"),
  customerImpactStart: z.string().optional().describe("ISO 8601 timestamp when customers began being impacted"),
  customerImpactEnd: z.string().optional().describe("ISO 8601 timestamp when customers were no longer impacted"),
  detected: z.string().optional().describe("ISO 8601 timestamp when the incident was detected"),
});

export async function updateIncident(params: z.infer<typeof updateIncidentSchema>) {
  assertWriteAllowed();

  const attributes = new v2.IncidentUpdateAttributes();
  if (params.title !== undefined) attributes.title = params.title;
  if (params.customerImpacted !== undefined) attributes.customerImpacted = params.customerImpacted;
  if (params.customerImpactScope !== undefined) attributes.customerImpactScope = params.customerImpactScope;
  if (params.customerImpactStart !== undefined) attributes.customerImpactStart = new Date(params.customerImpactStart);
  if (params.customerImpactEnd !== undefined) attributes.customerImpactEnd = new Date(params.customerImpactEnd);
  if (params.detected !== undefined) attributes.detected = new Date(params.detected);

  const data = new v2.IncidentUpdateData();
  data.id = params.incidentId;
  data.type = "incidents" as v2.IncidentType;
  data.attributes = attributes;

  const body = new v2.IncidentUpdateRequest();
  body.data = data;

  const response = await incidentsApi.updateIncident({
    incidentId: params.incidentId,
    body,
  });

  return formatIncident(response.data!);
}

// --- Delete Incident ---

export const deleteIncidentSchema = z.object({
  incidentId: z.string().describe("The incident ID to delete"),
});

export async function deleteIncident(params: z.infer<typeof deleteIncidentSchema>) {
  assertWriteAllowed();

  await incidentsApi.deleteIncident({
    incidentId: params.incidentId,
  });

  return { deleted: true, incidentId: params.incidentId };
}

// --- Helper ---

function formatIncident(inc: v2.IncidentResponseData) {
  return {
    id: inc.id,
    title: inc.attributes?.title,
    status: inc.attributes?.state,
    severity: inc.attributes?.severity,
    created: inc.attributes?.created?.toISOString(),
    modified: inc.attributes?.modified?.toISOString(),
    resolved: inc.attributes?.resolved?.toISOString(),
    customerImpactScope: inc.attributes?.customerImpactScope,
    customerImpacted: inc.attributes?.customerImpacted,
    detected: inc.attributes?.detected?.toISOString(),
    fields: inc.attributes?.fields,
  };
}
