import { z } from "zod/v4";
import { containersApi } from "../client.js";

export const listContainersSchema = z.object({
  filterTags: z.string().optional().describe("Comma-separated tags to filter. Example: short_image:nginx,env:production"),
  groupBy: z.string().optional().describe("Group containers by attribute. Example: short_image, container_name"),
  sort: z.string().optional().describe("Sort field. Example: container_name, -cpu_percent"),
  pageSize: z.number().optional().default(20).describe("Number of results per page (default 20, max 1000)"),
  pageCursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export async function listContainers(params: z.infer<typeof listContainersSchema>) {
  const response = await containersApi.listContainers({
    filterTags: params.filterTags,
    groupBy: params.groupBy,
    sort: params.sort,
    pageSize: params.pageSize,
    pageCursor: params.pageCursor,
  });

  const containers = response.data ?? [];
  return {
    count: containers.length,
    containers: containers.map((c) => {
      const item = c as any;
      return {
        id: item.id,
        type: item.type,
        attributes: item.attributes,
      };
    }),
  };
}
