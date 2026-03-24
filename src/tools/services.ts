import { z } from "zod/v4";
import { softwareCatalogApi } from "../client.js";

export const listServicesSchema = z.object({
  pageSize: z.coerce.number().optional().default(20).describe("Number of results per page (default 20, max 100)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
  filterName: z.string().optional().describe("Filter by entity name. Example: my-service"),
  filterKind: z.string().optional().describe("Filter by entity kind. Example: service, datastore, queue"),
  filterOwner: z.string().optional().describe("Filter by owner. Example: team-backend"),
});

export async function listServices(params: z.infer<typeof listServicesSchema>) {
  const response = await softwareCatalogApi.listCatalogEntity({
    pageLimit: params.pageSize,
    pageOffset: params.pageNumber * params.pageSize,
    filterName: params.filterName,
    filterKind: params.filterKind,
    filterOwner: params.filterOwner,
  });

  const entities = response.data ?? [];
  return {
    count: entities.length,
    services: entities.map((e) => ({
      id: e.id,
      name: e.attributes?.name,
      kind: e.attributes?.kind,
      namespace: e.attributes?.namespace,
      owner: e.attributes?.owner,
      description: e.attributes?.description,
      displayName: e.attributes?.displayName,
      tags: e.attributes?.tags,
      apiVersion: e.attributes?.apiVersion,
    })),
  };
}

export const getServiceDefinitionSchema = z.object({
  entityId: z.string().describe("The entity ID (UUID) from the software catalog"),
});

export async function getServiceDefinition(params: z.infer<typeof getServiceDefinitionSchema>) {
  const response = await softwareCatalogApi.listCatalogEntity({
    filterId: params.entityId,
    pageLimit: 1,
  });

  const entity = response.data?.[0];
  if (!entity) {
    return { error: `Entity not found: ${params.entityId}` };
  }

  return {
    id: entity.id,
    name: entity.attributes?.name,
    kind: entity.attributes?.kind,
    namespace: entity.attributes?.namespace,
    owner: entity.attributes?.owner,
    description: entity.attributes?.description,
    displayName: entity.attributes?.displayName,
    tags: entity.attributes?.tags,
    apiVersion: entity.attributes?.apiVersion,
    additionalProperties: entity.attributes?.additionalProperties,
  };
}
