import { z } from "zod/v4";
import { caseManagementApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

export const listCasesSchema = z.object({
  query: z.string().optional().describe("Search query to filter cases. Example: status:open priority:P1"),
  pageSize: z.number().optional().default(25).describe("Number of results per page (default 25)"),
  pageNumber: z.number().optional().default(0).describe("Page number (0-based)"),
  sortField: z.enum(["created_at", "priority", "status"]).optional().default("created_at").describe("Field to sort by"),
});

export async function listCases(params: z.infer<typeof listCasesSchema>) {
  const response = await caseManagementApi.searchCases({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    sortField: params.sortField as any,
    filter: params.query,
  });

  const cases = response.data ?? [];
  return {
    count: cases.length,
    cases: cases.map((c) => ({
      id: c.id,
      title: c.attributes?.title,
      description: c.attributes?.description,
      status: c.attributes?.status,
      statusName: c.attributes?.statusName,
      priority: c.attributes?.priority,
      type: c.attributes?.type,
      key: c.attributes?.key,
      createdAt: c.attributes?.createdAt?.toISOString(),
      modifiedAt: c.attributes?.modifiedAt?.toISOString(),
    })),
  };
}

export const getCaseSchema = z.object({
  caseId: z.string().describe("The case ID (UUID)"),
});

export async function getCase(params: z.infer<typeof getCaseSchema>) {
  const response = await caseManagementApi.getCase({
    caseId: params.caseId,
  });

  const c = response.data;
  return {
    id: c?.id,
    title: c?.attributes?.title,
    description: c?.attributes?.description,
    status: c?.attributes?.status,
    statusName: c?.attributes?.statusName,
    priority: c?.attributes?.priority,
    type: c?.attributes?.type,
    key: c?.attributes?.key,
    createdAt: c?.attributes?.createdAt?.toISOString(),
    modifiedAt: c?.attributes?.modifiedAt?.toISOString(),
    jiraIssue: c?.attributes?.jiraIssue,
    serviceNowTicket: c?.attributes?.serviceNowTicket,
  };
}

export const createCaseSchema = z.object({
  title: z.string().describe("Case title"),
  description: z.string().optional().describe("Detailed description of the case"),
  priority: z.enum(["NOT_DEFINED", "P1", "P2", "P3", "P4", "P5"]).optional().default("NOT_DEFINED").describe("Case priority"),
  typeId: z.string().describe("Case type ID. Use list-cases to find valid type IDs"),
});

export async function createCase(params: z.infer<typeof createCaseSchema>) {
  assertWriteAllowed();

  const response = await caseManagementApi.createCase({
    body: {
      data: {
        type: "case",
        attributes: {
          title: params.title,
          description: params.description,
          priority: params.priority as any,
          typeId: params.typeId,
        },
      },
    },
  });

  const c = response.data;
  return {
    id: c?.id,
    title: c?.attributes?.title,
    status: c?.attributes?.status,
    priority: c?.attributes?.priority,
    createdAt: c?.attributes?.createdAt?.toISOString(),
  };
}

export const updateCaseStatusSchema = z.object({
  caseId: z.string().describe("The case ID (UUID)"),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).describe("New status for the case"),
});

export async function updateCaseStatus(params: z.infer<typeof updateCaseStatusSchema>) {
  assertWriteAllowed();

  const response = await caseManagementApi.updateStatus({
    caseId: params.caseId,
    body: {
      data: {
        type: "case",
        attributes: {
          status: params.status as any,
        },
      },
    },
  });

  const c = response.data;
  return {
    id: c?.id,
    title: c?.attributes?.title,
    status: c?.attributes?.status,
    modifiedAt: c?.attributes?.modifiedAt?.toISOString(),
  };
}
