import { z } from "zod/v4";
import { usageMeteringApi, usersApi } from "../client.js";

export const getUsageSummarySchema = z.object({
  startMonth: z.string().describe("Start month (ISO 8601). Example: 2026-01-01T00:00:00Z"),
  endMonth: z.string().optional().describe("End month (ISO 8601). Example: 2026-02-01T00:00:00Z"),
  includeOrgDetails: z.boolean().optional().describe("Include organization details breakdown"),
});

export async function getUsageSummary(params: z.infer<typeof getUsageSummarySchema>) {
  const response = await usageMeteringApi.getUsageSummary({
    startMonth: new Date(params.startMonth),
    endMonth: params.endMonth ? new Date(params.endMonth) : undefined,
    includeOrgDetails: params.includeOrgDetails,
  });

  return {
    startDate: response.startDate?.toISOString(),
    endDate: response.endDate?.toISOString(),
    usage: response.usage?.map((u) => ({
      date: u.date?.toISOString(),
      agentHostTop99pCount: u.agentHostTop99p,
      containerCount: u.containerAvg,
      customTsCount: u.customTsAvg,
      logsIndexedCount: u.indexedEventsCountSum,
      ingestedEventsBytesSum: u.ingestedEventsBytesSum,
      apmHostTop99pCount: u.apmHostTop99p,
      rumSessionCountSum: u.rumSessionCountSum,
      syntheticsCheckCallsCountSum: u.syntheticsCheckCallsCountSum,
    })),
  };
}

export const listUsersSchema = z.object({
  pageSize: z.number().optional().default(50).describe("Number of results per page (default 50)"),
  pageNumber: z.number().optional().default(0).describe("Page number (0-based)"),
  filter: z.string().optional().describe("Search filter string. Example: john"),
  filterStatus: z.string().optional().describe("Filter by user status. Example: Active, Pending, Disabled"),
  sort: z.string().optional().describe("Sort field. Example: name, email, created_at"),
  sortDir: z.enum(["asc", "desc"]).optional().describe("Sort direction: asc or desc"),
});

export async function listUsers(params: z.infer<typeof listUsersSchema>) {
  const response = await usersApi.listUsers({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    filter: params.filter,
    filterStatus: params.filterStatus,
    sort: params.sort,
    sortDir: params.sortDir as any,
  });

  const users = response.data ?? [];
  return {
    count: users.length,
    users: users.map((u) => ({
      id: u.id,
      email: u.attributes?.email,
      name: u.attributes?.name,
      title: u.attributes?.title,
      status: u.attributes?.status,
      verified: u.attributes?.verified,
      disabled: u.attributes?.disabled,
      icon: u.attributes?.icon,
      createdAt: u.attributes?.createdAt?.toISOString(),
      modifiedAt: u.attributes?.modifiedAt?.toISOString(),
    })),
  };
}
