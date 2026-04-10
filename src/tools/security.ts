import { z } from "zod/v4";
import { v2 } from "@datadog/datadog-api-client";
import { securityMonitoringApi } from "../client.js";
import { assertWriteAllowed } from "./utils.js";

// --- Search Security Signals ---

export const searchSecuritySignalsSchema = z.object({
  query: z.string().optional().default("*").describe("Security signal search query. Example: type:log_detection status:high or *"),
  from: z.string().describe("Start time (ISO 8601). Example: 2026-02-26T00:00:00Z"),
  to: z.string().describe("End time (ISO 8601). Example: 2026-02-26T23:59:59Z"),
  limit: z.coerce.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order: -timestamp (newest first) or timestamp (oldest first)"),
});

export async function searchSecuritySignals(params: z.infer<typeof searchSecuritySignalsSchema>) {
  const response = await securityMonitoringApi.searchSecurityMonitoringSignals({
    body: {
      filter: {
        query: params.query,
        from: new Date(params.from),
        to: new Date(params.to),
      },
      page: {
        limit: params.limit,
      },
      sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
    },
  });

  const signals = response.data ?? [];
  return {
    count: signals.length,
    signals: signals.map((s) => ({
      id: s.id,
      type: s.type,
      message: s.attributes?.message,
      timestamp: s.attributes?.timestamp?.toISOString(),
      tags: s.attributes?.tags,
      custom: s.attributes?.custom,
    })),
  };
}

// --- Get Security Signal ---

export const getSecuritySignalSchema = z.object({
  signalId: z.string().describe("The security signal ID to retrieve"),
});

export async function getSecuritySignal(params: z.infer<typeof getSecuritySignalSchema>) {
  const response = await securityMonitoringApi.getSecurityMonitoringSignal({
    signalId: params.signalId,
  });

  return {
    id: response.data?.id,
    type: response.data?.type,
    message: response.data?.attributes?.message,
    timestamp: response.data?.attributes?.timestamp?.toISOString(),
    tags: response.data?.attributes?.tags,
    custom: response.data?.attributes?.custom,
    attributes: response.data?.attributes,
  };
}

// --- List Security Monitoring Rules ---

