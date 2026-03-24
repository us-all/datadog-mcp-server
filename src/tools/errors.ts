import { z } from "zod/v4";
import { errorTrackingApi } from "../client.js";

export const listErrorTrackingIssuesSchema = z.object({
  query: z.string().optional().default("*").describe("Search query to filter error tracking issues. Example: service:api-server error_type:TypeError"),
  sort: z.string().optional().default("-last_seen").describe("Sort order. Example: first_seen, -first_seen, last_seen, -last_seen"),
  pageSize: z.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageCursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export async function listErrorTrackingIssues(params: z.infer<typeof listErrorTrackingIssuesSchema>) {
  const response = await errorTrackingApi.searchIssues({
    body: {
      data: {
        type: "issues_search_request",
      } as any,
    },
  });

  const issues = response.data ?? [];
  return {
    count: issues.length,
    issues: issues.map((i) => {
      const attrs = i.attributes as any;
      return {
        id: i.id,
        type: i.type,
        impactedSessions: i.attributes?.impactedSessions,
        impactedUsers: i.attributes?.impactedUsers,
        totalCount: i.attributes?.totalCount,
        errorType: attrs?.errorType,
        errorMessage: attrs?.errorMessage,
        service: attrs?.service,
        platform: attrs?.platform,
        state: attrs?.state,
        firstSeen: attrs?.firstSeen ? new Date(attrs.firstSeen).toISOString() : undefined,
        lastSeen: attrs?.lastSeen ? new Date(attrs.lastSeen).toISOString() : undefined,
      };
    }),
  };
}

export const getErrorTrackingIssueSchema = z.object({
  issueId: z.string().describe("The error tracking issue ID"),
});

export async function getErrorTrackingIssue(params: z.infer<typeof getErrorTrackingIssueSchema>) {
  const response = await errorTrackingApi.getIssue({
    issueId: params.issueId,
  });

  const i = response.data;
  return {
    id: i?.id,
    type: i?.type,
    errorType: i?.attributes?.errorType,
    errorMessage: i?.attributes?.errorMessage,
    service: i?.attributes?.service,
    platform: i?.attributes?.platform,
    state: i?.attributes?.state,
    firstSeen: i?.attributes?.firstSeen ? new Date(i.attributes.firstSeen).toISOString() : undefined,
    lastSeen: i?.attributes?.lastSeen ? new Date(i.attributes.lastSeen).toISOString() : undefined,
    filePath: i?.attributes?.filePath,
    functionName: i?.attributes?.functionName,
    languages: i?.attributes?.languages,
  };
}
