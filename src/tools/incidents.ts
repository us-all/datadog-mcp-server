import { z } from "zod/v4";
import { incidentsApi } from "../client.js";

export const getIncidentsSchema = z.object({
  pageSize: z.number().optional().default(25).describe("Number of results per page (default 25)"),
  pageOffset: z.number().optional().default(0).describe("Pagination offset"),
});

export async function getIncidents(params: z.infer<typeof getIncidentsSchema>) {
  const response = await incidentsApi.listIncidents({
    pageSize: params.pageSize,
    pageOffset: params.pageOffset,
  });

  const incidents = response.data ?? [];
  return {
    count: incidents.length,
    incidents: incidents.map((inc) => ({
      id: inc.id,
      title: inc.attributes?.title,
      status: inc.attributes?.state,
      severity: inc.attributes?.severity,
      created: inc.attributes?.created?.toISOString(),
      modified: inc.attributes?.modified?.toISOString(),
      resolved: inc.attributes?.resolved?.toISOString(),
      customerImpactScope: inc.attributes?.customerImpactScope,
      customerImpacted: inc.attributes?.customerImpacted,
      fields: inc.attributes?.fields,
    })),
  };
}