export const listSecurityRulesSchema = z.object({
  query: z.string().optional().describe("Search query to filter rules by name or tag"),
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25, max 100)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function listSecurityRules(params: z.infer<typeof listSecurityRulesSchema>) {
  const response = await securityMonitoringApi.listSecurityMonitoringRules({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    ...(params.query ? { query: params.query } : {}),
  });

  const rules = response.data ?? [];
  return {
    count: rules.length,
    rules: rules.map(formatRule),
  };
}

// --- Get Security Monitoring Rule ---

export const getSecurityRuleSchema = z.object({
  ruleId: z.string().describe("The security monitoring rule ID"),
});

export async function getSecurityRule(params: z.infer<typeof getSecurityRuleSchema>) {
  const response = await securityMonitoringApi.getSecurityMonitoringRule({
    ruleId: params.ruleId,
  });

  return formatRule(response);
}

// --- Delete Security Monitoring Rule ---

export const deleteSecurityRuleSchema = z.object({
  ruleId: z.string().describe("The security monitoring rule ID to delete"),
});

export async function deleteSecurityRule(params: z.infer<typeof deleteSecurityRuleSchema>) {
  assertWriteAllowed();

  await securityMonitoringApi.deleteSecurityMonitoringRule({
    ruleId: params.ruleId,
  });

  return { deleted: true, ruleId: params.ruleId };
}

// --- List Security Monitoring Suppressions ---

export const listSecuritySuppressionsSchema = z.object({
  query: z.string().optional().describe("Search query to filter suppressions"),
  pageSize: z.coerce.number().optional().default(25).describe("Number of results per page (default 25)"),
  pageNumber: z.coerce.number().optional().default(0).describe("Page number (0-based)"),
});

export async function listSecuritySuppressions(params: z.infer<typeof listSecuritySuppressionsSchema>) {
  const response = await securityMonitoringApi.listSecurityMonitoringSuppressions({
    ...(params.query ? { query: params.query } : {}),
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
  });

  const suppressions = response.data ?? [];
  return {
    count: suppressions.length,
    suppressions: suppressions.map(formatSuppression),
  };
}

// --- Get Security Monitoring Suppression ---

export const getSecuritySuppressionSchema = z.object({
  suppressionId: z.string().describe("The suppression rule ID"),
});

export async function getSecuritySuppression(params: z.infer<typeof getSecuritySuppressionSchema>) {
  const response = await securityMonitoringApi.getSecurityMonitoringSuppression({
    suppressionId: params.suppressionId,
  });

  const suppression = response.data;
  if (!suppression) throw new Error("Suppression not found");
  return formatSuppression(suppression);
}

// --- Create Security Monitoring Suppression ---

export const createSecuritySuppressionSchema = z.object({
  name: z.string().describe("Name of the suppression rule"),
  ruleQuery: z.string().describe("Rule query — detection rules matching this query will have signals suppressed. Same syntax as search bar"),
  description: z.string().optional().describe("Description of the suppression rule"),
  enabled: z.boolean().optional().default(true).describe("Whether the suppression rule is enabled (default true)"),
  suppressionQuery: z.string().optional().describe("Suppression query — signals matching this query are suppressed"),
  dataExclusionQuery: z.string().optional().describe("Data exclusion query — input events matching this are excluded from detection"),
  expirationDate: z.string().optional().describe("ISO 8601 expiration date — after this date, suppression stops"),
});

export async function createSecuritySuppression(params: z.infer<typeof createSecuritySuppressionSchema>) {
  assertWriteAllowed();

  const attributes = new v2.SecurityMonitoringSuppressionCreateAttributes();
  attributes.name = params.name;
  attributes.ruleQuery = params.ruleQuery;
  attributes.enabled = params.enabled ?? true;
  if (params.description) attributes.description = params.description;
  if (params.suppressionQuery) attributes.suppressionQuery = params.suppressionQuery;
  if (params.dataExclusionQuery) attributes.dataExclusionQuery = params.dataExclusionQuery;
  if (params.expirationDate) attributes.expirationDate = new Date(params.expirationDate).getTime();

  const data = new v2.SecurityMonitoringSuppressionCreateData();
  data.type = "suppressions" as v2.SecurityMonitoringSuppressionType;
  data.attributes = attributes;

  const body = new v2.SecurityMonitoringSuppressionCreateRequest();
  body.data = data;

  const response = await securityMonitoringApi.createSecurityMonitoringSuppression({ body });

  const suppression = response.data;
  if (!suppression) throw new Error("Failed to create suppression");
  return formatSuppression(suppression);
}

// --- Delete Security Monitoring Suppression ---

export const deleteSecuritySuppressionSchema = z.object({
  suppressionId: z.string().describe("The suppression rule ID to delete"),
});

export async function deleteSecuritySuppression(params: z.infer<typeof deleteSecuritySuppressionSchema>) {
  assertWriteAllowed();

  await securityMonitoringApi.deleteSecurityMonitoringSuppression({
    suppressionId: params.suppressionId,
  });

  return { deleted: true, suppressionId: params.suppressionId };
}

// --- Helpers ---

function formatRule(rule: v2.SecurityMonitoringRuleResponse) {
  // SecurityMonitoringRuleResponse is a union type; extract common fields
  const r = rule as Record<string, unknown>;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    isEnabled: r.isEnabled,
    isDefault: r.isDefault,
    message: r.message,
    tags: r.tags,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    creationAuthorId: r.creationAuthorId,
    queries: r.queries,
    cases: r.cases,
    filters: r.filters,
    options: r.options,
  };
}

function formatSuppression(s: v2.SecurityMonitoringSuppression) {
  return {
    id: s.id,
    type: s.type,
    name: s.attributes?.name,
    description: s.attributes?.description,
    enabled: s.attributes?.enabled,
    ruleQuery: s.attributes?.ruleQuery,
    suppressionQuery: s.attributes?.suppressionQuery,
    dataExclusionQuery: s.attributes?.dataExclusionQuery,
    expirationDate: s.attributes?.expirationDate,
    creationDate: s.attributes?.creationDate,
  };
}
