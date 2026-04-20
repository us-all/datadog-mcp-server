import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { statusPagesApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// ============================================================
// Status Pages
// ============================================================

export const listStatusPagesSchema = z.object({
  pageOffset: z.coerce.number().optional().describe("Offset for pagination"),
  pageLimit: z.coerce.number().optional().default(25).describe("Number of status pages per page (default 25)"),
});

export async function listStatusPages(params: z.infer<typeof listStatusPagesSchema>) {
  const response = await statusPagesApi.listStatusPages({
    pageOffset: params.pageOffset,
    pageLimit: params.pageLimit,
  });

  const pages = response.data ?? [];
  return {
    count: pages.length,
    pages: pages.map(formatStatusPage),
  };
}

export const getStatusPageSchema = z.object({
  pageId: z.string().describe("The status page ID"),
});

export async function getStatusPage(params: z.infer<typeof getStatusPageSchema>) {
  const response = await statusPagesApi.getStatusPage({
    pageId: params.pageId,
  });

  return formatStatusPage(response.data!);
}

export const createStatusPageSchema = z.object({
  name: z.string().describe("Name of the status page"),
  domainPrefix: z.string().describe("Unique domain prefix for the status page URL"),
  type: z.enum(["public", "internal"]).describe("Page type: public (internet-accessible) or internal (org-only)"),
  visualizationType: z.enum(["component_list"]).describe("Visualization type (currently only 'component_list')"),
  enabled: z.boolean().optional().default(false).describe("Whether the page is enabled on creation"),
  subscriptionsEnabled: z.boolean().optional().describe("Whether email subscriptions are enabled"),
});

export async function createStatusPage(params: z.infer<typeof createStatusPageSchema>) {
  assertWriteAllowed();

  const attributes = new v2.CreateStatusPageRequestDataAttributes();
  attributes.name = params.name;
  attributes.domainPrefix = params.domainPrefix;
  attributes.type = params.type as v2.CreateStatusPageRequestDataAttributesType;
  attributes.visualizationType = params.visualizationType as v2.CreateStatusPageRequestDataAttributesVisualizationType;
  attributes.enabled = params.enabled!;
  if (params.subscriptionsEnabled !== undefined) attributes.subscriptionsEnabled = params.subscriptionsEnabled;

  const data = new v2.CreateStatusPageRequestData();
  data.type = "status_page" as v2.StatusPageDataType;
  data.attributes = attributes;

  const body = new v2.CreateStatusPageRequest();
  body.data = data;

  const response = await statusPagesApi.createStatusPage({ body });
  return formatStatusPage(response.data!);
}

export const updateStatusPageSchema = z.object({
  pageId: z.string().describe("The status page ID to update"),
  name: z.string().optional().describe("Updated name"),
  domainPrefix: z.string().optional().describe("Updated domain prefix"),
  subscriptionsEnabled: z.boolean().optional().describe("Whether email subscriptions are enabled"),
});

export async function updateStatusPage(params: z.infer<typeof updateStatusPageSchema>) {
  assertWriteAllowed();

  const attributes = new v2.PatchStatusPageRequestDataAttributes();
  if (params.name !== undefined) attributes.name = params.name;
  if (params.domainPrefix !== undefined) attributes.domainPrefix = params.domainPrefix;
  if (params.subscriptionsEnabled !== undefined) attributes.subscriptionsEnabled = params.subscriptionsEnabled;

  const data = new v2.PatchStatusPageRequestData();
  data.id = params.pageId;
  data.type = "status_page" as v2.StatusPageDataType;
  data.attributes = attributes;

  const body = new v2.PatchStatusPageRequest();
  body.data = data;

  const response = await statusPagesApi.updateStatusPage({ pageId: params.pageId, body });
  return formatStatusPage(response.data!);
}

export const deleteStatusPageSchema = z.object({
  pageId: z.string().describe("The status page ID to delete"),
});

export async function deleteStatusPage(params: z.infer<typeof deleteStatusPageSchema>) {
  assertWriteAllowed();
  await statusPagesApi.deleteStatusPage({ pageId: params.pageId });
  return { deleted: true, pageId: params.pageId };
}

export const publishStatusPageSchema = z.object({
  pageId: z.string().describe("The status page ID to publish"),
});

export async function publishStatusPage(params: z.infer<typeof publishStatusPageSchema>) {
  assertWriteAllowed();
  await statusPagesApi.publishStatusPage({ pageId: params.pageId });
  return { published: true, pageId: params.pageId };
}

export const unpublishStatusPageSchema = z.object({
  pageId: z.string().describe("The status page ID to unpublish"),
});

export async function unpublishStatusPage(params: z.infer<typeof unpublishStatusPageSchema>) {
  assertWriteAllowed();
  await statusPagesApi.unpublishStatusPage({ pageId: params.pageId });
  return { unpublished: true, pageId: params.pageId };
}

// ============================================================
// Components
// ============================================================

export const listStatusPageComponentsSchema = z.object({
  pageId: z.string().describe("The status page ID"),
});

export async function listStatusPageComponents(params: z.infer<typeof listStatusPageComponentsSchema>) {
  const response = await statusPagesApi.listComponents({ pageId: params.pageId });
  const components = response.data ?? [];
  return {
    count: components.length,
    components: components.map(formatComponent),
  };
}

export const getStatusPageComponentSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  componentId: z.string().describe("The component ID"),
});

