import { z } from "zod/v4";
import { syntheticsApi } from "../client.js";

export const listSyntheticsSchema = z.object({
  pageSize: z.number().optional().default(100).describe("Number of tests per page"),
  pageNumber: z.number().optional().default(0).describe("Page number (0-based)"),
});

export async function listSynthetics(params: z.infer<typeof listSyntheticsSchema>) {
  const response = await syntheticsApi.listTests({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
  });

  const tests = response.tests ?? [];
  return {
    count: tests.length,
    tests: tests.map((t) => ({
      publicId: t.publicId,
      name: t.name,
      type: t.type,
      subtype: t.subtype,
      status: t.status,
      message: t.message,
      tags: t.tags,
      locations: t.locations,
      monitorId: t.monitorId,
      creator: t.creator,
      config: t.config,
      options: t.options,
    })),
  };
}

export const getSyntheticsResultSchema = z.object({
  publicId: z.string().describe("Synthetics test public ID (e.g., abc-def-ghi)"),
  fromTs: z.number().optional().describe("Start time in milliseconds"),
  toTs: z.number().optional().describe("End time in milliseconds"),
  probeDc: z.array(z.string()).optional().describe("Filter by probe locations"),
});

export async function getSyntheticsResult(params: z.infer<typeof getSyntheticsResultSchema>) {
  const response = await syntheticsApi.getAPITestLatestResults({
    publicId: params.publicId,
    fromTs: params.fromTs,
    toTs: params.toTs,
    probeDc: params.probeDc,
  });

  const results = response.results ?? [];
  return {
    count: results.length,
    results: results.map((r) => ({
      resultId: r.resultId,
      status: r.status,
      checkTime: r.checkTime,
      probeDc: r.probeDc,
      result: r.result,
    })),
    lastTimestamp: response.lastTimestampFetched,
  };
}

export const triggerSyntheticsSchema = z.object({
  tests: z.array(z.object({
    publicId: z.string().describe("Synthetics test public ID"),
  })).describe("List of tests to trigger"),
});

export async function triggerSynthetics(params: z.infer<typeof triggerSyntheticsSchema>) {
  const response = await syntheticsApi.triggerTests({
    body: {
      tests: params.tests.map((t) => ({
        publicId: t.publicId,
      })),
    },
  });

  return {
    triggeredCheckIds: response.triggeredCheckIds,
    results: response.results?.map((r) => ({
      publicId: r.publicId,
      resultId: r.resultId,
      location: r.location,
    })),
    locations: response.locations,
  };
}

export const createSyntheticsTestSchema = z.object({
  name: z.string().describe("Test name"),
  type: z.enum(["api"]).describe("Test type (api)"),
  subtype: z.enum(["http", "ssl", "tcp", "dns", "icmp", "udp", "websocket", "grpc", "multi"]).optional().default("http").describe("Test subtype"),
  url: z.string().describe("URL to test"),
  method: z.string().optional().default("GET").describe("HTTP method"),
  locations: z.array(z.string()).describe("Test locations (e.g., ['aws:us-east-1'])"),
  message: z.string().optional().default("").describe("Notification message"),
  tags: z.array(z.string()).optional().describe("Tags for the test"),
  status: z.enum(["live", "paused"]).optional().default("paused").describe("Initial test status"),
  assertions: z.array(z.record(z.string(), z.any())).optional().describe("Response assertions"),
});

export async function createSyntheticsTest(params: z.infer<typeof createSyntheticsTestSchema>) {
  const response = await syntheticsApi.createSyntheticsAPITest({
    body: {
      name: params.name,
      type: "api" as any,
      subtype: params.subtype as any,
      config: {
        request: {
          url: params.url,
          method: params.method as any,
        },
        assertions: (params.assertions ?? [
          { type: "statusCode", operator: "is", target: 200 },
        ]) as any,
      },
      locations: params.locations,
      message: params.message ?? "",
      options: {
        tickEvery: 60,
      } as any,
      tags: params.tags,
      status: params.status as any,
    },
  });

  return {
    publicId: response.publicId,
    name: response.name,
    type: response.type,
    subtype: response.subtype,
    status: response.status,
    monitorId: response.monitorId,
  };
}

export const updateSyntheticsTestSchema = z.object({
  publicId: z.string().describe("Test public ID to update"),
  name: z.string().optional().describe("New test name"),
  url: z.string().optional().describe("New URL to test"),
  method: z.string().optional().describe("New HTTP method"),
  locations: z.array(z.string()).optional().describe("New test locations"),
  message: z.string().optional().describe("New notification message"),
  tags: z.array(z.string()).optional().describe("New tags"),
  status: z.enum(["live", "paused"]).optional().describe("New test status"),
  assertions: z.array(z.record(z.string(), z.any())).optional().describe("New assertions"),
});

export async function updateSyntheticsTest(params: z.infer<typeof updateSyntheticsTestSchema>) {
  const current = await syntheticsApi.getAPITest({ publicId: params.publicId });

  const response = await syntheticsApi.updateAPITest({
    publicId: params.publicId,
    body: {
      name: params.name ?? current.name,
      type: "api" as any,
      config: {
        ...current.config,
        request: {
          ...current.config?.request,
          ...(params.url ? { url: params.url } : {}),
          ...(params.method ? { method: params.method as any } : {}),
        },
        ...(params.assertions ? { assertions: params.assertions as any } : {}),
      },
      locations: params.locations ?? current.locations,
      message: params.message ?? current.message ?? "",
      options: current.options as any,
      tags: params.tags ?? current.tags,
      status: (params.status ?? current.status) as any,
    },
  });

  return {
    publicId: response.publicId,
    name: response.name,
    status: response.status,
  };
}

export const deleteSyntheticsTestSchema = z.object({
  publicIds: z.array(z.string()).describe("Array of test public IDs to delete"),
  forceDeleteDependencies: z.boolean().optional().describe("Force delete even if referenced by other resources"),
});

export async function deleteSyntheticsTest(params: z.infer<typeof deleteSyntheticsTestSchema>) {
  const response = await syntheticsApi.deleteTests({
    body: {
      publicIds: params.publicIds,
      forceDeleteDependencies: params.forceDeleteDependencies,
    },
  });

  return {
    deletedTests: response.deletedTests,
  };
}
