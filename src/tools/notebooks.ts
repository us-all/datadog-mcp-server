import { z } from "zod/v4";
import { notebooksApi } from "../client.js";

export const listNotebooksSchema = z.object({
  query: z.string().optional().describe("Search query to filter notebooks by name"),
  authorHandle: z.string().optional().describe("Filter by author handle (email)"),
  count: z.number().optional().default(50).describe("Number of results to return"),
  start: z.number().optional().default(0).describe("Pagination offset"),
  sortField: z.string().optional().default("modified").describe("Sort field: modified, name, created"),
  sortDir: z.string().optional().default("desc").describe("Sort direction: asc or desc"),
  includeCells: z.boolean().optional().default(false).describe("Include notebook cell contents"),
});

export async function listNotebooks(params: z.infer<typeof listNotebooksSchema>) {
  const response = await notebooksApi.listNotebooks({
    query: params.query,
    authorHandle: params.authorHandle,
    count: params.count,
    start: params.start,
    sortField: params.sortField,
    sortDir: params.sortDir,
    includeCells: params.includeCells,
  });

  const notebooks = response.data ?? [];
  return {
    total: response.meta?.page?.totalCount,
    count: notebooks.length,
    notebooks: notebooks.map((n) => ({
      id: n.id,
      name: n.attributes?.name,
      author: n.attributes?.author,
      status: n.attributes?.status,
      created: n.attributes?.created?.toISOString(),
      modified: n.attributes?.modified?.toISOString(),
      cellCount: n.attributes?.cells?.length,
    })),
  };
}

export const getNotebookSchema = z.object({
  notebookId: z.number().describe("Notebook ID"),
});

export async function getNotebook(params: z.infer<typeof getNotebookSchema>) {
  const response = await notebooksApi.getNotebook({
    notebookId: params.notebookId,
  });

  const n = response.data;
  return {
    id: n?.id,
    name: n?.attributes?.name,
    author: n?.attributes?.author,
    status: n?.attributes?.status,
    created: n?.attributes?.created?.toISOString(),
    modified: n?.attributes?.modified?.toISOString(),
    cells: n?.attributes?.cells?.map((c) => ({
      id: c.id,
      type: c.type,
      attributes: c.attributes,
    })),
    metadata: n?.attributes?.metadata,
  };
}
