import { z } from "zod/v4";
import { ciPipelinesApi, ciTestsApi } from "../client.js";

// --- CI Pipelines ---

export const searchCiPipelinesSchema = z.object({
  query: z.string().optional().default("*").describe("CI pipeline search query. Example: @ci.pipeline.name:deploy @ci.status:error"),
  from: z.string().describe("Start time (ISO 8601 or relative). Example: 2026-03-01T00:00:00Z or now-24h"),
  to: z.string().describe("End time (ISO 8601 or relative). Example: 2026-03-02T00:00:00Z or now"),
  limit: z.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order"),
});

export async function searchCiPipelines(params: z.infer<typeof searchCiPipelinesSchema>) {
  const response = await ciPipelinesApi.searchCIAppPipelineEvents({
    body: {
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      page: {
        limit: params.limit,
      },
      sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
    },
  });

  const events = response.data ?? [];
  return {
    count: events.length,
    pipelines: events.map((e) => ({
      id: e.id,
      type: e.type,
      attributes: e.attributes,
    })),
  };
}

export const aggregateCiPipelinesSchema = z.object({
  query: z.string().optional().default("*").describe("CI pipeline search query for aggregation"),
  from: z.string().describe("Start time (ISO 8601 or relative)"),
  to: z.string().describe("End time (ISO 8601 or relative)"),
  aggregation: z.enum(["count", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc99"]).describe("Aggregation type"),
  metric: z.string().optional().describe("Metric to aggregate on (required for avg/sum/min/max/percentiles). Example: @duration"),
  groupBy: z.string().optional().describe("Field to group results by. Example: @ci.pipeline.name, @ci.status"),
});

export async function aggregateCiPipelines(params: z.infer<typeof aggregateCiPipelinesSchema>) {
  const compute: any[] = [{
    aggregation: params.aggregation,
    ...(params.metric ? { metric: params.metric } : {}),
  }];

  const groupBy = params.groupBy ? [{
    facet: params.groupBy,
    limit: 25,
    sort: { aggregation: params.aggregation as any },
  }] : undefined;

  const response = await ciPipelinesApi.aggregateCIAppPipelineEvents({
    body: {
      compute,
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      ...(groupBy ? { groupBy } : {}),
    },
  });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}

// --- CI Tests ---

export const searchCiTestsSchema = z.object({
  query: z.string().optional().default("*").describe("CI test search query. Example: @test.service:my-app @test.status:fail"),
  from: z.string().describe("Start time (ISO 8601 or relative). Example: now-24h"),
  to: z.string().describe("End time (ISO 8601 or relative). Example: now"),
  limit: z.number().optional().default(50).describe("Max results (default 50, max 1000)"),
  sort: z.enum(["timestamp", "-timestamp"]).optional().default("-timestamp").describe("Sort order"),
});

export async function searchCiTests(params: z.infer<typeof searchCiTestsSchema>) {
  const response = await ciTestsApi.searchCIAppTestEvents({
    body: {
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      page: {
        limit: params.limit,
      },
      sort: params.sort === "timestamp" ? "timestamp" : "-timestamp",
    },
  });

  const events = response.data ?? [];
  return {
    count: events.length,
    tests: events.map((e) => ({
      id: e.id,
      type: e.type,
      attributes: e.attributes,
    })),
  };
}

export const aggregateCiTestsSchema = z.object({
  query: z.string().optional().default("*").describe("CI test search query for aggregation"),
  from: z.string().describe("Start time (ISO 8601 or relative)"),
  to: z.string().describe("End time (ISO 8601 or relative)"),
  aggregation: z.enum(["count", "avg", "sum", "min", "max", "pc75", "pc90", "pc95", "pc99"]).describe("Aggregation type"),
  metric: z.string().optional().describe("Metric to aggregate on. Example: @duration"),
  groupBy: z.string().optional().describe("Field to group results by. Example: @test.service, @test.status"),
});

export async function aggregateCiTests(params: z.infer<typeof aggregateCiTestsSchema>) {
  const compute: any[] = [{
    aggregation: params.aggregation,
    ...(params.metric ? { metric: params.metric } : {}),
  }];

  const groupBy = params.groupBy ? [{
    facet: params.groupBy,
    limit: 25,
    sort: { aggregation: params.aggregation as any },
  }] : undefined;

  const response = await ciTestsApi.aggregateCIAppTestEvents({
    body: {
      compute,
      filter: {
        query: params.query,
        from: params.from,
        to: params.to,
      },
      ...(groupBy ? { groupBy } : {}),
    },
  });

  return {
    buckets: response.data?.buckets ?? [],
    meta: response.meta,
  };
}