export async function getStatusPageComponent(params: z.infer<typeof getStatusPageComponentSchema>) {
  const response = await statusPagesApi.getComponent({
    pageId: params.pageId,
    componentId: params.componentId,
  });
  return formatComponent(response.data!);
}

export const createStatusPageComponentSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  name: z.string().describe("Name of the component"),
  position: z.coerce.number().describe("Display position (0-based)"),
  type: z.enum(["component", "group"]).describe("Type: 'component' for a single item, 'group' for a group of components"),
});

export async function createStatusPageComponent(params: z.infer<typeof createStatusPageComponentSchema>) {
  assertWriteAllowed();

  const attributes = new v2.CreateComponentRequestDataAttributes();
  attributes.name = params.name;
  attributes.position = params.position;
  attributes.type = params.type as v2.CreateComponentRequestDataAttributesType;

  const data = new v2.CreateComponentRequestData();
  data.type = "status_page_component" as v2.StatusPagesComponentGroupType;
  data.attributes = attributes;

  const body = new v2.CreateComponentRequest();
  body.data = data;

  const response = await statusPagesApi.createComponent({ pageId: params.pageId, body });
  return formatComponent(response.data!);
}

export const updateStatusPageComponentSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  componentId: z.string().describe("The component ID to update"),
  name: z.string().optional().describe("Updated name"),
  position: z.coerce.number().optional().describe("Updated display position"),
});

export async function updateStatusPageComponent(params: z.infer<typeof updateStatusPageComponentSchema>) {
  assertWriteAllowed();

  const attributes = new v2.PatchComponentRequestDataAttributes();
  if (params.name !== undefined) attributes.name = params.name;
  if (params.position !== undefined) attributes.position = params.position;

  const data = new v2.PatchComponentRequestData();
  data.id = params.componentId;
  data.type = "status_page_component" as v2.StatusPagesComponentGroupType;
  data.attributes = attributes;

  const body = new v2.PatchComponentRequest();
  body.data = data;

  const response = await statusPagesApi.updateComponent({
    pageId: params.pageId,
    componentId: params.componentId,
    body,
  });
  return formatComponent(response.data!);
}

export const deleteStatusPageComponentSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  componentId: z.string().describe("The component ID to delete"),
});

export async function deleteStatusPageComponent(params: z.infer<typeof deleteStatusPageComponentSchema>) {
  assertWriteAllowed();
  await statusPagesApi.deleteComponent({ pageId: params.pageId, componentId: params.componentId });
  return { deleted: true, pageId: params.pageId, componentId: params.componentId };
}

// ============================================================
// Degradations
// ============================================================

export const listStatusPageDegradationsSchema = z.object({
  filterPageId: z.string().optional().describe("Filter by status page ID"),
  filterStatus: z.enum(["investigating", "identified", "monitoring", "resolved"]).optional().describe("Filter by degradation status"),
  pageOffset: z.coerce.number().optional().describe("Offset for pagination"),
  pageLimit: z.coerce.number().optional().default(25).describe("Number of results per page"),
  sort: z.enum(["created_at", "-created_at", "modified_at", "-modified_at"]).optional().describe("Sort order"),
});

export async function listStatusPageDegradations(params: z.infer<typeof listStatusPageDegradationsSchema>) {
  const response = await statusPagesApi.listDegradations({
    filterPageId: params.filterPageId,
    filterStatus: params.filterStatus,
    pageOffset: params.pageOffset,
    pageLimit: params.pageLimit,
    sort: params.sort,
  });

  const degradations = response.data ?? [];
  return {
    count: degradations.length,
    degradations: degradations.map(formatDegradation),
  };
}

