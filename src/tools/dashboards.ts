import { z } from "zod/v4";
import { dashboardsApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";
import { applyExtractFields, extractFieldsDescription } from "./extract-fields.js";

export const getDashboardsSchema = z.object({
  filterShared: z.boolean().optional().describe("Filter shared dashboards only"),
  count: z.coerce.number().optional().default(100).describe("Number of dashboards to return"),
  start: z.coerce.number().optional().default(0).describe("Pagination offset"),
  extractFields: z.string().optional().describe(extractFieldsDescription),
});

export async function getDashboards(params: z.infer<typeof getDashboardsSchema>) {
  const response = await dashboardsApi.listDashboards({
    filterShared: params.filterShared,
    count: params.count,
    start: params.start,
  });

  const dashboards = response.dashboards ?? [];
  const result = {
    total: dashboards.length,
    dashboards: dashboards.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      layoutType: d.layoutType,
      url: d.url,
      author: d.authorHandle,
      created: d.createdAt?.toISOString(),
      modified: d.modifiedAt?.toISOString(),
    })),
  };
  return applyExtractFields(result, params.extractFields);
}

export const getDashboardSchema = z.object({
  dashboardId: z.string().describe("Dashboard ID. Example: abc-def-ghi"),
  extractFields: z.string().optional().describe(extractFieldsDescription),
});

export async function getDashboard(params: z.infer<typeof getDashboardSchema>) {
  const response = await dashboardsApi.getDashboard({
    dashboardId: params.dashboardId,
  });

  const result = {
    id: response.id,
    title: response.title,
    description: response.description,
    layoutType: response.layoutType,
    url: response.url,
    author: response.authorHandle,
    created: response.createdAt?.toISOString(),
    modified: response.modifiedAt?.toISOString(),
    widgets: response.widgets?.map((w) => ({
      id: w.id,
      definition: w.definition,
    })),
    templateVariables: response.templateVariables,
    notifyList: response.notifyList,
  };
  return applyExtractFields(result, params.extractFields);
}

export const createDashboardSchema = z.object({
  title: z.string().describe("Dashboard title. Example: Production Overview"),
  layoutType: z.enum(["ordered", "free"]).describe("Layout type: ordered (auto-arranged) or free (manual placement)"),
  description: z.string().optional().describe("Dashboard description"),
  widgets: z.array(z.record(z.string(), z.any())).describe("Array of widget definitions (each with a 'definition' key)"),
  tags: z.array(z.string()).optional().describe("Tags for the dashboard. Example: [\"env:prod\"]"),
  templateVariables: z.array(z.record(z.string(), z.any())).optional().describe("Template variables for dynamic filtering"),
});

export async function createDashboard(params: z.infer<typeof createDashboardSchema>) {
  assertWriteAllowed();
  const response = await dashboardsApi.createDashboard({
    body: {
      title: params.title,
      layoutType: params.layoutType as any,
      description: params.description,
      widgets: params.widgets as any,
      tags: params.tags,
      templateVariables: params.templateVariables as any,
    },
  });

  return {
    id: response.id,
    title: response.title,
    layoutType: response.layoutType,
    url: response.url,
    created: response.createdAt?.toISOString(),
  };
}

export const updateDashboardSchema = z.object({
  dashboardId: z.string().describe("Dashboard ID to update. Example: abc-def-ghi"),
  title: z.string().describe("Dashboard title"),
  layoutType: z.enum(["ordered", "free"]).describe("Layout type"),
  description: z.string().optional().describe("Dashboard description"),
  widgets: z.array(z.record(z.string(), z.any())).describe("Array of widget definitions"),
  tags: z.array(z.string()).optional().describe("Tags"),
  templateVariables: z.array(z.record(z.string(), z.any())).optional().describe("Template variables"),
});

export async function updateDashboard(params: z.infer<typeof updateDashboardSchema>) {
  assertWriteAllowed();
  const response = await dashboardsApi.updateDashboard({
    dashboardId: params.dashboardId,
    body: {
      title: params.title,
      layoutType: params.layoutType as any,
      description: params.description,
      widgets: params.widgets as any,
      tags: params.tags,
      templateVariables: params.templateVariables as any,
    },
  });

  return {
    id: response.id,
    title: response.title,
    layoutType: response.layoutType,
    url: response.url,
    modified: response.modifiedAt?.toISOString(),
  };
}

export const deleteDashboardSchema = z.object({
  dashboardId: z.string().describe("Dashboard ID to delete. Example: abc-def-ghi"),
});

export async function deleteDashboard(params: z.infer<typeof deleteDashboardSchema>) {
  assertWriteAllowed();
  const response = await dashboardsApi.deleteDashboard({
    dashboardId: params.dashboardId,
  });

  return {
    deletedDashboardId: response.deletedDashboardId,
  };
}
