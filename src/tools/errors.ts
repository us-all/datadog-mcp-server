import { z } from "zod/v4";
import { client, v2 } from "@datadog/datadog-api-client";
import { errorTrackingApi } from "../client.js";

export const listErrorTrackingIssuesSchema = z.object({
  query: z.string().optional().default("*").describe("Search query to filter error tracking issues. Example: service:api-server error_type:TypeError"),
  from: z.string().describe("Start time (ISO 8601 or relative). Example: 2026-03-01T00:00:00Z or now-1h"),
  to: z.string().describe("End time (ISO 8601 or relative). Example: 2026-03-02T00:00:00Z or now"),
  track: z.enum(["trace", "logs", "rum"]).optional().default("trace").describe("Track to search errors in: trace (APM), logs, or rum"),
  pageSize: z.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
});

function resolveTime(input: string): number {
  const relativeMatch = input.match(/^now-(\d+)([smhd])$/);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 1000;
    return Date.now() - value * multiplier;
  }
  if (input === "now") return Date.now();
  return new Date(input).getTime();
}

export async function listErrorTrackingIssues(params: z.infer<typeof listErrorTrackingIssuesSchema>) {
  const attrs = new v2.IssuesSearchRequestDataAttributes();
  attrs.query = params.query ?? "*";
  attrs.from = resolveTime(params.from);
  attrs.to = resolveTime(params.to);
  attrs.track = params.track as any;

  const data = new v2.IssuesSearchRequestData();
  data.attributes = attrs;
  data.type = "search_request";

  const body = new v2.IssuesSearchRequest();
  body.data = data;

  const response = await errorTrackingApi.searchIssues({ body });

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