export const getStatusPageDegradationSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  degradationId: z.string().describe("The degradation ID"),
});

export async function getStatusPageDegradation(params: z.infer<typeof getStatusPageDegradationSchema>) {
  const response = await statusPagesApi.getDegradation({
    pageId: params.pageId,
    degradationId: params.degradationId,
  });
  return formatDegradation(response.data!);
}

export const createStatusPageDegradationSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  title: z.string().describe("Title of the degradation incident"),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]).describe("Current status of the degradation"),
  description: z.string().optional().describe("Description of the degradation"),
  componentsAffected: z.array(z.object({
    id: z.string().describe("Component ID"),
    status: z.enum(["operational", "degraded_performance", "partial_outage", "major_outage", "under_maintenance"]).describe("Component status"),
  })).describe("List of affected components with their status"),
  notifySubscribers: z.boolean().optional().describe("Whether to notify page subscribers"),
});

export async function createStatusPageDegradation(params: z.infer<typeof createStatusPageDegradationSchema>) {
  assertWriteAllowed();

  const attributes = new v2.CreateDegradationRequestDataAttributes();
  attributes.title = params.title;
  attributes.status = params.status as v2.CreateDegradationRequestDataAttributesStatus;
  if (params.description !== undefined) attributes.description = params.description;
  attributes.componentsAffected = params.componentsAffected.map((c) => {
    const item = new v2.CreateDegradationRequestDataAttributesComponentsAffectedItems();
    item.id = c.id;
    item.status = c.status as v2.StatusPagesComponentDataAttributesStatus;
    return item;
  });

  const data = new v2.CreateDegradationRequestData();
  data.type = "degradation" as v2.PatchDegradationRequestDataType;
  data.attributes = attributes;

  const body = new v2.CreateDegradationRequest();
  body.data = data;

  const response = await statusPagesApi.createDegradation({
    pageId: params.pageId,
    body,
    notifySubscribers: params.notifySubscribers,
  });
  return formatDegradation(response.data!);
}

export const updateStatusPageDegradationSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  degradationId: z.string().describe("The degradation ID to update"),
  title: z.string().optional().describe("Updated title"),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]).optional().describe("Updated status"),
  description: z.string().optional().describe("Updated description"),
  componentsAffected: z.array(z.object({
    id: z.string().describe("Component ID"),
    status: z.enum(["operational", "degraded_performance", "partial_outage", "major_outage", "under_maintenance"]).describe("Component status"),
  })).optional().describe("Updated affected components"),
  notifySubscribers: z.boolean().optional().describe("Whether to notify page subscribers"),
});

export async function updateStatusPageDegradation(params: z.infer<typeof updateStatusPageDegradationSchema>) {
  assertWriteAllowed();

  const attributes = new v2.PatchDegradationRequestDataAttributes();
  if (params.title !== undefined) attributes.title = params.title;
  if (params.status !== undefined) attributes.status = params.status as v2.PatchDegradationRequestDataAttributesStatus;
  if (params.description !== undefined) attributes.description = params.description;
  if (params.componentsAffected !== undefined) {
    attributes.componentsAffected = params.componentsAffected.map((c) => {
      const item = new v2.PatchDegradationRequestDataAttributesComponentsAffectedItems();
      item.id = c.id;
      item.status = c.status as v2.StatusPagesComponentDataAttributesStatus;
      return item;
    });
  }

  const data = new v2.PatchDegradationRequestData();
  data.id = params.degradationId;
  data.type = "degradation" as v2.PatchDegradationRequestDataType;
  data.attributes = attributes;

  const body = new v2.PatchDegradationRequest();
  body.data = data;

  const response = await statusPagesApi.updateDegradation({
    pageId: params.pageId,
    degradationId: params.degradationId,
    body,
    notifySubscribers: params.notifySubscribers,
  });
  return formatDegradation(response.data!);
}

export const deleteStatusPageDegradationSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  degradationId: z.string().describe("The degradation ID to delete"),
});

export async function deleteStatusPageDegradation(params: z.infer<typeof deleteStatusPageDegradationSchema>) {
  assertWriteAllowed();
  await statusPagesApi.deleteDegradation({ pageId: params.pageId, degradationId: params.degradationId });
  return { deleted: true, pageId: params.pageId, degradationId: params.degradationId };
}

