import { z } from "zod/v4";
import { processesApi } from "../client.js";

export const listProcessesSchema = z.object({
  search: z.string().optional().describe("Search query string to filter processes. Example: nginx, python"),
  tags: z.string().optional().describe("Comma-separated list of tags to filter by. Example: env:production,service:api"),
  from: z.number().optional().describe("Unix timestamp (seconds) for start of data collection window"),
  to: z.number().optional().describe("Unix timestamp (seconds) for end of data collection window"),
  pageSize: z.number().optional().default(50).describe("Number of results per page (default 50, max 1000)"),
  pageCursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export async function listProcesses(params: z.infer<typeof listProcessesSchema>) {
  const response = await processesApi.listProcesses({
    search: params.search,
    tags: params.tags,
    from: params.from,
    to: params.to,
    pageLimit: params.pageSize,
    pageCursor: params.pageCursor,
  });

  const processes = response.data ?? [];
  return {
    count: processes.length,
    nextCursor: response.meta?.page?.after,
    processes: processes.map((p) => ({
      id: p.id,
      type: p.type,
      attributes: p.attributes,
    })),
  };
}