// ============================================================
// Maintenances
// ============================================================

export const listStatusPageMaintenancesSchema = z.object({
  filterPageId: z.string().optional().describe("Filter by status page ID"),
  filterStatus: z.enum(["scheduled", "in_progress", "completed"]).optional().describe("Filter by maintenance status"),
  pageOffset: z.coerce.number().optional().describe("Offset for pagination"),
  pageLimit: z.coerce.number().optional().default(25).describe("Number of results per page"),
  sort: z.enum(["created_at", "-created_at", "start_date", "-start_date"]).optional().describe("Sort order"),
});

export async function listStatusPageMaintenances(params: z.infer<typeof listStatusPageMaintenancesSchema>) {
  const response = await statusPagesApi.listMaintenances({
    filterPageId: params.filterPageId,
    filterStatus: params.filterStatus,
    pageOffset: params.pageOffset,
    pageLimit: params.pageLimit,
    sort: params.sort,
  });

  const maintenances = response.data ?? [];
  return {
    count: maintenances.length,
    maintenances: maintenances.map(formatMaintenance),
  };
}

export const getStatusPageMaintenanceSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  maintenanceId: z.string().describe("The maintenance ID"),
});

export async function getStatusPageMaintenance(params: z.infer<typeof getStatusPageMaintenanceSchema>) {
  const response = await statusPagesApi.getMaintenance({
    pageId: params.pageId,
    maintenanceId: params.maintenanceId,
  });
  return formatMaintenance(response.data!);
}

export const createStatusPageMaintenanceSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  title: z.string().describe("Title of the maintenance window"),
  startDate: z.string().optional().describe("Scheduled start date (ISO 8601 format)"),
  scheduledDescription: z.string().optional().describe("Description shown when maintenance is scheduled"),
  inProgressDescription: z.string().optional().describe("Description shown when maintenance is in progress"),
  completedDescription: z.string().optional().describe("Description shown when maintenance is completed"),
  componentsAffected: z.array(z.object({
    id: z.string().describe("Component ID"),
    status: z.enum(["operational", "degraded_performance", "partial_outage", "major_outage", "under_maintenance"]).describe("Component status during maintenance"),
  })).describe("List of affected components"),
  notifySubscribers: z.boolean().optional().describe("Whether to notify page subscribers"),
});

export async function createStatusPageMaintenance(params: z.infer<typeof createStatusPageMaintenanceSchema>) {
  assertWriteAllowed();

  const attributes = new v2.CreateMaintenanceRequestDataAttributes();
  attributes.title = params.title;
  if (params.startDate !== undefined) attributes.startDate = new Date(params.startDate);
  if (params.scheduledDescription !== undefined) attributes.scheduledDescription = params.scheduledDescription;
  if (params.inProgressDescription !== undefined) attributes.inProgressDescription = params.inProgressDescription;
  if (params.completedDescription !== undefined) attributes.completedDescription = params.completedDescription;
  attributes.componentsAffected = params.componentsAffected.map((c) => {
    const item = new v2.CreateMaintenanceRequestDataAttributesComponentsAffectedItems();
    item.id = c.id;
    item.status = c.status as v2.PatchMaintenanceRequestDataAttributesComponentsAffectedItemsStatus;
    return item;
  });

  const data = new v2.CreateMaintenanceRequestData();
  data.type = "maintenance" as v2.PatchMaintenanceRequestDataType;
  data.attributes = attributes;

  const body = new v2.CreateMaintenanceRequest();
  body.data = data;

  const response = await statusPagesApi.createMaintenance({
    pageId: params.pageId,
    body,
    notifySubscribers: params.notifySubscribers,
  });
  return formatMaintenance(response.data!);
}

export const updateStatusPageMaintenanceSchema = z.object({
  pageId: z.string().describe("The status page ID"),
  maintenanceId: z.string().describe("The maintenance ID to update"),
  title: z.string().optional().describe("Updated title"),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional().describe("Updated status"),
  startDate: z.string().optional().describe("Updated start date (ISO 8601)"),
  scheduledDescription: z.string().optional().describe("Updated scheduled description"),
  inProgressDescription: z.string().optional().describe("Updated in-progress description"),
  completedDescription: z.string().optional().describe("Updated completed description"),
  componentsAffected: z.array(z.object({
    id: z.string().describe("Component ID"),
    status: z.enum(["operational", "degraded_performance", "partial_outage", "major_outage", "under_maintenance"]).describe("Component status"),
  })).optional().describe("Updated affected components"),
  notifySubscribers: z.boolean().optional().describe("Whether to notify page subscribers"),
});

export async function updateStatusPageMaintenance(params: z.infer<typeof updateStatusPageMaintenanceSchema>) {
  assertWriteAllowed();

  const attributes = new v2.PatchMaintenanceRequestDataAttributes();
  if (params.title !== undefined) attributes.title = params.title;
  if (params.status !== undefined) attributes.status = params.status as v2.MaintenanceDataAttributesStatus;
  if (params.startDate !== undefined) attributes.startDate = new Date(params.startDate);
  if (params.scheduledDescription !== undefined) attributes.scheduledDescription = params.scheduledDescription;
  if (params.inProgressDescription !== undefined) attributes.inProgressDescription = params.inProgressDescription;
  if (params.completedDescription !== undefined) attributes.completedDescription = params.completedDescription;
  if (params.componentsAffected !== undefined) {
    attributes.componentsAffected = params.componentsAffected.map((c) => {
      const item = new v2.PatchMaintenanceRequestDataAttributesComponentsAffectedItems();
      item.id = c.id;
      item.status = c.status as v2.PatchMaintenanceRequestDataAttributesComponentsAffectedItemsStatus;
      return item;
    });
  }

  const data = new v2.PatchMaintenanceRequestData();
  data.id = params.maintenanceId;
  data.type = "maintenance" as v2.PatchMaintenanceRequestDataType;
  data.attributes = attributes;

  const body = new v2.PatchMaintenanceRequest();
  body.data = data;

  const response = await statusPagesApi.updateMaintenance({
    pageId: params.pageId,
    maintenanceId: params.maintenanceId,
    body,
    notifySubscribers: params.notifySubscribers,
  });
  return formatMaintenance(response.data!);
}

// ============================================================
// Helpers
// ============================================================

function formatStatusPage(page: any) {
  return {
    id: page.id,
    name: page.attributes?.name,
    domainPrefix: page.attributes?.domainPrefix,
    type: page.attributes?.type,
    enabled: page.attributes?.enabled,
    subscriptionsEnabled: page.attributes?.subscriptionsEnabled,
    visualizationType: page.attributes?.visualizationType,
    url: page.attributes?.url,
    createdAt: page.attributes?.createdAt?.toISOString?.() ?? page.attributes?.createdAt,
    modifiedAt: page.attributes?.modifiedAt?.toISOString?.() ?? page.attributes?.modifiedAt,
  };
}

function formatComponent(component: any) {
  return {
    id: component.id,
    name: component.attributes?.name,
    type: component.attributes?.type,
    position: component.attributes?.position,
    status: component.attributes?.status,
    createdAt: component.attributes?.createdAt?.toISOString?.() ?? component.attributes?.createdAt,
    modifiedAt: component.attributes?.modifiedAt?.toISOString?.() ?? component.attributes?.modifiedAt,
  };
}

function formatDegradation(degradation: any) {
  return {
    id: degradation.id,
    title: degradation.attributes?.title,
    description: degradation.attributes?.description,
    status: degradation.attributes?.status,
    componentsAffected: degradation.attributes?.componentsAffected,
    updates: degradation.attributes?.updates,
    createdAt: degradation.attributes?.createdAt?.toISOString?.() ?? degradation.attributes?.createdAt,
    modifiedAt: degradation.attributes?.modifiedAt?.toISOString?.() ?? degradation.attributes?.modifiedAt,
  };
}

function formatMaintenance(maintenance: any) {
  return {
    id: maintenance.id,
    title: maintenance.attributes?.title,
    status: maintenance.attributes?.status,
    startDate: maintenance.attributes?.startDate?.toISOString?.() ?? maintenance.attributes?.startDate,
    completedDate: maintenance.attributes?.completedDate?.toISOString?.() ?? maintenance.attributes?.completedDate,
    scheduledDescription: maintenance.attributes?.scheduledDescription,
    inProgressDescription: maintenance.attributes?.inProgressDescription,
    completedDescription: maintenance.attributes?.completedDescription,
    componentsAffected: maintenance.attributes?.componentsAffected,
    updates: maintenance.attributes?.updates,
    createdAt: maintenance.attributes?.createdAt?.toISOString?.() ?? maintenance.attributes?.createdAt,
    modifiedAt: maintenance.attributes?.modifiedAt?.toISOString?.() ?? maintenance.attributes?.modifiedAt,
  };
}
